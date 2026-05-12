const express = require("express");
const Joi = require("joi");
const { randomUUID } = require("crypto");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const store = require("../modules/appointments/store");

const router = express.Router();

const apptSchema = Joi.object({
  patientId: Joi.string().required(),
  staffId: Joi.string().required(),
  appointmentType: Joi.string().max(100).required(),
  startTime: Joi.string().isoDate().required(),
  endTime: Joi.string().isoDate().required(),
  location: Joi.string().max(255).optional().allow(""),
  notes: Joi.string().max(2000).optional().allow(""),
});

// GET /api/appointments
router.get("/", auth, roles("admin", "doctor", "nurse"), (req, res) => {
  const audit = req.app.get("audit");
  const { date, patientId, staffId } = req.query;
  let appts = store.list();
  if (date) appts = appts.filter((a) => a.startTime.startsWith(date));
  if (patientId) appts = appts.filter((a) => a.patientId === patientId);
  if (staffId) appts = appts.filter((a) => a.staffId === staffId);
  audit({ type: "appointment_list", actor: req.user.email, filters: req.query });
  return res.status(200).json({ appointments: appts, total: appts.length });
});

// POST /api/appointments
router.post("/", auth, roles("admin", "doctor"), (req, res) => {
  const audit = req.app.get("audit");
  const { error, value } = apptSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ msg: "Validation failed", errors: error.details.map((d) => d.message) });
  }
  // Conflict detection
  const existing = store.list().filter(
    (a) => a.staffId === value.staffId &&
    a.status !== "cancelled" &&
    new Date(value.startTime) < new Date(a.endTime) &&
    new Date(value.endTime) > new Date(a.startTime)
  );
  if (existing.length > 0) {
    return res.status(409).json({ msg: "Scheduling conflict: staff member has an overlapping appointment", conflict: existing[0].appointmentId });
  }
  const appt = store.create({ ...value, createdBy: req.user.email });
  audit({ type: "appointment_create", actor: req.user.email, appointmentId: appt.appointmentId, patientId: value.patientId });
  return res.status(201).json(appt);
});

// PATCH /api/appointments/:id/status
router.patch("/:id/status", auth, roles("admin", "doctor", "nurse"), (req, res) => {
  const audit = req.app.get("audit");
  const { status } = req.body;
  const validStatuses = ["scheduled","confirmed","in_progress","completed","cancelled","no_show"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ msg: "Invalid status", valid: validStatuses });
  }
  const appt = store.updateStatus(req.params.id, status, req.user.email);
  if (!appt) return res.status(404).json({ msg: "Appointment not found" });
  audit({ type: "appointment_status_update", actor: req.user.email, appointmentId: req.params.id, status });
  return res.status(200).json(appt);
});

module.exports = router;
