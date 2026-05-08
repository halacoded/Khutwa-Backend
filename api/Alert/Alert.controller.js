const Alert = require("../../models/Alert");
const Appointment = require("../../models/Appointment");
const Clinician = require("../../models/Clinician");

// POST /alerts — patient app sends an alert
const createAlert = async (req, res, next) => {
  try {
    const { alertType, severity, details } = req.body;
    const userId = req.user._id;

    // Avoid duplicate alerts: skip if same type already Pending in last 10 min
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existing = await Alert.findOne({
      userId,
      alertType,
      status: "Pending",
      createdAt: { $gte: tenMinAgo },
    });
    if (existing) {
      return res.status(200).json({ message: "Alert already exists", data: existing });
    }

    const alert = await Alert.create({ userId, alertType, severity, details });

    // Auto-schedule appointment for high-risk alerts
    if (severity === "high") {
      try {
        // Find the first clinician who has this patient assigned
        const clinician = await Clinician.findOne({ assignedPatients: userId });
        if (clinician) {
          // Check if there's already an auto-scheduled appointment in the next 14 days
          const twoWeeksOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
          const existingAppt = await Appointment.findOne({
            patientId: userId,
            clinicianId: clinician._id,
            status: { $in: ["auto-scheduled", "confirmed"] },
            scheduledAt: { $lte: twoWeeksOut },
          });

          if (!existingAppt) {
            // Schedule 7 days from now
            const scheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await Appointment.create({
              patientId: userId,
              clinicianId: clinician._id,
              triggeredByAlert: alert._id,
              scheduledAt,
              reason: `Auto-scheduled: High-risk ${alertType} alert detected`,
              riskLevel: "high",
            });
          }
        }
      } catch (apptErr) {
        // Don't fail the alert if appointment scheduling fails
        console.error("Auto-schedule appointment error:", apptErr);
      }
    }

    res.status(201).json({ message: "Alert created", data: alert });
  } catch (error) {
    next(error);
  }
};

// GET /alerts/my-patients — clinician gets alerts for their assigned patients
const getAlertsForClinician = async (req, res, next) => {
  try {
    const clinician = req.user;
    const patientIds = clinician.patients || [];

    const alerts = await Alert.find({ userId: { $in: patientIds } })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("userId", "name email");

    res.json({ message: "Alerts fetched", data: alerts });
  } catch (error) {
    next(error);
  }
};

// PUT /alerts/:id/reviewed — clinician marks alert as reviewed
const markReviewed = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: "Reviewed" },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json({ message: "Marked as reviewed", data: alert });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAlert, getAlertsForClinician, markReviewed };
