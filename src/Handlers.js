import { postalCodeRequest } from "./integrations/AlexaDeviceAddress.js";
import { geocode } from "./integrations/GoogleMaps";
import { forecast } from "./integrations/DarkSky";
const moment = require("moment-timezone");

const COUNTRY_AND_POSTAL_CODE_PERMISSION =
  "read::alexa:device:all:address:country_and_postal_code";
const LOCATION_PERMISSIONS = [COUNTRY_AND_POSTAL_CODE_PERMISSION];
const NEED_PERMISSION_MESSAGE =
  "Please enable Location permissions in the Amazon Alexa app.";

const carWashCheckHandler = async function() {
  const { user, device, apiEndpoint } = this.event.context.System;

  if (user && user.permissions && user.permissions.consentToken) {
    const consentToken = user.permissions.consentToken;
    const deviceId = device.deviceId;
    const deviceLocationResponse = await postalCodeRequest(
      deviceId,
      consentToken,
      apiEndpoint
    );

    const googleMapsResponse = await geocode({
      address: deviceLocationResponse["postalCode"]
    });
    const { lat, lng } = googleMapsResponse.results[0].geometry.location;
    const darkskyResponse = await forecast(
      process.env.DARKSKY_API_KEY,
      lat,
      lng
    );
    const forecastWeek = darkskyResponse["daily"]["data"];
    const lastDayOfRainIndex = forecastWeek
      .map(day => day["icon"])
      .lastIndexOf("rain");
    const timezone = darkskyResponse["timezone"];

    switch (lastDayOfRainIndex) {
      case -1:
        this.emit(
          ":tell",
          `<say-as interpret-as="interjection">huzzah!</say-as> Today is a good day to wash your car because there is no rain in the 7 day forecast.`
        );
        break;
      case 0:
        this.emit(
          ":tell",
          `<say-as interpret-as="interjection">aw man!</say-as> There's rain today, so you probably shouldn't wash your car. Check again tomorrow.`
        );
        break;
      default:
        const lastDayOfRain = forecastWeek[lastDayOfRainIndex];
        const daysFrom = moment(lastDayOfRain["time"] * 1000)
          .tz(timezone)
          .startOf("day")
          .calendar(null, {
            nextDay: "[Tomorrow]",
            nextWeek: "dddd, MMMM Do",
            sameElse: "dddd, MMMM Do"
          });

        this.emit(
          ":tell",
          `<say-as interpret-as="interjection">le sigh</say-as>. it looks like it might rain ${daysFrom}, so you might want to wait. Check again to see if the forecast changes.`
        );
        break;
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
  CarWashIntent: carWashCheckHandler
};
