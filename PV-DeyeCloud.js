// Minumum requirments: Shelly Gen3/Gen4/Pro device with firmware version: 1.6+
// To enable access to deye cloud you need to login at https://developer.deyecloud.com/app and create appID and appSecret. 
// To make this script fully working you need to create 4 numbers components and 1 text component
// number:200   Generation Power (W) 
// number:201   Battery SOC (%)
// number:20    Battery Power (W)
// number:20    Consumption Power (W)
// number:204   Grid Power (W)



let appId = "YOUR_APP_ID"; // Change with yours
let appSecret = "YOUR_APP_SECRET"; // Change with yours
let email = "deye cloud acount e-mail"; // Change with yours
let passwordHash = "deye cloud password SHA256 hash";  // lowercase SHA256 hash
let stationId = Your_Station_Id_number; // Take this value from deyecloud web or app, it's your PV plant ID

// === Token part split and store ===
function storeTokenParts(token, expiresAt, callback) {
  let part1 = token.substring(0, 240);
  let part2 = token.substring(240, 480);
  let part3 = token.substring(480, 720);
  let part4 = token.substring(720);

  Shelly.call("KVS.Set", { key: "deye_token_1", value: part1 }, function () {
    Timer.set(100, false, function () {
      Shelly.call("KVS.Set", { key: "deye_token_2", value: part2 }, function () {
        Timer.set(100, false, function () {
          Shelly.call("KVS.Set", { key: "deye_token_3", value: part3 }, function () {
            Timer.set(100, false, function () {
              Shelly.call("KVS.Set", { key: "deye_token_4", value: part4 }, function () {
                Timer.set(100, false, function () {
                  Shelly.call("KVS.Set", {
                    key: "deye_token_expires",
                    value: expiresAt.toString()
                  }, function () {
                    print("✅ Token stored in 4 parts + expiry");
                    callback(token);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

// === Request token from Deye Cloud ===
function requestNewToken(callback) {
  print("🔐 Requesting new token...");

  Shelly.call("HTTP.REQUEST", {
    method: "POST",
    url: "https://eu1-developer.deyecloud.com/v1.0/account/token?appId=" + appId,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email,
      password: passwordHash,
      appSecret: appSecret
    })
  }, function (res, err) {
    if (res && res.code === 200) {
      let data = JSON.parse(res.body);
      if (data.accessToken) {
        let token = data.accessToken;
        let expiresAt = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 60);  // 60 days
        storeTokenParts(token, expiresAt, callback);
      } else {
        print("❌ No accessToken in response");
      }
    } else {
      print("❌ Token request failed:", err || res.code);
    }
  });
}

// === Rebuild token from 4 parts if not expired ===
function getToken(callback) {
  Shelly.call("KVS.Get", { key: "deye_token_expires" }, function (resExp) {
    let now = Math.floor(Date.now() / 1000);
    let expires_at = resExp && resExp.value ? parseInt(resExp.value) : 0;

    if (expires_at > now) {
      Shelly.call("KVS.Get", { key: "deye_token_1" }, function (r1) {
        let p1 = r1 && r1.value ? r1.value : "";

        Shelly.call("KVS.Get", { key: "deye_token_2" }, function (r2) {
          let p2 = r2 && r2.value ? r2.value : "";

          Shelly.call("KVS.Get", { key: "deye_token_3" }, function (r3) {
            let p3 = r3 && r3.value ? r3.value : "";

            Shelly.call("KVS.Get", { key: "deye_token_4" }, function (r4) {
              let p4 = r4 && r4.value ? r4.value : "";

              let token = p1 + p2 + p3 + p4;
              print("🔐 Using token start:", token.substring(0, 20));
              callback(token);
            });
          });
        });
      });
    } else {
      requestNewToken(callback);
    }
  });
}

// === Fetch Deye station data ===
function getBatteryData() {
  getToken(function (accessToken) {
    Shelly.call("HTTP.REQUEST", {
      method: "POST",
      url: "https://eu1-developer.deyecloud.com/v1.0/station/latest",
      headers: {
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ stationId: stationId })
    }, function (res, err) {
      if (res && res.code === 200) {
        let data = JSON.parse(res.body);
        if (data.success && data.code === "1000000") {
          print("✅ Deye Station Data:");
          print("⚡ Generation Power: " + data.generationPower + " W");
          Virtual.getHandle("number:200").setValue(data.generationPower);

          print("🏠 Consumption Power: " + data.consumptionPower + " W");
          Virtual.getHandle("number:203").setValue(data.consumptionPower);

          print("🧲 Wire Power: " + data.wirePower + " W");
          Virtual.getHandle("number:204").setValue(data.wirePower);

          print("🔋 Battery Power: " + data.batteryPower + " W");
          Virtual.getHandle("number:202").setValue(data.batteryPower);

          print("🔋 Battery SOC: " + data.batterySOC + " %");
          Virtual.getHandle("number:201").setValue(data.batterySOC);
          if (data.batteryPower > 0) {
            Virtual.getHandle("text:200").setValue("Discharge");
          } else if (data.batteryPower < 0) {
             Virtual.getHandle("text:200").setValue("Charge");
          } else {
            Virtual.getHandle("text:200").setValue("Idle");
          }
        } else {
          print("⚠️ Unexpected response format");
        }
      } else {
        print("❌ Failed to fetch station data:", err || res.code);
      }
    });
  });
}

// === Start polling every 15s
Timer.set(15000, true, getBatteryData);
