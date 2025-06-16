// This script switch on the output of Shelly device with delay when device is powered. 
let delayTime = 300000; // Delay time in milliseconds 
let channel = 0; // if you want control another channel change 0 with channel number

// The main script
let execution = 0;
let state = Shelly.getComponentStatus("switch", channel)["output"];  

// Function to toggle the switch
function toggleSwitch(execution) {
  if ((execution === 1) && (state == true)) {
    Shelly.call("Switch.set", { 'id': 0, 'on': true });
    print("Switched ON");
  } else {
    print ("Alredy executed");
    return; // Exit the function if execution is not 1
  }
}

// Set a timer that calls the toggleSwitch function
Timer.set(delayTime, false, function() {
  execution = execution + 1;
  toggleSwitch(execution);
});
