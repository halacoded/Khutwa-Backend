const mongoose = require("mongoose");

const clinicianSchema = new mongoose.Schema(
  {
    // Authentication
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: true,
    },

    // Personal Info
    name: {
      type: String,
      required: true,
      trim: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      required: true,
    },

    // Professional Info
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    specialization: {
      type: String,
      required: true,
      enum: [
        "podiatrist",
        "endocrinologist",
        "diabetologist",
        "wound_care_specialist",
        "general_practitioner",
        "nurse",
        "other",
      ],
      default: "general_practitioner",
    },

    institution: {
      type: String,
      required: true,
    },

    // Patient Management
    assignedPatients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // References patient Users
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Clinician", clinicianSchema);
