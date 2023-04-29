// Set the MAC addresses of the buttons to be used
let mac = "xx:xx:xx:xx:xx:xx";
// let mac1 = "xx:xx:xx:xx:xx:xx";

// Set the switch ID that will be toggled
let SWITCH_ID = 0;

// Set the scan options for the BLE scanner
let SCAN_OPTIONS = {
    "duration_ms": -1,
    "active": false,
    "interval_ms": 150,
    "window_ms": 50,
};

// Set the execution state to 0
let execution = 0;

// Event handler for the switch toggle event
Shelly.addEventHandler(function (ev_data) {
    if (ev_data.name !== "switch") return;
    if (ev_data.id !== SWITCH_ID) return;
    if (ev_data.info.event !== "toggle") return;
});

// Handle the scan results
function handleScanResult(res) {
    // Check if service data exists in the scan result
    if (!res.service_data) return;
    // Check if the "fcd2" service data exists in the scan result
    if (!res.service_data["fcd2"]) return;

    // Check if the MAC address of the button matches the one we are looking for
    if (mac !== res.addr && mac1 !== res.addr) {
      print("Wrong button", res.addr);
      return;
    }

    // Extract the number of button presses from the service data
    let fullstring = JSON.stringify(res.service_data);
    let num_push = fullstring.slice(-3,-2);

    // If the execution state is 0, check for a single button press and toggle the switch
      if (execution === 0) { 
       print(res.addr, res.rssi, num_push);
          if (num_push === "1") {  // 1-singe, 2-dual, 3-tripple, 4-long push
              Shelly.call("Switch.Set", { id: SWITCH_ID, on: true });
              execution = 1; 
              timer();
         }
    }
}

// Handle the scan event
function handleScanEvent(ev, res) {
    // Call handleScanResult() on each scan result
    if (ev === BLE.Scanner.SCAN_RESULT) {
        handleScanResult(res);
    }
    // Restart the scanner when it stops
    if (ev === BLE.Scanner.SCAN_STOP) {
        BLE.Scanner.Start(SCAN_OPTIONS);
    }
}

// Start the BLE scanner with the specified options and event handler
BLE.Scanner.Start(SCAN_OPTIONS, handleScanEvent);

// Timer function to reset the execution state to 0 after 1 second
function timer() {
    Timer.set(1000, false, timer_end);
}

// Callback function for the timer
function timer_end() {
    execution = 0;
}
