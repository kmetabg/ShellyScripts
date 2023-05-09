// With this script you can stop or limit watering your garden according to the rain
// that has fallen in the last 24 hours
// You can use any Shelly Plus 1/Pro1 ot Pro2 to control your irrigation system
// Dont forger to add AutoOFF for max Irrigration time and set a Schedule which start irrigration in device webUI.
// Configure Accuweather APIKEY and end points
// Configure locations, Rain in mm and Irrigration time. 
// Set the irrigation schedule in the device web. 
// Set AutoOFF in seconds in device web. If you want to change max irrigation time in future can do that from device web. 

let CONFIG = {
  accuWeatherAPIKEY: ".........", //Register your API key here: https://developer.accuweather.com/
  //  weatherForecastEndpoint: "http://dataservice.accuweather.com/forecasts/v1/daily/1day/",
  weatherCurrentEndpoint: "http://dataservice.accuweather.com/currentconditions/v1/",
  //  List of locations
  locations: {
    "Sofia": 51097, // You can find the code of the nearest station by searching for it on Accuweather. It is located in the URL link in your browser.
    "Dragalevtsi": 1268173,
    "Test": 318900
  },
  // Configuration values
  here: "Dragalevtsi",
  minRain: 4, // Set rain value in mm which is enought for you. Usually is 3-5 mm per day. 
  switchOffTime: 0, // default to immediately stop  
};

let maxIrrigationTime = (Shelly.getComponentConfig("switch", 0).auto_off_delay)/60;
let location_id = CONFIG.locations[CONFIG.here];

function getWeatherURLForLocation(location_name) {
  return CONFIG.weatherCurrentEndpoint +
    JSON.stringify(CONFIG.locations[location_name]) +
    "?apikey=" +
    CONFIG.accuWeatherAPIKEY +
    "&details=true";
};

// This function reads the rain value in the last 24 hours
function ReadRainHistory() {
  print ("Check and Decide");
  Shelly.call(
    "http.get",
    { url: getWeatherURLForLocation(CONFIG.here) },
    function (response, error_code, error_message) {
      if (error_code !== 0) {
        print ("Service failed"); // HTTP call to error service failed
        // TODO: retry logic
        return;
      }
      let weatherData = JSON.parse(response.body);
      let RainValue = weatherData[0].PrecipitationSummary.Past24Hours.Metric.Value;
      print ("RainValue", RainValue);
      decideIfToIrrigate(RainValue);
    }
  );
};

// This function checks if enough rain has fallen and sets the switch off time accordingly
function decideIfToIrrigate(RainValue) {
  print(CONFIG.here, " Rain Last 24h - ", RainValue, " mm ");
  if (RainValue >= CONFIG.minRain) {
    Shelly.call("Switch.Set", {"id": 0, "on": false});
    print("Irrigation not needed");
  } else {
    let percentage = (CONFIG.minRain - RainValue) / CONFIG.minRain;
    print("Percentage of irrigation time: ", percentage);
    let irrigationTime = Math.round(percentage * CONFIG.maxIrrigationTime);
    CONFIG.switchOffTime = irrigationTime * 60;
    Shelly.call("Switch.Set", {"id": 0, "on": true, "toggle_after": CONFIG.switchOffTime});
    print("Irrigation started, switch off in ", irrigationTime, " minutes");
  }
}

Shelly.addStatusHandler(function(e) {
  if (e.component === "switch:0") {
    if (e.delta.output === true) {
      print("Switch is on, triggered source:", e.delta.source);
      ReadRainHistory();
    } 
  }
});

// Set the max irrigation time
Shelly.call("Switch.AutoOFF.Set", {"id": 0, "timeout": CONFIG.maxIrrigationTime});


