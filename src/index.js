import Alexa from 'alexa-sdk';

const launchRequestHandler = function() {
  this.emit(':tell', 'Today may or may not be a good day for a car wash');
};

const handlers = {
  'LaunchRequest': launchRequestHandler
};

exports.handler = (event, context) => {
  const alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};
