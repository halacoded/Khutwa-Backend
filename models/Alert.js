const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    alertType: {
      type: String,
      enum: ["High Pressure", "Irregular Gait"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["moderate", "high"],
      default: "high",
    },
    details: {
      type: Object,
      default: {},
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

alertSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Alert", alertSchema);
