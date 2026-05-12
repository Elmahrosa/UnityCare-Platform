const PiSDK = require('pi-sdk');

function initPi() {
  if (process.env.PI_ENABLED === 'true') {
    return new PiSDK({ apiKey: process.env.PI_API_KEY });
  }
  return null;
}

module.exports = initPi;
