// This script switch ON the relay output with delay when power is restored. It's very usefull if you want to switch something with delay after power black out. 
// Set this script to be enabled by default when device is powered

// Delay time in milliseconds (10 milliseconds for testing)
let delayTime = 300000;
let execution = 0;
let state = Shelly.getComponentStatus("switch", 1)["output"];  

// Function to toggle the switch
function toggleSwitch(execution) {
  if ((execution === 1) && (state == true)) {
    Shelly.call("Switch.set", { 'id': 0, 'on': true });
    print("Athermna HT - Switched ON");
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
