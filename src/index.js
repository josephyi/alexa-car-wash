import Alexa from 'alexa-sdk';

import { postalCodeRequest } from './integrations/AlexaDeviceAddress.js';
import { geocode } from './integrations/GoogleMaps';

const COUNTRY_AND_POSTAL_CODE_PERMISSION = "read::alexa:device:all:address:country_and_postal_code";
const LOCATION_PERMISSIONS = [COUNTRY_AND_POSTAL_CODE_PERMISSION];
const NEED_PERMISSION_MESSAGE = "Please enable Location permissions in the Amazon Alexa app.";

const launchRequestHandler = async function() {
  const {user, device, apiEndpoint} = this.event.context.System;

  if(user && user.permissions && user.permissions.consentToken) {
    const consentToken = user.permissions.consentToken;
    const deviceId = device.deviceId;
    const deviceLocationResponse = await postalCodeRequest(deviceId, consentToken, apiEndpoint);
    const googleMapsResponse = await geocode({address: deviceLocationResponse['postalCode']});
    const {lat, lng} = googleMapsResponse.results[0].geometry.location;

    this.emit(':tell', `Your latitude is ${lat} and longitude is ${lng}.`);
  } else {
    this.emit(":tellWithPermissionCard", NEED_PERMISSION_MESSAGE, LOCATION_PERMISSIONS);
  }
};

const handlers = {
  'LaunchRequest': launchRequestHandler
};

exports.handler = (event, context) => {
  const alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};
