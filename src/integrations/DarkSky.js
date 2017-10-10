const rp = require('request-promise-native');

export function forecast(apiKey, latitude, longitude) {
    return rp({
      uri: `https://api.darksky.net/forecast/${apiKey}/${latitude},${longitude}`,
      json: true
    });
}
