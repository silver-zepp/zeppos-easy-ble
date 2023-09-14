# ZeppOS BLE Master: Simple interaction with home Peripherals 
## This library is part of Easy ZeppOS SDK

```python
### ⓘ Reasons to use it (over the original BLE Master implementation):
1) All interactions are made with simple strings (no more arrays, arrays buffer nonsense)

2) All RETURN types are also automatically converted into strings. dev_addr is now
    a proper MAC address "A1:B2:C3..."

3) Simple profile interaction - startListener vs mstOnPrepare -> mstBuildProfile -> interact

4) Automatically stores profile id pointer and other essentials for for future handling

5) Stops everything with simple stop() call provided with a single MAC address

6) Ready to handle multiple connections

7) To disconnect/pair the device you no longer need to remember/store the connect_id -
    just use device's MAC address

8) New setters and getters - get.devices() // returns an object that contains info about all previously
    scanned/connected devices format shown below

9) You can write your characteristics/descriptors with a simple string like "55AA01080501F1" or a string
    that represents an array buffer "\u0055\u00AA\u0001\u0008\u0005\u0001\u00F1" or just a usual
    array buffer new Uint8Array([0x55, 0xAA, 0x01, 0x08, 0x05, 0x01, 0xF1]).buffer

10) [NOT YET IMPLEMENTED] Profile autogeneration. Don't know all the chars and desc's?
    Use what is already known to generate a basic profile ready for interaction.

11) MAC addresses case insensitivity. Fail-safe approach to handle "A1:B2:C3..."
    the same way as "a1:b2:c3"
```
Additions:
startScan(response_callback, options = {}) 
- additional options.duration parameter in millis to stop the scan
- additional options.on_duration() callback that executes after the duration period

### ⓘ Note: this library requires ZeppOS 3.0 compliant device. 
#### Tested with Amazfit GTR 5 (Balance/Monaco)

Get library: [easy-ble](https://github.com/silver-zepp/zeppos-easy-ble/blob/master/easy-ble/ble-master.js)

Get example: [ble-master-example](https://github.com/silver-zepp/zeppos-easy-ble/tree/master/ble-master-example)

## How to use it (example):
```js
init(){
    // start scanning for nearby devices
    const scan_success = ble.startScan((scan_result) => {
        // if the device that we search for is found
        if (ble.get.hasDevice(MAC)){
            // stop the scan
            ble.stopScan();
            
            // start connecting
            ble.connect(MAC, (connect_result) => {
                if (ble.get.isConnected(MAC)){

                    // init (modify) profile
                    const profile_object = ble.modifyProfileObject(MAC, original_profile_object);

                    // start listener
                    ble.startListener(profile_object, (status)=> { // backend_response // profile, status
                        // if status = OK (0), write your attributes
                        if (status === 0){ 
                            // Write the light_off data to the characteristic
                            const result = ble.write.characteristic(LAMP_MAC, 'A040', light_off_ab);

                            if (result.success) {
                                vis.log("Successfully wrote characteristic");
                            } else {
                                vis.log("Failed to write characteristic:", result.error);
                            }
                        }
                    });
                }
            });
        }
    });
}
stop(){
    // gracefully stop all callbacks, destroy profile's backend instance the disconnect the BLE 
    ble.stop(MAC);
}
```

### ⓘ Structure of get.devices() return object:
```js
{
  "a1:a2:a3:a4:a5:a6": {
    "dev_name": "my device",
    "rssi": -92
  },
  "b1:b2:b3:b4:b5:b6": {
    "dev_name": "other device",
    "rssi": -86,
    "service_uuid_array": [
      "A032",
      "A032"
    ]
  },
  "c1:c2:c3:c4:c5:c6": {
    "dev_name": "another device",
    "rssi": -69,
    "service_uuid_array": [
      "181D"
    ],
    "service_data_array": [
      {
        "uuid": "181D",
        "service_data": "ff5ad4"
      }
    ]
  }
  
}
```
