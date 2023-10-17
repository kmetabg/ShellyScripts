// This script is created by ChatGPT, test in before use for commercial setup

// Constants for the script
const TARGET_SHELLY_SSID_PREFIX = 'Shelly';
const ORIGINAL_WIFI_SSID = 'YourOriginalSSID';  // The SSID the main Shelly was originally connected to.
const ORIGINAL_WIFI_PASSWORD = 'YourOriginalPassword';  // Password for the original network.
const TARGET_WIFI_SSID = 'YourTargetSSID';
const TARGET_WIFI_PASSWORD = 'YourTargetPassword';

// Helper function to check if a string starts with a given prefix
function stringStartsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
}

// This function tries to provision a Shelly device by first connecting to its SSID 
// and then setting the desired WiFi credentials.
function provisionShellyDevice(ssid, callback) {
    // Step 1: Connect to the target Shelly device's open network
    print("Connecting to " + ssid + "...");
    Shelly.call("WiFi.SetConfig", {
        "enabled": true,
        "ssid": ssid,
        "password": ""
    }, function(connectResponse) {
        if (!connectResponse.success) {
            print("Failed to connect to " + ssid);
            callback();
            return;
        }
        
        // Step 2: Retrieve the current WiFi configuration of the target Shelly
        Shelly.call("HTTP.Get", {
            "url": "http://192.168.33.1/rpc/WiFi.GetConfig"
        }, function(statusResponse) {
            if (!statusResponse.enabled) {
                print("Failed to retrieve WiFi configuration from " + ssid);
                reconnectOriginal(callback);
                return;
            }

            if (statusResponse.ssid === TARGET_WIFI_SSID) {
                print("Shelly device " + ssid + " is already connected to the target WiFi. IP: " + statusResponse.ip);
                reconnectOriginal(callback);
                return;
            } 

            // Step 3: Set the desired WiFi credentials on the target Shelly
            Shelly.call("HTTP.Post", {
                "url": "http://192.168.33.1/rpc/WiFi.SetConfig",
                "headers": { "Content-Type": "application/json" },
                "body": JSON.stringify({
                    "enabled": true,
                    "ssid": TARGET_WIFI_SSID,
                    "password": TARGET_WIFI_PASSWORD
                })
            }, function(provisionResponse) {
                if (!provisionResponse.success) {
                    print("Failed to set WiFi credentials for " + ssid);
                    reconnectOriginal(callback);
                    return;
                }
                
                // Step 4: Wait for a bit and then verify if the provisioning was successful
                print("Credentials set for " + ssid + ". Waiting 10 seconds to verify...");
                Shelly.call("sys/delay", { "delay_ms": 10000 }, function() {
                    Shelly.call("HTTP.Get", {
                        "url": "http://192.168.33.1/rpc/WiFi.GetConfig"
                    }, function(checkResponse) {
                        if (checkResponse.enabled && checkResponse.ssid === TARGET_WIFI_SSID) {
                            print("Provisioned " + ssid + " successfully!");
                        } else {
                            print("Failed to provision " + ssid + " after setting credentials.");
                        }
                        reconnectOriginal(callback);
                    });
                });
            });
        });
    });
}

// This function is responsible for reconnecting the main Shelly back to its original network.
function reconnectOriginal(callback) {
    print("Reconnecting to original WiFi...");
    Shelly.call("WiFi.SetConfig", {
        "enabled": true,
        "ssid": ORIGINAL_WIFI_SSID,
        "password": ORIGINAL_WIFI_PASSWORD
    }, callback);
}

// The main flow of the script starts here. First, we perform a WiFi scan.
Shelly.call("WiFi.Scan", {}, function(scanResponse) {
    let shellySSIDs = [];

    // Filter out the SSIDs that belong to Shelly devices
    const networks = scanResponse.results || [];
    for (let i = 0; i < networks.length; i++) {
        let ssid = networks[i].ssid;
        if (ssid && stringStartsWith(ssid, TARGET_SHELLY_SSID_PREFIX)) {
            shellySSIDs.push(ssid);
        }
    }

    print("Found Shelly devices with SSIDs: " + shellySSIDs.join(", "));

    // Process each detected Shelly device one by one
    function processNextShelly(index) {
        if (index >= shellySSIDs.length) {
            print('Provisioning process completed.');
            return;
        }

        provisionShellyDevice(shellySSIDs[index], function() {
            processNextShelly(index + 1);
        });
    }

    processNextShelly(0);
});
