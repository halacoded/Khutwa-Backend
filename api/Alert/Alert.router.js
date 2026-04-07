const express = require("express");
const router = express.Router();
const passport = require("passport");
const { createAlert, getAlertsForClinician, markReviewed } = require("./Alert.controller");

// Patient sends an alert (user JWT)
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  createAlert
);

// Clinician gets alerts for their patients (clinician JWT)
router.get(
  "/my-patients",
  passport.authenticate("clinician-jwt", { session: false }),
  getAlertsForClinician
);

// Clinician marks alert as reviewed
router.put(
  "/:id/reviewed",
  passport.authenticate("clinician-jwt", { session: false }),
  markReviewed
);

module.exports = router;
