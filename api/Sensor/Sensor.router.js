const express = require("express");
const router = express.Router();
const passport = require("passport");
const {
  createSensorData,
  getLatestSensorData,
  getSensorHistory,
  deleteSensorData,
} = require("./Sensor.controller");

// POST — ESP32 sends data here (no JWT — ESP32 can't handle tokens)
router.post("/sensor-data", createSensorData);

// GET — latest reading for the logged-in user
router.get(
  "/sensor-data/latest",
  passport.authenticate("jwt", { session: false }),
  getLatestSensorData
);

// GET — paginated history
router.get(
  "/sensor-data/history",
  passport.authenticate("jwt", { session: false }),
  getSensorHistory
);

// DELETE — remove a specific entry
router.delete(
  "/sensor-data/:id",
  passport.authenticate("jwt", { session: false }),
  deleteSensorData
);

module.exports = router;
