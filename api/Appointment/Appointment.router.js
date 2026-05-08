const express = require("express");
const router = express.Router();
const passport = require("passport");
const { getForClinician, confirmAppointment, cancelAppointment } = require("./Appointment.controller");

const auth = passport.authenticate("clinician-jwt", { session: false });

router.get("/", auth, getForClinician);
router.put("/:id/confirm", auth, confirmAppointment);
router.put("/:id/cancel", auth, cancelAppointment);

module.exports = router;
