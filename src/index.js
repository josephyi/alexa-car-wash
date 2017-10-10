import Alexa from 'alexa-sdk';

import { Handlers } from './Handlers';

exports.handler = (event, context) => {
  const alexa = Alexa.handler(event, context);
  alexa.registerHandlers(Handlers);
  alexa.execute();
};
