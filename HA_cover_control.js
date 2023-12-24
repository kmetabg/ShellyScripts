// Home Assistant Cover control
// You can control any curta, bling, roller, connect over ZigBee, Tuya, Thread ... from Shelly device and Shelly Control APP. 
// Update your Shelly device to fw. 1.1.0+ 
// works Shelly Plus 2PM or Plus i4 


let  homeAssistantUrl = 'Your HA IP'; // Replace with the actual HA IP
let  accessToken = "HA LongLive Token"; // Replace with the actual HA Token
let entityId = 'cover.smart_curtain_motor_curtain'; // Replace with the actual entity ID

const curtainUrl = homeAssistantUrl + "api/states/" + entityId;

// When inpout0 or 1 is pushed 
Shelly.addEventHandler(function(e) {
  if (e.component === "input:0") { // Open
    if (e.info.event === "single_push") {
      openCurtain();
    }
  }
  if (e.component === "input:1") { // Close
    if (e.info.event === "single_push") {
      closeCurtain();
    }
  }
});


function openCurtain() {
    const openUrl = homeAssistantUrl + "api/services/cover/open_cover";
    Shelly.call("http.request", {
        method: "POST",
        url: openUrl,
        headers: headers,
        body: JSON.stringify({ entity_id: entityId })
    }, function (response, error_code, error_message) {
        if (response && response.code === 200) {
            print("Curtain opened");
        } else {
            print("Error opening curtain - Code: " + error_code + " - Message: " + error_message);
        }
    });
}

function closeCurtain() {
    const closeUrl = homeAssistantUrl + "api/services/cover/close_cover";
    Shelly.call("http.request", {
        method: "POST",
        url: closeUrl,
        headers: headers,
        body: JSON.stringify({ entity_id: entityId })
    }, function (response, error_code, error_message) {
        if (response && response.code === 200) {
            print("Curtain closed");
        } else {
            print("Error closing curtain - Code: " + error_code + " - Message: " + error_message);
        }
    });
}


//Schedulining
function scheduleCurtain() {
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    print (hours+":"+minutes);

    // Open at 8:00 AM
    if (hours === 8 && minutes === 0) {
        closeCurtain();
    }

    // Close at 9:00 PM
    if (hours === 21 && minutes === 0) {
        openCurtain();
    }
}

Timer.set(60000, true, scheduleCurtain);
