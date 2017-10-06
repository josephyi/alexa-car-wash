const rp = require('request-promise-native');

export function postalCodeRequest(deviceId, consentToken, endpoint) {
  return rp({
    uri: `${endpoint}/v1/devices/${deviceId}/settings/address/countryAndPostalCode`,
    headers: {
       'Authorization': `Bearer ${consentToken}`
    },
    json: true
  });
}
