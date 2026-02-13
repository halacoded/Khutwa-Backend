const User = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const saltRounds = 10;
const dotenv = require("dotenv");
dotenv.config();

const hashPassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.log({ error: error });
    throw error;
  }
};

const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    isAdmin: user.isAdmin,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

// SIGNUP CONTROLLER
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone, dateOfBirth } =
      req.body;
    console.log("Received data:", req.body);

    // Check if all required fields are provided
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);
    if (!hashedPassword) {
      return res.status(500).json({ message: "Error hashing password" });
    }

    // Prepare user data
    const userData = {
      name,
      email,
      password: hashedPassword,
      phone,
      dateOfBirth,
    };

    // Handle profile image upload
    if (req.files && req.files.ProfileImage) {
      userData.ProfileImage = req.files.ProfileImage[0].filename;
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate token for the new user
    const token = generateToken(user);

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        ProfileImage: user.ProfileImage,
        isAdmin: user.isAdmin,
        sharedWithMe: user.sharedWithMe,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
};

// SIGNIN CONTROLLER
exports.signin = async (req, res, next) => {
  try {
    // req.user is provided by passport local strategy
    const user = req.user;

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        ProfileImage: user.ProfileImage,
        isAdmin: user.isAdmin,
        sharedWithMe: user.sharedWithMe,
      },
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: "Error signing in", error: err.message });
  }
};

// GET USER PROFILE CONTROLLER
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "sharedWithMe.userId",
      "name email ProfileImage phone",
    ); // Populate shared users

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        ProfileImage: user.ProfileImage,
        isAdmin: user.isAdmin,
        sharedWithMe: user.sharedWithMe,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE USER PROFILE CONTROLLER
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, dateOfBirth, isAdmin } = req.body;
    const userId = req.user.id;

    const updateData = { name, phone, dateOfBirth, isAdmin };

    // Handle profile image upload
    if (req.files && req.files.ProfileImage) {
      // Delete old profile image if exists
      const user = await User.findById(userId);
      if (user.ProfileImage) {
        const oldImagePath = path.join(
          __dirname,
          "../../media",
          user.ProfileImage,
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.ProfileImage = req.files.ProfileImage[0].filename;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        dateOfBirth: updatedUser.dateOfBirth,
        ProfileImage: updatedUser.ProfileImage,
        isAdmin: updatedUser.isAdmin,
        sharedWithMe: updatedUser.sharedWithMe,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ============================
// SHARED ACCESS CONTROLLERS
// ============================

// ADD USER TO SHARED WITH ME (Give another user access to my data)
exports.shareMyData = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id;

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    // Check if already sharing - FIXED LOGIC
    // We need to check the targetUser's sharedWithMe array, not currentUser's
    const alreadySharing = targetUser.sharedWithMe.some(
      (item) => item.userId.toString() === currentUserId.toString(),
    );

    if (alreadySharing) {
      return res.status(400).json({
        message: "Already sharing data with this user",
      });
    }

    // Add current user to target user's sharedWithMe array
    targetUser.sharedWithMe.push({
      userId: currentUserId,
      createdAt: new Date(),
    });

    await targetUser.save();

    // Populate the response
    const updatedTargetUser = await User.findById(targetUserId).populate(
      "sharedWithMe.userId",
      "name email ProfileImage",
    );

    res.status(200).json({
      message: "Data sharing enabled successfully",
      targetUser: {
        id: updatedTargetUser._id,
        name: updatedTargetUser.name,
        email: updatedTargetUser.email,
        sharedWithMe: updatedTargetUser.sharedWithMe,
      },
    });
  } catch (error) {
    console.error("Share data error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// REMOVE USER FROM SHARED WITH ME (Revoke access to my data)
exports.removeSharedAccess = async (req, res, next) => {
  try {
    const { targetUserId } = req.params; // The user I want to revoke access from
    const currentUserId = req.user.id;

    // Remove current user from target user's sharedWithMe array
    const updatedTargetUser = await User.findByIdAndUpdate(
      targetUserId,
      {
        $pull: {
          sharedWithMe: { userId: currentUserId },
        },
      },
      { new: true },
    ).populate("sharedWithMe.userId", "name email ProfileImage");

    res.status(200).json({
      message: "Data sharing removed successfully",
      targetUser: {
        id: updatedTargetUser._id,
        name: updatedTargetUser.name,
        email: updatedTargetUser.email,
        sharedWithMe: updatedTargetUser.sharedWithMe,
      },
    });
  } catch (error) {
    console.error("Remove shared access error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL USERS WHO CAN SEE MY DATA (People I've shared with)
exports.getUsersICanSee = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // Find all users who have current user in their sharedWithMe array
    const usersWithAccess = await User.find({
      "sharedWithMe.userId": currentUserId,
    }).select("name email ProfileImage phone");

    res.status(200).json({
      message: "Users who can see your data",
      count: usersWithAccess.length,
      users: usersWithAccess.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        ProfileImage: user.ProfileImage,
        phone: user.phone,
      })),
    });
  } catch (error) {
    console.error("Get users I can see error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL USERS WHOSE DATA I CAN SEE (People sharing with me)
exports.getUsersSharingWithMe = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id).populate(
      "sharedWithMe.userId",
      "name email ProfileImage phone",
    );

    const usersSharingWithMe = currentUser.sharedWithMe.map((item) => ({
      id: item.userId._id,
      name: item.userId.name,
      email: item.userId.email,
      ProfileImage: item.userId.ProfileImage,
      phone: item.userId.phone,
      sharedSince: item.createdAt,
    }));

    res.status(200).json({
      message: "Users sharing their data with you",
      count: usersSharingWithMe.length,
      users: usersSharingWithMe,
    });
  } catch (error) {
    console.error("Get users sharing with me error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// SEARCH USERS FOR SHARING
exports.searchUsersForSharing = async (req, res, next) => {
  try {
    const { search } = req.query;
    const currentUserId = req.user.id;

    if (!search || search.length < 2) {
      return res.status(400).json({ message: "Search query too short" });
    }

    // Search users by name or email (excluding current user)
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Not current user
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        },
      ],
    })
      .select("name email ProfileImage phone")
      .limit(20);

    // Check which users already have access
    const usersWithAccessInfo = await Promise.all(
      users.map(async (user) => {
        const userDoc = await User.findById(user._id);
        const hasAccess = userDoc.sharedWithMe.some(
          (item) => item.userId.toString() === currentUserId,
        );

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          ProfileImage: user.ProfileImage,
          phone: user.phone,
          canSeeMyData: hasAccess, // Whether this user can already see my data
        };
      }),
    );

    res.status(200).json({
      message: "Users found",
      count: usersWithAccessInfo.length,
      users: usersWithAccessInfo,
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// ============================
// REMOVE USER FROM MY SHARED WITH ME (Stop seeing their data)
// ============================
exports.removeFromMyShared = async (req, res, next) => {
  try {
    const { targetUserId } = req.params; // The user I want to stop seeing
    const currentUserId = req.user.id;

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    // Remove target user from current user's sharedWithMe array
    const updatedCurrentUser = await User.findByIdAndUpdate(
      currentUserId,
      {
        $pull: {
          sharedWithMe: { userId: targetUserId },
        },
      },
      { new: true },
    ).populate("sharedWithMe.userId", "name email ProfileImage");

    res.status(200).json({
      message: "User removed from your shared list successfully",
      user: {
        id: updatedCurrentUser._id,
        name: updatedCurrentUser.name,
        email: updatedCurrentUser.email,
        sharedWithMe: updatedCurrentUser.sharedWithMe,
      },
    });
  } catch (error) {
    console.error("Remove from my shared error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
