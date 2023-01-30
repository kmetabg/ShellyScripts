 let CONFIG = {
  'maxTimeDoorOpen': 600,
  'inputComponent': 'input:100'
};

function toggleOff() {
  print("Timer triggered toggle off");
  Shelly.call("Switch.Toggle", {"id": 0});
};

let timerId;

Shelly.addStatusHandler(function(e) {
   if (e.component === CONFIG.inputComponent) {
     // Door opened, start a timer
     if (e.delta.state === false) {
        timerId = Timer.set(
         /* number of miliseconds */ CONFIG.maxTimeDoorOpen * 1000,
         /* repeat? */ false,
         /* callback */ toggleOff
       );
       print("Start timer");
     }
     // Door closed, clear the timer, its already closed, e.g. no need to do anything
     else if (e.delta.state === true) {
       Timer.clear(timerId);
       print("Clear timer");
     }
   }
});
