import { postalCodeRequest } from "./integrations/AlexaDeviceAddress.js";
import { geocode } from "./integrations/GoogleMaps";
import { forecast } from "./integrations/DarkSky";
const moment = require("moment-timezone");

const COUNTRY_AND_POSTAL_CODE_PERMISSION =
  "read::alexa:device:all:address:country_and_postal_code";
const LOCATION_PERMISSIONS = [COUNTRY_AND_POSTAL_CODE_PERMISSION];
const NEED_PERMISSION_MESSAGE =
  "To automatically use your device location, please enable Location permissions in the Amazon Alexa app. You can also use a city and state. For example, launch by saying, Ask Car Wash in San Diego, California.";

const HAPPY_SPEECHCONS = [
  "Booya",
  "Dynomite",
  "Hip hip hooray",
  "Hurrah",
  "Hurray",
  "Huzzah",
  "Oh dear.  Just kidding.  Hurray",
  "Kaboom",
  "Kaching",
  "Phew",
  "Whee",
  "Woo hoo",
  "Yay"
];
const SAD_SPEECHCONS = [
  "Argh",
  "Aw man",
  "Blarg",
  "Blast",
  "Boo",
  "Bummer",
  "Darn",
  "D'oh",
  "Dun dun dun",
  "Eek",
  "Le sigh",
  "Mamma mia",
  "Oh boy",
  "Oh dear",
  "Oof",
  "Ouch",
  "Ruh roh",
  "Shucks",
  "Uh oh",
  "Wah wah",
  "Yikes"
];

const random = array => {
  return array[Math.floor(Math.random() * array.length)];
};

const forecastResponse = ({ city, state, weatherResponse }) => {
  const timezone = weatherResponse.timezone;
  const hourly = weatherResponse.hourly.data;

  const rainyHours = hourly.filter(hour => hour.precipProbability > 0.06);
  if (rainyHours.length > 0) {
    const lastRainyHour = rainyHours[rainyHours.length - 1];
    const lastRainyHourOutput = moment(lastRainyHour.time * 1000)
      .add(1, "hours")
      .tz(timezone)
      .calendar(); // TODO:improve the output by adding the 'until' language here instead of in the returned str..

    return `<say-as interpret-as="interjection">${random(
      SAD_SPEECHCONS
    )}!</say-as> In ${city}, ${state}, there's a chance of rain until ${lastRainyHourOutput}. Check again later to see if conditions improve.`;
  } else {
    const forecastWeek = weatherResponse["daily"]["data"];
    const rainyDayTimes = forecastWeek
      .filter(day => day["icon"] === "rain")
      .map(item => item["time"]);

    switch (rainyDayTimes.length) {
      case 0:
        return `<say-as interpret-as="interjection">${random(
          HAPPY_SPEECHCONS
        )}!</say-as>, In ${city}, ${state}, it's a good day to wash your car because there is no rain in the 7 day forecast.`;
      default:
        return sayForRainyDays(city, state, timezone, rainyDayTimes);
    }
  }
};

const sayForRainyDays = (city, state, timezone, rainyDayTimes) => {
  const days = rainyDayTimes.reduce((accumulator, item, idx, arr) => {
    const day = moment(item * 1000)
      .tz(timezone)
      .startOf("day")
      .calendar(null, {
        sameDay: "[today]",
        nextDay: "[tomorrow]",
        nextWeek: "dddd",
        sameElse: "[next] dddd"
      });

    // humanized day and ', ' and ' and ' as needed
    const output = `${day}${idx < arr.length - 1 && arr.length > 2
      ? ", "
      : ""}${arr.length > 1 && idx + 1 === arr.length - 1 ? " and " : ""}`;

    return accumulator.concat(output);
  }, "");

  return `<say-as interpret-as="interjection">${random(
    SAD_SPEECHCONS
  )}!</say-as> In ${city}, ${state}, it's going to rain ${days}, so you might not want to wash your car. Check again tomorrow to see if conditions improve.`;
};

const stopHandler = function() {
  this.emit(':tell', 'Byebye!')
}

const unhandledHandler = function() {
  this.emit(
    ":ask",
    `I couldn't understand. Try saying the city and state again.`,
    `Try saying the city and state again.`
  );
};

const carWashCheckHandler = async function() {
  let address = null;

  if (this.event.request.intent && this.event.request.intent.slots && this.event.request.intent.slots.city.value && this.event.request.intent.slots.state.value) {
    const { city, state } = this.event.request.intent.slots;
    address = `${city.value},${state.value}`;
  } else {
    const { user, device, apiEndpoint } = this.event.context.System;

    try {
      const consentToken = user.permissions.consentToken;
      const deviceId = device.deviceId;
      const deviceLocationResponse = await postalCodeRequest(
        deviceId,
        consentToken,
        apiEndpoint
      );

      address = deviceLocationResponse["postalCode"];
    } catch (err) {
      console.log(err);
    }
  }

  if (address != null) {
    try {
      const googleMapsResponse = await geocode({ address });
      const { lat, lng } = googleMapsResponse.results[0].geometry.location;

      let city, state;
      googleMapsResponse.results[0].address_components.forEach(e => {
        if (e.types[0] === "locality") city = e.long_name;
        if (e.types[0] === "administrative_area_level_1") state = e.long_name;
      });

      const weatherResponse = await forecast(
        process.env.DARKSKY_API_KEY,
        lat,
        lng
      );

      const prompt = forecastResponse({ city, state, weatherResponse });
      this.emit(":tell", prompt);
    } catch (error) {
      console.log(error);
      this.emit(
        ":ask",
        `I'm having difficulty with the location. What's the city and state?`,
        `What's the city and state?`
      );
    }
  } else {
    this.emit(
      ":tellWithPermissionCard",
      NEED_PERMISSION_MESSAGE,
      LOCATION_PERMISSIONS
    );
  }
};

export const Handlers = {
  LaunchRequest: carWashCheckHandler,
  NewSession: carWashCheckHandler,
  CarWashCheckIntent: carWashCheckHandler,
  Unhandled: unhandledHandler,
  'AMAZON.StopIntent': stopHandler
};
