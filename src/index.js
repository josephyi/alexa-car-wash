import Alexa from 'alexa-sdk';

import {postalCodeRequest} from './integrations/AlexaDeviceAddress.js';
import {geocode} from './integrations/GoogleMaps';

const COUNTRY_AND_POSTAL_CODE_PERMISSION = "read::alexa:device:all:address:country_and_postal_code";
const LOCATION_PERMISSIONS = [COUNTRY_AND_POSTAL_CODE_PERMISSION];

const launchRequestHandler = async function() {
  console.log('launchRequestHandler');
  const {user, device, apiEndpoint} = this.event.context.System;

  if(user && user.permissions && user.permissions.consentToken) {
    const consentToken = user.permissions.consentToken;
    console.log('checking request token');

    const deviceLocationResponse = await postalCodeRequest(deviceId, consentToken, apiEndpoint);
    const googleMapsResponse = await geocode({address: deviceLocationResponse['postalCode']});
    const {lat, lng} = googleMapsResponse.results[0].geometry.location;

    console.log(`${lat} ${lng}`);

    this.emit(':tell', 'Today may or may not be a good day for a car wash');
  } else {
      console.log('no permission found...')
      this.emit(':tell', 'Today may or may not be a good day for a car wash');

//      this.emit(":tellWithPermissionCard", "Please enable Location permissions in the Amazon Alexa app.", LOCATION_PERMISSIONS);
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
