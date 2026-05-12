const BASE_PRICING = {
  foundation: 50000,
  institutional: 100000,
  sovereign: 260000,
  white_label: 650000,
};

function normalizeTier(tier) {
  return String(tier || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function calculate(input) {
  const tier = normalizeTier(input.tier);
  const basePrice = BASE_PRICING[tier];

  if (!basePrice) {
    return {
      error: "Invalid tier. Use foundation, institutional, sovereign, or white_label.",
    };
  }

  const facilities = Math.max(Number(input.facilities || 1), 1);
  const supportMonths = Math.max(Number(input.supportMonths || 6), 0);
  const sourceAccess = Boolean(input.sourceAccess);
  const whiteLabel = Boolean(input.whiteLabel);
  const dedicatedTraining = Boolean(input.dedicatedTraining);

  let total = basePrice;

  const modifiers = {
    facilities: (facilities - 1) * 2500,
    supportMonths: Math.max(supportMonths - 6, 0) * 1200,
    sourceAccess: sourceAccess ? 18000 : 0,
    whiteLabel: whiteLabel ? 125000 : 0,
    dedicatedTraining: dedicatedTraining ? 15000 : 0,
  };

  total += modifiers.facilities;
  total += modifiers.supportMonths;
  total += modifiers.sourceAccess;
  total += modifiers.whiteLabel;
  total += modifiers.dedicatedTraining;

  return {
    tier,
    currency: "USD",
    basePrice,
    modifiers,
    estimatedPrice: total,
    depositRequired: 5000,
  };
}

module.exports = {
  calculate,
};
