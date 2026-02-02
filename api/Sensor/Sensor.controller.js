const SensorData = require("../../models/SensorData");

// POST - Receive sensor data from ESP32
const createSensorData = async (req, res, next) => {
  try {
    const { temperature, humidity, deviceId, userId } = req.body;

    // Validate required fields
    if (temperature === undefined || humidity === undefined) {
      return res.status(400).json({
        error: "Temperature and humidity are required fields",
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    const sensorData = new SensorData({
      temperature,
      humidity,
      deviceId: deviceId || "ESP32_Sensor_01",
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

// GET - Get latest sensor data for authenticated user
const getLatestSensorData = async (req, res, next) => {
  try {
    const sensorData = await SensorData.findOne({ userId: req.user._id }).sort({
      timestamp: -1,
    });

    if (!sensorData) {
      return res.status(404).json({
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

// GET - Get sensor data history for authenticated user
const getSensorHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Validate limit
    if (limit > 100) {
      return res.status(400).json({
        error: "Limit cannot exceed 100 records",
      });
    }

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

// GET - Get sensor statistics for authenticated user
const getSensorStats = async (req, res, next) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stats = await SensorData.aggregate([
      {
        $match: {
          userId: req.user._id,
          timestamp: { $gte: twentyFourHoursAgo },
        },
      },
      {
        $group: {
          _id: null,
          avgTemperature: { $avg: "$temperature" },
          avgHumidity: { $avg: "$humidity" },
          maxTemperature: { $max: "$temperature" },
          minTemperature: { $min: "$temperature" },
          maxHumidity: { $max: "$humidity" },
          minHumidity: { $min: "$humidity" },
          totalReadings: { $sum: 1 },
        },
      },
    ]);

    if (stats.length === 0) {
      return res.json({
        message: "No sensor data available for statistics",
        data: {
          avgTemperature: 0,
          avgHumidity: 0,
          maxTemperature: 0,
          minTemperature: 0,
          maxHumidity: 0,
          minHumidity: 0,
          totalReadings: 0,
        },
      });
    }

    res.json({
      message: "Sensor statistics retrieved successfully",
      data: stats[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE - Delete sensor data by ID (optional, for cleanup)
const deleteSensorData = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sensorData = await SensorData.findOneAndDelete({
      _id: id,
      userId: req.user._id, // Ensure user can only delete their own data
    });

    if (!sensorData) {
      return res.status(404).json({
        error:
          "Sensor data not found or you don't have permission to delete it",
      });
    }

    res.json({
      message: "Sensor data deleted successfully",
      data: sensorData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSensorData,
  getLatestSensorData,
  getSensorHistory,
  getSensorStats,
  deleteSensorData,
};
