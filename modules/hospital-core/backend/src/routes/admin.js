const express = require("express");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const ndaStore = require("../modules/nda/store");
const depositStore = require("../modules/deposit/store");

const router = express.Router();

router.get("/nda", auth, roles("admin", "reviewer"), (req, res) => {
  return res.status(200).json(ndaStore.list());
});

router.post("/nda/:id/approve", auth, roles("admin", "reviewer"), (req, res) => {
  const updated = ndaStore.updateStatus(req.params.id, "approved", req.user.email);

  if (!updated) {
    return res.status(404).json({ msg: "NDA not found" });
  }

  return res.status(200).json(updated);
});

router.post("/nda/:id/reject", auth, roles("admin", "reviewer"), (req, res) => {
  const updated = ndaStore.updateStatus(req.params.id, "rejected", req.user.email);

  if (!updated) {
    return res.status(404).json({ msg: "NDA not found" });
  }

  return res.status(200).json(updated);
});

router.get("/deposits", auth, roles("admin", "reviewer"), (req, res) => {
  return res.status(200).json(depositStore.listDeposits());
});

router.post("/deposits/:id/mark-paid", auth, roles("admin"), (req, res) => {
  const updated = depositStore.markPaid(
    req.params.id,
    req.body?.paymentReference,
    req.user.email
  );

  if (!updated) {
    return res.status(404).json({ msg: "Deposit not found" });
  }

  return res.status(200).json(updated);
});

module.exports = router;
