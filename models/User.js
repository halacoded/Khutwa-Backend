const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userSchema = new mongoose.Schema(
  {
    // COMMON FIELDS (both patients and doctors)
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: String,

    // ROLE - This defines the user type!
    role: {
      type: String,
      enum: ["patient", "doctor"],
      required: true,
    },

    // PATIENT-ONLY FIELDS (ignored for doctors)
    patientProfile: {
      dateOfBirth: Date,
      assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    // DOCTOR-ONLY FIELDS (ignored for patients)
    doctorProfile: {
      licenseNumber: { type: String, unique: true, sparse: true },
      specialization: String,
      hospital: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
