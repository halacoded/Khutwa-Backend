const Clinician = require("../../models/Clinician");
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

const generateToken = (clinician) => {
  const payload = {
    id: clinician._id,
    email: clinician.email,
    role: "clinician",
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

// REGISTER CLINICIAN
exports.signup = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      licenseNumber,
      specialization,
      institution,
    } = req.body;
    console.log("Received data:", req.body);

    // Check if all required fields are provided
    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !phone ||
      !licenseNumber ||
      !specialization ||
      !institution
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if clinician already exists by email or license number
    const existingClinician = await Clinician.findOne({
      $or: [{ email }, { licenseNumber }],
    });
    if (existingClinician) {
      return res.status(400).json({
        message: "Clinician with this email or license number already exists",
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);
    if (!hashedPassword) {
      return res.status(500).json({ message: "Error hashing password" });
    }

    // Prepare clinician data
    const clinicianData = {
      name,
      email,
      password: hashedPassword,
      phone,
      licenseNumber,
      specialization,
      institution,
    };

    // Handle profile image upload
    if (req.files && req.files.ProfileImage) {
      clinicianData.profileImage = req.files.ProfileImage[0].filename;
    }

    // Create new clinician
    const clinician = new Clinician(clinicianData);
    await clinician.save();

    // Generate token for the new clinician
    const token = generateToken(clinician);

    res.status(201).json({
      message: "Clinician created successfully",
      token,
      clinician: {
        id: clinician._id,
        name: clinician.name,
        email: clinician.email,
        phone: clinician.phone,
        licenseNumber: clinician.licenseNumber,
        specialization: clinician.specialization,
        institution: clinician.institution,
        profileImage: clinician.profileImage,
        assignedPatients: clinician.assignedPatients,
      },
    });
  } catch (err) {
    console.error("Clinician signup error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Email or license number already exists",
      });
    }

    res
      .status(500)
      .json({ message: "Error creating clinician", error: err.message });
  }
};

// SIGNIN CLINICIAN
exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find clinician by email
    const clinician = await Clinician.findOne({ email });
    if (!clinician) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, clinician.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(clinician);

    res.status(200).json({
      message: "Login successful",
      token,
      clinician: {
        id: clinician._id,
        name: clinician.name,
        email: clinician.email,
        phone: clinician.phone,
        licenseNumber: clinician.licenseNumber,
        specialization: clinician.specialization,
        institution: clinician.institution,
        profileImage: clinician.profileImage,
        assignedPatients: clinician.assignedPatients,
      },
    });
  } catch (err) {
    console.error("Clinician signin error:", err);
    res.status(500).json({ message: "Error signing in", error: err.message });
  }
};

// GET CLINICIAN PROFILE CONTROLLER
exports.getProfile = async (req, res, next) => {
  try {
    const clinician = await Clinician.findById(req.user.id).populate(
      "assignedPatients",
      "name email ProfileImage phone dateOfBirth",
    );

    if (!clinician) {
      return res.status(404).json({ message: "Clinician not found" });
    }

    res.json({
      clinician: {
        id: clinician._id,
        name: clinician.name,
        email: clinician.email,
        phone: clinician.phone,
        licenseNumber: clinician.licenseNumber,
        specialization: clinician.specialization,
        institution: clinician.institution,
        profileImage: clinician.profileImage,
        assignedPatients: clinician.assignedPatients,
        createdAt: clinician.createdAt,
        updatedAt: clinician.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get clinician profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE CLINICIAN PROFILE CONTROLLER
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, institution } = req.body;
    const clinicianId = req.clinician.id;

    const updateData = { name, phone, institution };

    // Handle profile image upload
    if (req.files && req.files.ProfileImage) {
      // Delete old profile image if exists
      const clinician = await Clinician.findById(clinicianId);
      if (clinician.profileImage) {
        const oldImagePath = path.join(
          __dirname,
          "../../media",
          clinician.profileImage,
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.profileImage = req.files.ProfileImage[0].filename;
    }

    const updatedClinician = await Clinician.findByIdAndUpdate(
      clinicianId,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    res.json({
      message: "Profile updated successfully",
      clinician: {
        id: updatedClinician._id,
        name: updatedClinician.name,
        email: updatedClinician.email,
        phone: updatedClinician.phone,
        licenseNumber: updatedClinician.licenseNumber,
        specialization: updatedClinician.specialization,
        institution: updatedClinician.institution,
        profileImage: updatedClinician.profileImage,
        assignedPatients: updatedClinician.assignedPatients,
      },
    });
  } catch (error) {
    console.error("Update clinician profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ============================
// PATIENT MANAGEMENT CONTROLLERS
// ============================

// ASSIGN PATIENT TO CLINICIAN
exports.assignPatient = async (req, res, next) => {
  try {
    const { patientId } = req.body;
    const clinicianId = req.user.id; // From Passport JWT

    // Check if patient exists
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check if clinician exists
    const clinician = await Clinician.findById(clinicianId);
    if (!clinician) {
      return res.status(404).json({ message: "Clinician not found" });
    }

    // Check if patient already assigned
    const alreadyAssigned = clinician.assignedPatients.some(
      (id) => id.toString() === patientId,
    );

    if (alreadyAssigned) {
      return res.status(400).json({
        message: "Patient already assigned to this clinician",
      });
    }

    // Assign patient to clinician
    clinician.assignedPatients.push(patientId);
    await clinician.save();

    // Populate patient info for response
    await clinician.populate(
      "assignedPatients",
      "name email phone dateOfBirth ProfileImage",
    );

    res.status(200).json({
      message: "Patient assigned successfully",
      clinician: {
        id: clinician._id,
        name: clinician.name,
        assignedPatients: clinician.assignedPatients,
        patientCount: clinician.assignedPatients.length,
      },
    });
  } catch (error) {
    console.error("Assign patient error:", error);
    res.status(500).json({
      message: "Error assigning patient",
      error: error.message,
    });
  }
};

// REMOVE PATIENT FROM CLINICIAN
exports.removePatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const clinicianId = req.user.id;

    // Find clinician
    const clinician = await Clinician.findById(clinicianId);
    if (!clinician) {
      return res.status(404).json({ message: "Clinician not found" });
    }

    // Check if patient is assigned
    const isAssigned = clinician.assignedPatients.some(
      (id) => id.toString() === patientId,
    );

    if (!isAssigned) {
      return res.status(404).json({
        message: "Patient not found in clinician's list",
      });
    }

    // Remove patient from array
    clinician.assignedPatients = clinician.assignedPatients.filter(
      (id) => id.toString() !== patientId,
    );

    await clinician.save();
    await clinician.populate(
      "assignedPatients",
      "name email phone dateOfBirth ProfileImage",
    );

    res.status(200).json({
      message: "Patient removed successfully",
      clinician: {
        id: clinician._id,
        name: clinician.name,
        assignedPatients: clinician.assignedPatients,
        patientCount: clinician.assignedPatients.length,
      },
    });
  } catch (error) {
    console.error("Remove patient error:", error);
    res.status(500).json({
      message: "Error removing patient",
      error: error.message,
    });
  }
};

// GET ALL ASSIGNED PATIENTS
exports.getAssignedPatients = async (req, res, next) => {
  try {
    const clinicianId = req.user.id;

    const clinician = await Clinician.findById(clinicianId).populate(
      "assignedPatients",
      "name email phone dateOfBirth ProfileImage createdAt",
    );

    if (!clinician) {
      return res.status(404).json({ message: "Clinician not found" });
    }

    res.status(200).json({
      message: "Assigned patients retrieved successfully",
      count: clinician.assignedPatients.length,
      patients: clinician.assignedPatients,
    });
  } catch (error) {
    console.error("Get assigned patients error:", error);
    res.status(500).json({
      message: "Error retrieving patients",
      error: error.message,
    });
  }
};

// SEARCH PATIENTS (to add new ones)
exports.searchPatients = async (req, res, next) => {
  try {
    const { search } = req.query;
    const clinicianId = req.user.id;

    if (!search || search.length < 2) {
      return res.status(400).json({
        message: "Search query too short. Minimum 2 characters.",
      });
    }

    // Get clinician's current patients
    const clinician = await Clinician.findById(clinicianId);
    const currentPatientIds = clinician.assignedPatients.map((id) =>
      id.toString(),
    );

    // Search users who are NOT already assigned to this clinician
    const patients = await User.find({
      $and: [
        { _id: { $nin: currentPatientIds } }, // Not already assigned
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        },
      ],
    })
      .select("name email phone dateOfBirth ProfileImage")
      .limit(20);

    res.status(200).json({
      message: "Patients found",
      count: patients.length,
      patients,
    });
  } catch (error) {
    console.error("Search patients error:", error);
    res.status(500).json({
      message: "Error searching patients",
      error: error.message,
    });
  }
};

// ============================
// PATIENT DATA ACCESS CONTROLLERS
// ============================

// GET PATIENT PROFILE (Clinician view)
exports.getPatientProfile = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const clinicianId = req.user.id;

    // Verify clinician has access to this patient
    const clinician = await Clinician.findById(clinicianId);
    const hasAccess = clinician.assignedPatients.some(
      (id) => id.toString() === patientId,
    );

    if (!hasAccess) {
      return res.status(403).json({
        message: "You do not have access to this patient's data",
      });
    }

    // Get patient profile
    const patient = await User.findById(patientId).select(
      "name email phone dateOfBirth ProfileImage createdAt",
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({
      message: "Patient profile retrieved successfully",
      patient,
    });
  } catch (error) {
    console.error("Get patient profile error:", error);
    res.status(500).json({
      message: "Error retrieving patient profile",
      error: error.message,
    });
  }
};
// GET PATIENT HEALTH REPORTS (Clinician view)
// GET PATIENT ALERTS (Clinician view)
// GET PATIENT SUMMARY DASHBOARD
