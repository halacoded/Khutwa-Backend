const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema(
  {
    temperature: {
      type: Number,
      required: [true, "Temperature is required"],
      min: [-50, "Temperature too low"],
      max: [100, "Temperature too high"],
    },
    humidity: {
      type: Number,
      required: [true, "Humidity is required"],
      min: [0, "Humidity cannot be negative"],
      max: [100, "Humidity cannot exceed 100%"],
    },
    deviceId: {
      type: String,
      default: "ESP32_Sensor_01",
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true, // Add index for better query performance
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true, // Add index for sorting
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Compound index for efficient queries
sensorDataSchema.index({ userId: 1, timestamp: -1 });

// Virtual for formatted timestamp
sensorDataSchema.virtual("formattedTime").get(function () {
  return this.timestamp.toLocaleString();
});

// Ensure virtual fields are serialized
sensorDataSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("SensorData", sensorDataSchema);
