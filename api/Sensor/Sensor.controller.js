const SensorData = require("../../models/SensorData");

// POST /sensor/sensor-data — Receive data from ESP32 (no JWT required)
const createSensorData = async (req, res, next) => {
  try {
    const { F1, F2, F3, F4, F5, T1, T2, T3, AX, AY, AZ, ANGLE, deviceId, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const sensorData = new SensorData({
      F1, F2, F3, F4, F5,
      T1, T2, T3,
      AX, AY, AZ,
      ANGLE: ANGLE || "NORMAL",
      deviceId: deviceId || "ESP32_Insole_01",
      userId,
    });

    await sensorData.save();

    res.status(201).json({
      message: "Sensor data saved successfully",
      data: sensorData,
    });
  } catch (error) {
    next(error);
  }
};

// GET /sensor/sensor-data/latest — Get latest reading for authenticated user
const getLatestSensorData = async (req, res, next) => {
  try {
    const sensorData = await SensorData.findOne({ userId: req.user._id }).sort({ timestamp: -1 });

    if (!sensorData) {
      return res.status(200).json({
        message: "No sensor data found for this user",
        data: null,
      });
    }

    res.json({
      message: "Latest sensor data retrieved successfully",
      data: sensorData,
    });
  } catch (error) {
    next(error);
  }
};

// GET /sensor/sensor-data/history
const getSensorHistory = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const sensorData = await SensorData.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SensorData.countDocuments({ userId: req.user._id });

    res.json({
      message: "Sensor history retrieved successfully",
      data: sensorData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /sensor/sensor-data/:id
const deleteSensorData = async (req, res, next) => {
  try {
    const sensorData = await SensorData.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!sensorData) {
      return res.status(404).json({ error: "Sensor data not found" });
    }

    res.json({ message: "Sensor data deleted successfully", data: sensorData });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSensorData,
  getLatestSensorData,
  getSensorHistory,
  deleteSensorData,
};
