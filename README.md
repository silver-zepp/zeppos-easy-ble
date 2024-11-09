# 🐦 Easy BLE library for ZeppOS v3+
![](/assets/easy-ble-esp32-showcase.gif)
### Description
The `Easy BLE` library is an advanced BLE management tool for `ZeppOS v3+` watches that features an automated profile generator, a hybrid asynchronous and sequential queue for efficient handling of all operations including writing and reading, user-friendly string-based interactions, seamless auto-conversions of data and addresses, support for multiple data types, and simplified device management through MAC address-centric commands, all designed to enhance usability and streamline BLE communications.

## To install the library run (from the root of your project)
```bash
npm i @silver-zepp/easy-ble
```

## ✨️ Full Communications Example
```js
// install -> npm i @silver-zepp/easy-ble
import { BLEMaster } from "@silver-zepp/easy-ble";
const ble = new BLEMaster();

// the mac of a device you are connecting to
const MAC = "1A:2B:3C:4D:5E:6F";

// simplified object that describes a profile
const services = {
  // service #1
  "FF00": {       // service UUID
    "FF02": [],         // READ chara UUID
    "FF03": ["2902"],   // NOTIFY chara UUID
            //  ^--- descriptor UUID
  },
  // ... add other services here if needed
}

// connect to a device
ble.connect(MAC, (connect_result)=>{
  // proceed further if [bool] connected is true
  if (connect_result.connected){
    // generate a complex profile object providing description of its services 
    const profile_object = ble.generateProfileObject(services);
    
    // start listening for the response from watch's backend
    ble.startListener(profile_object, (response)=> {
      if (response.success){
        // first subcribe to the events
        ble.on.charaValueArrived((uuid, data, len)=> {
            console.log("Read result:", uuid, data, len);
          }
        );
        
        // then manipulate - read/write/etc
        ble.read.characteristic("FF02");
        
        // As a result you should log
        // Read result: 'FF02' 'BAT_LVL_77' '10'
      }
    });
  }
});
```

>
> ### 💡 New example added 
>`./examples/ble-master-metric-parse`<br>
> #### Let's you parse battery level and heart rate from other Amazfit devices.<br>
![](/assets/hr-and-bat-parse-example.jpg)

# 📝 Easy BLE (Master) API Reference

## 📍BLEMaster (default class)

### `startScan(response_callback, options = {})`

Starts scanning for BLE devices.

#### Parameters
- `{Function} response_callback` - Callback function called with each device's scan result.
- `{Object} [options={}]` - Optional parameters for the scan.
- `{number} [options.duration]` - Duration of the scan in milliseconds. Auto-stops after this duration.
- `{Function} [options.on_duration]` - Callback function called when the scan stops after the specified duration.
- `{number} [options.throttle_interval=1000]` - Interval in milliseconds to throttle the processing of scan results.
- `{boolean} [options.allow_duplicates=false]` - Whether to include duplicate devices in each callback. Defaults to false.

#### Examples

```js
// example: start scanning for devices and log each found device
ble.startScan((device) => { console.log('Found device:', device); }); 

// advanced example: start scanning for 10 seconds with a custom throttle interval and allow duplicates, then stop and log
ble.startScan((device) =>  { console.log('Found device during scan:', device); }, 
           { duration: 10000, throttle_interval: 500, allow_duplicates: true, on_duration: () => console.log('Scan complete') });
```

#### Returns
{boolean} true if the scan started successfully, false otherwise.


### `stopScan()`

Stops the ongoing scanning process for BLE devices.

#### Examples

```js
// Simply stop the scan
ble.stopScan();

// Advanced example: start scanning for devices and then stop scanning after the device was found
ble.startScan((device) => {
  if (.get.hasMAC("1A:2B:3C:4D:5E:6F")) 
    .stopScan();
});
```
### Returns
{boolean} - true if the scan was successfully stopped, false if there was an error in stopping the scan.

### `connect(dev_addr, response_callback)`

Attempts to connect to a BLE device.

#### Parameters

- `dev_addr` {string} - The MAC address of the device to connect to.
- `response_callback` {function} - Callback function that receives the result of the connection attempt. The callback is called with an object containing two properties:
  - `connected`: A boolean indicating if the connection was successful.
  - `status`: A string indicating the connection status. Possible values are `connected`, `invalid mac`, `in progress`, `failed`, or `disconnected`.

#### Examples

```js
// Connect to a device and log the result
ble.connect("1A:2B:3C:4D:5E:6F", (result) => {
  if (result.connected) {
    console.log('Connected to device');
  } else {
    console.log('Failed to connect. Status:', result.status);
  }
});
```
### Returns
{boolean} - true if the connection attempt started successfully, false otherwise.

### `disconnect()`

Disconnects from a BLE device.

#### Examples

```js
// Disconnect from a device
ble.disconnect();
```
### Returns
{boolean} - true if the disconnection was successful, false if it failed or if the device was not connected.

### `pair()`

Attempts to pair with a BLE device. WARNING: This method might not work as expected and could potentially cause crashes. Use with caution.

#### Examples

```js
// Attempt to pair with a device
const success = ble.pair();
if (success) console.log('Pairing initiated successfully');
else console.log('Pairing failed or device not connected');
```
### Returns
{boolean} - Returns true if the call to initiate pairing with the device succeeded, false if it failed or if the device was not connected.

### `startListener(profile_object, response_callback)`

Starts listening for profile preparation events and builds a profile for interacting with a BLE device.

#### Parameters

- `profile_object` {Object} - The profile object describing how to interact with the BLE device. This should be generated using `generateProfileObject` method.
- `response_callback` {Function} - Callback function called with the result of the profile preparation. The callback receives an object containing 'success', 'message', and optionally 'code' properties.

#### Examples

```js
// Start listener with a profile object
const profile_object = ble.generateProfileObject(services); // detailed profile object
ble.startListener(profile_object, (response) => {
  if (response.success) {
    console.log('Profile preparation successful:', response.message);
  } else {
    console.log('Profile preparation failed:', response.message, 'Code:', response.code);
  }
});
```
### Returns
{void} - This method doesn’t return a value but invokes the response callback with the result of the profile preparation.

### `generateProfileObject(services, permissions = {})`

Generates a generic profile object for interacting with a BLE device.

#### Parameters

- `services` {object} - A list of services with their characteristics and descriptors. Each service is identified by its UUID and contains a map of its characteristics. Each characteristic, identified by its UUID, is an array of its descriptor UUIDs.
- `permissions` {object} [permissions={}] - Optional. An object specifying custom permissions for characteristics and descriptors. If not provided, defaults to a permission value of 32 (all permissions) for each entry.

#### Examples

```js
// Example of generating a profile object for a device with custom permissions
const services = {
  'service_uuid': {
    'char_uuid_1': ['desc_uuid_1', 'desc_uuid_2'],
    'char_uuid_2': []
  }
  // other services...
};
const permissions = {
  'char_uuid_1': PERMISSIONS.READ, // no need to provide perms for all UUIDs
};
const profile = ble.generateProfileObject(services, permissions);
```
### Returns
{object|null} - A generic profile object for the device, or null if the device was not found. The profile object includes device connection information, services, characteristics, and their permissions.

### `quit()`

Quits all interactions with the currently connected device and cleans up.

#### Examples

```js
// Quit interaction with a connected device
ble.quit();
```


### `SetDebugLevel(debug_level)`

Sets the debug log level for the BLEMaster class.

#### Parameters

- `debug_level` {number} - The debug level to set. Possible values:
  - `0` - No logs
  - `1` - Critical errors only
  - `2` - Errors and warnings
  - `3` - All logs (including debug information)

#### Examples

```js
// Show all logs
BLEMaster.SetDebugLevel(3);
```


## 📍Write (sub-class)

### `characteristic(uuid, data, write_without_response = false)`

Writes data to a characteristic of a BLE device. This operation is queued to ensure proper synchronization with other BLE operations.

#### Parameters

- `uuid` {string} - The UUID of the characteristic to write to.
- `data` {string|ArrayBuffer|Uint8Array} - The data to write, in various formats.
- `write_without_response` {boolean} [write_without_response=false] - If true, writes without using the queue and without waiting for a response.

#### Examples

```js
// Write a string to a characteristic
ble.write.characteristic('char_uuid', 'Hello World');

// Fast write an ArrayBuffer to a characteristic and don't wait for response
const buffer = new Uint8Array([1, 2, 3]).buffer;
ble.write.characteristic('char_uuid', buffer, true);
```


### `descriptor(chara, desc, data)`

Writes data to a descriptor of a device's characteristic. This operation is queued to ensure proper synchronization with other BLE operations.

#### Parameters

- `chara` {string} - The UUID of the characteristic that the descriptor belongs to.
- `desc` {string} - The UUID of the descriptor to write to.
- `data` {string|ArrayBuffer|Uint8Array} - The data to write. Can be an ArrayBuffer, a Uint8Array, a hex string, or a regular string.

#### Examples

```js
// Write a hex string to a descriptor
ble.write.descriptor('char_uuid', 'desc_uuid', '0100');

// Write an ArrayBuffer to a descriptor
const buffer = new Uint8Array([1, 2, 3]).buffer;
ble.write.descriptor('char_uuid', 'desc_uuid', buffer);
```


### `enableCharaNotifications(chara, enable)`

Enables or disables notifications for a characteristic by writing to the CCCD (Client Characteristic Configuration Descriptor). This operation is queued to ensure proper synchronization with other BLE operations.

#### Parameters

- `chara` {string} - The UUID of the characteristic.
- `enable` {boolean} - Set to true to enable notifications, false to disable.

#### Examples

```js
// Toggle notifications for a characteristic (true/false)
ble.write.enableCharaNotifications('char_uuid', true);
```


## 📍Read (sub-class)


### `characteristic(uuid)`

Reads data from a characteristic of a BLE device. This operation is queued to ensure proper synchronization with other BLE operations.

#### Parameters

- `uuid` {string} - The UUID of the characteristic to read from.

#### Examples

```js
// Read data from a characteristic
const read = ble.read.characteristic('char_uuid');
if (read.success) console.log('Read successful');
else console.log('Read failed:', read.error);
```
### Returns
{Object} - An object containing a ‘success’ property and optionally an ‘error’ property.

### `descriptor(chara, desc)`

Reads data from a descriptor of a characteristic of a BLE device. This operation is queued to ensure proper synchronization with other BLE operations.

#### Parameters

- `chara` {string} - The UUID of the characteristic.
- `desc` {string} - The UUID of the descriptor to read from.

#### Examples

```js
// Read data from a descriptor
const desc = ble.read.descriptor("1A:2B:3C:4D:5E:6F", 'char_uuid', 'desc_uuid');
if (desc.success) console.log('Descriptor read successful');
else console.log('Descriptor read failed:', desc.error);
```
### Returns
{Object} - An object containing a ‘success’ property and optionally an ‘error’ property.



## 📍On (sub-class)

### `charaReadComplete(callback)`

Registers a callback for the characteristic read complete event. This callback is triggered after a read operation on a characteristic is completed.

#### Parameters

- `callback` {Function} - The callback to execute on event trigger.

#### Examples

```js
// Register callback for characteristic read complete event
ble.on.charaReadComplete((uuid, status) => {
  console.log('Characteristic read complete for UUID:', uuid, 'with status:', status);
});
```
#### Receives
uuid {string} - The UUID of the characteristic.
status {number} - The status of the read operation.


### `charaValueArrived(callback)`

Registers a callback for the characteristic value arrived event. This callback is triggered when new data is received from a characteristic.

#### Parameters

- `callback` {Function} - The callback to execute on event trigger.

#### Examples

```js
// Register callback for characteristic value arrived event
ble.on.charaValueArrived((uuid, data, length) => {
  console.log('Value arrived for UUID:', uuid, 'Data:', data, 'Length:', length);
});
```
#### Receives
uuid {string} - The UUID of the characteristic.
data {ArrayBuffer} - The data received from the characteristic.
length {number} - The length of the data.


### `charaWriteComplete(callback)`

Registers a callback for the characteristic write complete event. This callback is triggered after a write operation on a characteristic is completed.

#### Parameters

- `callback` {Function} - The callback to execute on event trigger.

#### Examples

```js
// Register callback for characteristic write complete event
ble.on.charaWriteComplete((uuid, status) => {
  console.log('Characteristic write complete for UUID:', uuid, 'Status:', status);
});
```

#### Receives
uuid {string} - The UUID of the characteristic.
status {number} - The status of the write operation.


### `descReadComplete(callback)`

Registers a callback for the descriptor read complete event. This callback is triggered after a read operation on a descriptor is completed.

#### Parameters

- `callback` {Function} - The callback to execute on event trigger.

#### Examples

```js
// Register callback for descriptor read complete event
ble.on.descReadComplete((chara, desc, status) => {
  console.log(`Descriptor read complete for Characteristic UUID: ${chara}, 
               Descriptor UUID: ${desc}, Status: ${status}`);
});
```

#### Receives
chara {string} - UUID of the characteristic
desc {string} - UUID of the descriptor
status {number} - Status of the read operation


### `descValueArrived(callback)`

Registers a callback for the descriptor value arrived event. This callback is triggered when new data arrives at a descriptor.

#### Parameters

- `callback` {Function} - The callback to execute on event trigger.

#### Examples

```js
// Register callback for descriptor value arrived event
ble.on.descValueArrived((chara, desc, data, length) => {
  console.log(`Descriptor value arrived for Characteristic UUID: ${chara}, 
               Descriptor UUID: ${desc}, Data: ${data}, Length: ${length}`);
});
```
#### Receives
chara {string} - UUID of the characteristic
desc {string} - UUID of the descriptor
data {ArrayBuffer} - Data received
length {number} - Length of the data


### `descWriteComplete(callback)`

Registers a callback for the descriptor write complete event. This callback is triggered after a write operation on a descriptor is completed.

#### Parameters

- `callback` {Function} - The callback to execute on event trigger.

#### Examples

```js
// Register callback for descriptor write complete event
ble.on.descWriteComplete((chara, desc, status) => {
  console.log(`Descriptor write complete for Characteristic UUID: ${chara}, 
               Descriptor UUID: ${desc}, Status: ${status}`);
});
```
#### Receives
chara {string} - UUID of the characteristic
desc {string} - UUID of the descriptor
status {number} - Status of the write operation


### `charaNotification(callback)`

Registers a callback for the characteristic notification event. This callback is triggered when a notification is received from a characteristic.

#### Parameters

- `callback` {Function} - The callback to execute on event trigger.

#### Examples

```js
// Register callback for characteristic notification event
ble.on.charaNotification((uuid, data, length) => {
  console.log(`Notification received for UUID: ${uuid}, Data: ${data}, Length: ${length}`);
});
```
#### Receives
uuid {string} - UUID of the characteristic
data {ArrayBuffer} - Notification data
length {number} - Length of the data


### `serviceChangeBegin(callback)`

Registers a callback for the service change begin event. This callback is triggered when a BLE service change process begins.

#### Parameters

- `callback` {Function} - The callback to execute on event trigger.

#### Examples

```js
// Register callback for service change begin event
ble.on.serviceChangeBegin(() => {
  console.log(`Service change has begun`);
});
```


### `serviceChangeEnd(callback)`

Registers a callback for the service change end event. This callback is triggered when a BLE service change process ends.

#### Parameters

- `callback` {Function} - The callback to execute on event trigger.

#### Examples

```js
// Register callback for service change end event
ble.on.serviceChangeEnd(() => {
  console.log(`Service change has ended`);
});
```


## 📍Off (sub-class)


### `charaReadComplete()`

Deregisters the callback for characteristic read complete event.

#### Examples

```js
ble.off.charaReadComplete();
```


### `charaValueArrived()`

Deregisters the callback for characteristic value arrived event.

#### Examples

```js
ble.off.charaValueArrived();
```


### `charaWriteComplete()`

Deregisters the callback for characteristic write complete event.

#### Examples

```js
ble.off.charaWriteComplete();
```


### `charaWriteComplete()`

Deregisters the callback for characteristic write complete event.

#### Examples

```js
ble.off.charaWriteComplete();
```


### `descValueArrived()`

Deregisters the callback for descriptor value arrived event.

#### Examples

```js
ble.off.descValueArrived();
```


### `descWriteComplete()`

Deregisters the callback for descriptor write complete event.

#### Examples

```js
ble.off.descWriteComplete();
```


### `charaNotification()`

Deregisters the callback for characteristic notification event.

#### Examples

```js
ble.off.charaNotification();
```


### `serviceChangeBegin()`

Deregisters the callback for service change begin event.

#### Examples

```js
ble.off.serviceChangeBegin();
```


### `serviceChangeEnd()`

Deregisters the callback for service change end event.

#### Examples

```js
ble.off.serviceChangeEnd();
```


### `deregisterAll()`

Deregisters all callbacks associated with the current BLE connection. This method ensures no event callbacks remain active after stopping BLE operations.

#### Examples

```js
ble.off.deregisterAll();
```

### 📍Get (sub-class)


### `devices()`

Retrieves information about all discovered devices.

#### Examples

```js
// Get all discovered devices
const devices = ble.get.devices();
console.log('Discovered devices:', JSON.stringify(devices));
```
### Returns
{Object} An object containing information about all discovered devices.


### `isConnected()`

Checks if a specific device is currently connected.

#### Examples

```js
// Check if a device is connected
const is_connected = ble.get.isConnected();
console.log('Is device connected:', is_connected);
```
### Returns
{boolean} True if the device is connected, false otherwise.


### `hasMAC(dev_addr)`

Checks if a device with a specific MAC address has been discovered.

#### Parameters

- `dev_addr` {string} - The MAC address of the device.

#### Examples

```js
// Check if a specific mac has been discovered
const has_mac = ble.get.hasMAC("1A:2B:3C:4D:5E:6F");
console.log('Has the mac been discovered:', has_mac);
```
### Returns
{boolean} true if the device has been discovered, false otherwise.


### `hasDeviceName(dev_name)`

Checks if any discovered device has a specific device name.

#### Parameters
- `{string} dev_name` - The device name to check for.

#### Examples

```js
// example: check if any device has the name "my ble peripheral"
const has_dev_name = ble.get.hasDeviceName("my ble peripheral");
console.log('Has device name "my ble peripheral":', has_dev_name);
```

#### Returns
{boolean} true if any device has the specified device name, false otherwise.



### `hasService(service_uuid)`

Checks if any discovered device has a specific service UUID.

#### Parameters
- `{string} service_uuid` - The UUID of the service to check for.

#### Examples

```js
// Check if any device has a specific service
const has_service = ble.get.hasService("1812");
console.log('Has service 1812:', has_service);
```

#### Returns
{boolean} true if any device has the specified service, false otherwise.


### `hasServiceData(service_data)`

Checks if any discovered device contains specific service data.

#### Parameters
- `{string} service_data` - The service data to check for.

#### Examples

```js
// Check if any device contains specific service data
const has_service_data = ble.get.hasServiceData("somedata");
console.log('Has service data "somedata":', has_service_data);
```

#### Returns
{boolean} true if any device contains the specified service data, false otherwise.


### `hasVendorData(vendor_data)`

Checks if any discovered device has a specific vendor data.

#### Parameters
- `{string} vendor_data` - The vendor data to check for.

#### Examples

```js
// Check if any device has "zepp" data
const has_vendor_data = ble.get.hasVendorData("zepp");
console.log('Has vendor "zepp":', has_vendor_data);
```

#### Returns
{boolean} true if any device has the specified vendor data, false otherwise.


### `hasVendorID(vendor_id)`

Checks if any discovered device has a specific vendor ID.

#### Parameters
- `{number} vendor_id` - The vendor ID to check for.

#### Examples

```js
// example: Check if any device has vendor ID 777
const has_vendor_id = ble.get.hasVendorID(777);
console.log('Has vendor ID 777:', has_vendor_id);
```

#### Returns
{boolean} true if any device has the specified vendor ID, false otherwise.


### `profilePID()`

Retrieves the profile pointer ID of a specific device. This is only useful if you need to communicate directly with `hmBle.mst` methods.

#### Examples

```js
// Get the profile ID of a device
const profile_pid = ble.get.profilePID();
console.log('Profile pointer ID:', profile_pid);
```
### Returns
{number|null} The profile pointer ID of the device if available, null otherwise.


### `connectionID()`

Retrieves the connection ID of a specific device. This is only useful if you need to communicate directly with `hmBle.mst` methods.

#### Examples

```js
// Get the connection ID of a device
const connection_id = ble.get.connectionID();
console.log('Connection ID:', connection_id);
```
### Returns
{number|null} The connection ID of the device if available, null otherwise.

## 📍Helpers (methods, collections)

### `function ab2hex(buffer)`

Converts an ArrayBuffer to a string of hexadecimal numbers. This function is useful when you need to represent binary data in a readable hexadecimal string format. For example, it can be used to display BLE device addresses or data in a human-readable form.

#### Parameters

- `buffer` {ArrayBuffer} - The ArrayBuffer to be converted.

#### Examples

```js
// Convert an ArrayBuffer to a hexadecimal string
const buffer = new Uint8Array([10, 20, 30]).buffer;
const hex_str = ab2hex(buffer);
console.log(hex_str); // Output: '0A 14 1E'
```
### Returns
{string} The hexadecimal string representation of the ArrayBuffer. Each byte is represented as a two-character hex code.


### `function ab2str(buffer)`

Converts an ArrayBuffer into a string. This function is used when you need to convert binary data (ArrayBuffer) into a regular JavaScript string. It's particularly useful for converting data received from BLE devices into text, assuming the data represents text in a compatible encoding (e.g., UTF-8).

#### Parameters

- `buffer` {ArrayBuffer} - The ArrayBuffer to be converted.

#### Examples

```js
// Convert an ArrayBuffer to a string
const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // 'Hello' in ASCII
const str = ab2str(buffer);
console.log(str); // output: 'Hello'
```
### Returns
{string} The resulting string. Note that the output is dependent on the encoding of the byte data in the ArrayBuffer.


### `function ab2num(buffer)`

Converts an ArrayBuffer to a number. This function is useful when you need to represent binary data in a readable number format. For example, it can be used to display BLE device battery levels or other data in a human-readable form.

#### Parameters
- `{ArrayBuffer} buffer` - The ArrayBuffer to be converted.

#### Examples

```js
// example: convert an ArrayBuffer to a number
const buffer = new Uint8Array([81]).buffer;
const num = ab2num(buffer);
console.log(num); // Output: 81
```
#### Returns
{number} The number representation of the ArrayBuffer.



### `const PERMISSIONS = {...}`

Object containing BLE permissions. Each permission is a property with a detailed description and a numeric value. In many scenarios, it's sufficient to use the built-in generateProfileObject(...) auto-permission 32. However, for complex and encrypted communications, specific permissions defined here may be required.

#### Properties

- `READ`: Allows reading the characteristic value.
- `READ_ENCRYPTED`: Allows reading the characteristic value with an encrypted link.
- `READ_ENCRYPTED_MITM`: Allows reading the characteristic value with an encrypted and authenticated link (MITM protection).
- `WRITE`: Allows writing the characteristic value.
- `WRITE_ENCRYPTED`: Allows writing the characteristic value with an encrypted link.
- `WRITE_ENCRYPTED_MITM`: Allows writing the characteristic value with an encrypted and authenticated link (MITM protection).
- `WRITE_SIGNED`: Allows writing the characteristic value with a signed write (without response).
- `WRITE_SIGNED_MITM`: Allows writing the characteristic value with a signed write (without response) and authenticated link (MITM protection).
- `READ_DESCRIPTOR`: Allows reading the descriptor value.
- `WRITE_DESCRIPTOR`: Allows writing the descriptor value.
- `READ_WRITE_DESCRIPTOR`: Allows both reading and writing the descriptor value.
- `NONE`: No permissions granted.
- `ALL`: All permissions granted.

Each property is an object with a `description` and a `value`. The `description` is a string that explains the permission, and the `value` is a numeric value representing the permission.



