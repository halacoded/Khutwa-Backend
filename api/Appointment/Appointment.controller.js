const Appointment = require("../../models/Appointment");

// GET /appointments — clinician gets all appointments for their patients
const getForClinician = async (req, res, next) => {
  try {
    const clinicianId = req.user._id;

    const appointments = await Appointment.find({ clinicianId })
      .sort({ scheduledAt: 1 })
      .populate("patientId", "name email phone ProfileImage")
      .populate("triggeredByAlert", "alertType severity createdAt");

    res.json({ message: "Appointments fetched", data: appointments });
  } catch (error) {
    next(error);
  }
};

// PUT /appointments/:id/confirm — clinician confirms an appointment
const confirmAppointment = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "confirmed", ...(notes && { notes }) },
      { new: true },
    ).populate("patientId", "name email");

    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json({ message: "Appointment confirmed", data: appointment });
  } catch (error) {
    next(error);
  }
};

// PUT /appointments/:id/cancel — clinician cancels an appointment
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true },
    ).populate("patientId", "name email");

    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json({ message: "Appointment cancelled", data: appointment });
  } catch (error) {
    next(error);
  }
};

module.exports = { getForClinician, confirmAppointment, cancelAppointment };
