const express = require("express");
const clinicianRouter = express.Router();
const passport = require("passport");
const upload = require("../../middleware/multer");
const {
  signup,
  signin,
  getProfile,
  updateProfile,
  assignPatient,
  removePatient,
  getAssignedPatients,
  searchPatients,
  getPatientProfile,
} = require("./Clinician.controller");

// Use Passport for both signin and protected routes
const clinicianLocalAuth = passport.authenticate("clinician-local", {
  session: false,
});
const clinicianJwtAuth = passport.authenticate("clinician-jwt", {
  session: false,
});

// Authentication routes
clinicianRouter.post(
  "/signup",
  upload.fields([{ name: "ProfileImage", maxCount: 1 }]),
  signup,
);

clinicianRouter.post("/signin", clinicianLocalAuth, signin); // Use Passport here!

// Clinician management routes
clinicianRouter.get("/profile", clinicianJwtAuth, getProfile);
clinicianRouter.put(
  "/profile",
  clinicianJwtAuth,
  upload.fields([{ name: "ProfileImage", maxCount: 1 }]),
  updateProfile,
);

// ============================
// PATIENT MANAGEMENT ROUTES
// ============================
// Search patients to assign
clinicianRouter.get("/patients/search", clinicianJwtAuth, searchPatients);

// Get all assigned patients
clinicianRouter.get("/patients", clinicianJwtAuth, getAssignedPatients);

// Assign a patient
clinicianRouter.post("/patients/assign", clinicianJwtAuth, assignPatient);

// Remove a patient
clinicianRouter.delete("/patients/:patientId", clinicianJwtAuth, removePatient);

// ============================
// PATIENT DATA ACCESS ROUTES
// ============================
// Get patient profile
clinicianRouter.get(
  "/patients/:patientId",
  clinicianJwtAuth,
  getPatientProfile,
);
// GET PATIENT HEALTH REPORTS (Clinician view)
// GET PATIENT ALERTS (Clinician view)
// GET PATIENT SUMMARY DASHBOARD

module.exports = clinicianRouter;
