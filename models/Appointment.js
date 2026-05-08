const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clinicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinician",
      required: true,
    },
    // Alert that triggered this appointment (if auto-scheduled)
    triggeredByAlert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
      default: null,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: "High-risk alert — urgent clinical review",
    },
    status: {
      type: String,
      enum: ["auto-scheduled", "confirmed", "cancelled"],
      default: "auto-scheduled",
    },
    riskLevel: {
      type: String,
      enum: ["moderate", "high"],
      default: "high",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

appointmentSchema.index({ clinicianId: 1, scheduledAt: -1 });
appointmentSchema.index({ patientId: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
