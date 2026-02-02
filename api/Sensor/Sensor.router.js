const express = require("express");
const router = express.Router();
const passport = require("passport");
const {
  createSensorData,
  getLatestSensorData,
  getSensorHistory,
  getSensorStats,
  deleteSensorData,
} = require("./Sensor.controller");

// POST - Receive sensor data from ESP32
// This endpoint doesn't require JWT auth since ESP32 can't handle JWT tokens
router.post("/sensor-data", createSensorData);

// GET - Get latest sensor data for authenticated user
router.get(
  "/sensor-data/latest",
  passport.authenticate("jwt", { session: false }),
  getLatestSensorData
);

// GET - Get sensor data history for authenticated user
router.get(
  "/sensor-data/history",
  passport.authenticate("jwt", { session: false }),
  getSensorHistory
);

// GET - Get sensor statistics for authenticated user
router.get(
  "/sensor-data/stats",
  passport.authenticate("jwt", { session: false }),
  getSensorStats
);

// DELETE - Delete specific sensor data entry
router.delete(
  "/sensor-data/:id",
  passport.authenticate("jwt", { session: false }),
  deleteSensorData
);

module.exports = router;
