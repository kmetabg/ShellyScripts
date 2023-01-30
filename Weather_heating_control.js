 let CONFIG = {
  accuWeatherAPIKEY: "YOUR_ACCU_WEATHER_API_KEY",
  weatherForecastEndpoint:
    "http://dataservice.accuweather.com/forecasts/v1/daily/1day/",
  weatherCurrentEndpoint:
    "http://dataservice.accuweather.com/currentconditions/v1/",
  locations: {
  // Set location as name and code from ACCUWEATHER
    Sofia: 51097,
   },
  //check every 60 seconds
  checkInterval: 60 * 1000,
  //Ousdide temperature
  tempBelowTurnOn: 7,
  tempAboveTurnOff: 10,
  //Working interval
  workTimeStart: 6, 
  workTimeEnd: 23,
};

let workingH = true;

function getWeatherURLForLocation(location) {
  return (
    CONFIG.weatherCurrentEndpoint +
    JSON.stringify(CONFIG.locations[location]) +
    "?apikey=" +
    CONFIG.accuWeatherAPIKEY +
    "&details=false"
  );
}

function activateSwitch(activate) {
  Shelly.call(
    "Switch.Set",
    { id: 1, on: activate },
    function (response, error_code, error_message) {}
  );
}

function TemperatureControlLocation(location) {
  Shelly.call(
    "http.get",
    { url: getWeatherURLForLocation(location) },
    function (response, error_code, error_message, location) {
      let weatherData = JSON.parse(response.body);
      if (weatherData[0].Temperature.Metric.Value <= CONFIG.tempBelowTurnOn) {
        activateSwitch(true);
      }
      if (weatherData[0].Temperature.Metric.Value >= CONFIG.tempAboveTurnOff) {
        activateSwitch(false);
      }
      print(
        location,
        " Temperature - ",
        weatherData[0].Temperature.Metric.Value,
        "deg C"
      );
    },
    location
  );
}

function CheckWorkingtime() {
Shelly.call(
  "http.get",
  { url: "http://worldtimeapi.org/api/timezone/Europe/Sofia" },
  function (response, error_code, error_message) {
      let currentTime = JSON.parse(response.body).datetime;
      let currentHour = currentTime.slice(11,13);
      print("Current time in Sofia", currentHour);
      if (JSON.parse(currentHour) > CONFIG.workTimeEnd && JSON.parse(currentHour) < CONFIG.workTimeStart) {
          workingH = false;
          activateSwitch(false);
      } else { 
          workingH = true; 
      }
      print(workingH);
      }
 );
 }


  Timer.set(CONFIG.checkInterval, true, function () { 
        CheckWorkingtime(); 
        if (workingH === true) {
         print("Checking weather");
         TemperatureControlLocation("Sofia");
        }
});
