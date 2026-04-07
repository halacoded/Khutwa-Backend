const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema(
  {
    // Force sensors (FSR) — raw ADC values 0–4095
    F1: { type: Number, default: 0 }, // heel
    F2: { type: Number, default: 0 }, // mid
    F3: { type: Number, default: 0 }, // toe
    F4: { type: Number, default: 0 }, // right heel
    F5: { type: Number, default: 0 }, // right mid

    // Temperature sensors (°C)
    T1: { type: Number, default: null }, // DS18B20 (most accurate)
    T2: { type: Number, default: null }, // thermistor 1
    T3: { type: Number, default: null }, // thermistor 2

    // IMU
    AX: { type: Number, default: 0 },
    AY: { type: Number, default: 0 },
    AZ: { type: Number, default: 0 },
    ANGLE: { type: String, default: "NORMAL" }, // "NORMAL" or "ABNORMAL"

    deviceId: {
      type: String,
      default: "ESP32_Insole_01",
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

sensorDataSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model("SensorData", sensorDataSchema);
