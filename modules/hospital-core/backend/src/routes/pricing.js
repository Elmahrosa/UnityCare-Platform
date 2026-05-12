const express = require("express");
const pricingService = require("../modules/pricing/service");

const router = express.Router();

router.post("/request", (req, res) => {
  const quote = pricingService.calculate(req.body || {});

  if (quote.error) {
    return res.status(400).json({ msg: quote.error });
  }

  return res.status(200).json({
    status: "quote_generated",
    ...quote,
  });
});

module.exports = router;
