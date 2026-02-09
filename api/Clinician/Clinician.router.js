const express = require("express");
const clinicianRouter = express.Router();
const passport = require("passport");
const upload = require("../../middleware/multer");
const {
  signup,
  signin,
  getProfile,
  updateProfile,
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

module.exports = clinicianRouter;
