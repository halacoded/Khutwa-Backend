const User = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

// SIGNUP CONTROLLER
exports.signup = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      phone,
      ...profileData
    } = req.body;
    console.log("Received data:", req.body);

    // Check if all required fields are provided
    if (!name || !email || !password || !confirmPassword || !role) {
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

    // Validate role
    if (!["patient", "doctor"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
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
      role,
      phone,
    };

    // Add role-specific profile data
    if (role === "patient") {
      userData.patientProfile = {
        dateOfBirth: profileData.dateOfBirth,
        assignedDoctor: profileData.assignedDoctor,
      };
    } else if (role === "doctor") {
      userData.doctorProfile = {
        licenseNumber: profileData.licenseNumber,
        specialization: profileData.specialization,
        hospital: profileData.hospital,
      };
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
        role: user.role,
        phone: user.phone,
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
        role: user.role,
        phone: user.phone,
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
    const user = await User.findById(req.user.id); // req.user is from JWT strategy

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile:
          user.role === "patient" ? user.patientProfile : user.doctorProfile,
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
    const { name, phone, ...profileData } = req.body;
    const userId = req.user.id;

    // Find user first to check role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = { name, phone };

    // Update role-specific profile
    if (user.role === "patient") {
      updateData.patientProfile = {
        ...user.patientProfile.toObject(),
        ...profileData,
      };
    } else if (user.role === "doctor") {
      updateData.doctorProfile = {
        ...user.doctorProfile.toObject(),
        ...profileData,
      };
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
        role: updatedUser.role,
        phone: updatedUser.phone,
        profile:
          updatedUser.role === "patient"
            ? updatedUser.patientProfile
            : updatedUser.doctorProfile,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
