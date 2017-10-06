const rp = require('request-promise-native');

export function geocode(params) {
    return rp({
      uri: 'https://maps.googleapis.com/maps/api/geocode/json',
      qs: params,
      json: true
    });
}
