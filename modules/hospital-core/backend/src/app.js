const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const Joi = require("joi");
const fs = require("fs");
const path = require("path");
const { createHash, createHmac, randomUUID } = require("crypto");

const { initializeDatabase } = require("./db");
const pricingRoutes = require("./routes/pricing");
const adminRoutes = require("./routes/admin");
const patientRoutes = require("./routes/patients");
const appointmentRoutes = require("./routes/appointments");
const ndaStore = require("./modules/nda/store");
const depositStore = require("./modules/deposit/store");

const app = express();

// Initialize SQLite database
const db = initializeDatabase();
ndaStore.setDatabase(db);
depositStore.setDatabase(db);

// ── SETUP ──────────────────────────────────────────────────
const LOG_DIR = path.join(process.cwd(), "logs");
const AUDIT_LOG_PATH = path.join(LOG_DIR, "audit.log");
const AUDIT_HMAC_SECRET = process.env.AUDIT_HMAC_SECRET;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map((s) => s.trim()).filter(Boolean);

if (!AUDIT_HMAC_SECRET) {
  console.error("FATAL: AUDIT_HMAC_SECRET is not set");
  process.exit(1);
}

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// ── SECURITY MIDDLEWARE ────────────────────────────────────
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS blocked"));
  },
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Too many requests, please try again later" },
}));

// ── AUDIT CHAIN ────────────────────────────────────────────
function getLastAuditHash() {
  try {
    if (!fs.existsSync(AUDIT_LOG_PATH)) return "GENESIS";
    const lines = fs.readFileSync(AUDIT_LOG_PATH, "utf8")
      .trim().split("\n").filter(Boolean);
    if (lines.length === 0) return "GENESIS";
    const last = JSON.parse(lines[lines.length - 1]);
    return last.hash || "GENESIS";
  } catch { return "GENESIS"; }
}

function audit(event) {
  const previousHash = getLastAuditHash();
  const baseRecord = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    previousHash,
    ...event,
  };
  const payload = JSON.stringify(baseRecord);
  const hash = createHash("sha256").update(previousHash + payload).digest("hex");
  const signature = createHmac("sha256", AUDIT_HMAC_SECRET).update(payload).digest("hex");
  const finalRecord = { ...baseRecord, hash, signature };
  fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(finalRecord) + "\n", "utf8");
  return finalRecord;
}

app.set("audit", audit);

// ── INPUT VALIDATION ───────────────────────────────────────
const schemas = {
  ndaSubmit: Joi.object({
    organizationName: Joi.string().min(2).max(255).required(),
    contactName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    country: Joi.string().max(100).optional(),
    useCase: Joi.string().max(2000).optional(),
    notes: Joi.string().max(2000).optional(),
  }),
  depositCreate: Joi.object({
    organizationName: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required(),
    paymentMethod: Joi.string()
      .valid("manual_invoice", "bank_transfer", "wire")
      .default("manual_invoice"),
  }),
  accessRequest: Joi.object({
    organizationName: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required(),
    message: Joi.string().max(2000).optional(),
  }),
};

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        msg: "Validation failed",
        errors: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
}

// ── PUBLIC ROUTES ──────────────────────────────────────────
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    system: "UCH Sovereign Core",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/access/request", validate(schemas.accessRequest), (req, res) => {
  const requestId = randomUUID();
  audit({
    type: "access_request",
    requestId,
    email: req.body.email,
    organizationName: req.body.organizationName,
  });
  return res.status(200).json({
    requestId,
    status: "submitted",
    message: "Access request received. You will be contacted within 2 business days.",
    depositRequired: 5000,
    currency: "USD",
  });
});

app.post("/api/nda/submit", validate(schemas.ndaSubmit), (req, res) => {
  const record = ndaStore.create(req.body);
  audit({
    type: "nda_submit",
    ndaId: record.id,
    email: record.email,
    organizationName: record.organizationName,
  });
  return res.status(201).json({
    ndaId: record.id,
    status: record.status,
    message: "NDA submission received. Review takes 2-5 business days.",
  });
});

app.post("/api/deposit/create", validate(schemas.depositCreate), (req, res) => {
  const deposit = depositStore.createDeposit(req.body);
  audit({
    type: "deposit_create",
    depositId: deposit.depositId,
    email: req.body.email,
    organizationName: req.body.organizationName,
    amount: 5000,
  });
  return res.status(201).json(deposit);
});

// ── PROTECTED ROUTES ───────────────────────────────────────
app.use("/api/pricing", pricingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);

// ── 404 ────────────────────────────────────────────────────
app.use((req, res) => {
  return res.status(404).json({ msg: "Route not found" });
});

// ── ERROR HANDLER ──────────────────────────────────────────
app.use((err, req, res, next) => {
  const auditFn = req.app.get("audit");
  if (auditFn) auditFn({ type: "error", message: err.message, path: req.path, method: req.method });
  if (process.env.NODE_ENV !== "production") console.error(err);
  return res.status(500).json({ msg: "Internal server error" });
});

module.exports = { app, audit };
