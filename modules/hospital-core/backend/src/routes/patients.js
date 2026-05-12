const express = require("express");
const Joi = require("joi");
const { randomUUID } = require("crypto");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const store = require("../modules/patients/store");

const router = express.Router();

const patientSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().optional().allow(""),
  phone: Joi.string().max(20).required(),
  dateOfBirth: Joi.string().isoDate().required(),
  gender: Joi.string().valid("male", "female", "other").required(),
  bloodType: Joi.string().max(5).optional().allow(""),
  address: Joi.string().max(500).optional().allow(""),
  emergencyContactName: Joi.string().max(100).optional().allow(""),
  emergencyContactPhone: Joi.string().max(20).optional().allow(""),
  allergies: Joi.string().max(1000).optional().allow(""),
  chronicConditions: Joi.string().max(1000).optional().allow(""),
  currentMedications: Joi.string().max(1000).optional().allow(""),
  insuranceProvider: Joi.string().max(100).optional().allow(""),
  insurancePolicyNumber: Joi.string().max(100).optional().allow(""),
});

// GET /api/patients — list all (admin, doctor, nurse)
router.get("/", auth, roles("admin", "doctor", "nurse"), (req, res) => {
  const audit = req.app.get("audit");
  const patients = store.list();
  audit({ type: "patient_list", actor: req.user.email, count: patients.length });
  return res.status(200).json({ patients, total: patients.length });
});

// GET /api/patients/:id — get one
router.get("/:id", auth, roles("admin", "doctor", "nurse"), (req, res) => {
  const audit = req.app.get("audit");
  const patient = store.findById(req.params.id);
  if (!patient) return res.status(404).json({ msg: "Patient not found" });
  audit({ type: "patient_view", actor: req.user.email, patientId: req.params.id, accessType: "view" });
  return res.status(200).json(patient);
});

// POST /api/patients — create (admin, doctor)
router.post("/", auth, roles("admin", "doctor"), (req, res) => {
  const audit = req.app.get("audit");
  const { error, value } = patientSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ msg: "Validation failed", errors: error.details.map((d) => d.message) });
  }
  const patient = store.create({ ...value, createdBy: req.user.email });
  audit({ type: "patient_create", actor: req.user.email, patientId: patient.patientId });
  return res.status(201).json(patient);
});

// PUT /api/patients/:id — update (admin, doctor)
router.put("/:id", auth, roles("admin", "doctor"), (req, res) => {
  const audit = req.app.get("audit");
  const { error, value } = patientSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ msg: "Validation failed", errors: error.details.map((d) => d.message) });
  }
  const patient = store.update(req.params.id, value);
  if (!patient) return res.status(404).json({ msg: "Patient not found" });
  audit({ type: "patient_update", actor: req.user.email, patientId: req.params.id });
  return res.status(200).json(patient);
});

module.exports = router;
