/**
 * Converts an array of numbers into an ArrayBuffer.
 * @param {number[]} arr - The array of numbers to be converted.
 * @returns {ArrayBuffer} The resulting ArrayBuffer.
 */
export function arr2ab(arr: number[]): ArrayBuffer;
/**
 * Converts an ArrayBuffer into an array of numbers.
 * @param {ArrayBuffer} arr_buf - The ArrayBuffer to be converted.
 * @returns {number[]} The array of numbers.
 */
export function ab2arr(arr_buf: ArrayBuffer): number[];
/**
 * Converts an ArrayBuffer to a string of hexadecimal numbers.
 * This function is useful when you need to represent binary data in a readable hexadecimal string format.
 * For example, it can be used to display BLE device addresses or data in a human-readable form.
 *
 * @param {ArrayBuffer} buffer - The ArrayBuffer to be converted.
 * @param {boolean} [space=false] - Optional parameter to include spaces between hex pairs.
 * @returns {string} The hexadecimal string representation of the ArrayBuffer. Each byte is represented as a two-character hex code.
 * @example
 * // example: convert an ArrayBuffer to a hexadecimal string
 * const buffer = new Uint8Array([10, 20, 30]).buffer;
 * const hexStr = ab2hex(buffer);
 * console.log(hexStr); // output: '0A141E'
 * // advanced example: convert an ArrayBuffer to a hexadecimal string with spaces
 * const buffer = new Uint8Array([10, 20, 30]).buffer;
 * const hex_str = ab2hex(buffer, true);
 * console.log(hex_str); // output: '0A 14 1E'
 */
export function ab2hex(buffer: ArrayBuffer, space?: boolean): string;
/**
 * Converts an ArrayBuffer to a number.
 * This function is useful when you need to represent binary data in a readable number format.
 * For example, it can be used to display BLE device battery levels or other data in a human-readable form.
 *
 * @param {ArrayBuffer} buffer - The ArrayBuffer to be converted.
 * @returns {number} The number representation of the ArrayBuffer.
 * @example
 * // example: convert an ArrayBuffer to a number
 * const buffer = new Uint8Array([81]).buffer;
 * const num = ab2num(buffer);
 * console.log(num); // output: 81
 * // advanced example: convert a multi-byte ArrayBuffer to a number
 * const buffer = new Uint8Array([0x01, 0x02, 0x03]).buffer;
 * const num = ab2num(buffer);
 * console.log(num); // output: 66051
 */
export function ab2num(buffer: ArrayBuffer): number;
/**
 * Converts an ArrayBuffer into a string.
 * This function is used when you need to convert binary data (ArrayBuffer) into a regular JavaScript string.
 * It's particularly useful for converting data received from BLE devices into text, assuming the data represents text in a compatible encoding (e.g., UTF-8).
 * @param {ArrayBuffer} buffer - The ArrayBuffer to be converted.
 * @example
 * // example: convert an ArrayBuffer to a string
 * const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // 'Hello' in ASCII
 * const str = ab2str(buffer);
 * console.log(str); // output: 'Hello'
 * @returns {string} The resulting string. Note that the output is dependent on the encoding of the byte data in the ArrayBuffer.
 */
export function ab2str(buffer: ArrayBuffer): string;
/**
 * BLEMaster class for managing Bluetooth Low Energy (BLE) operations.
 * This class provides methods for scanning, connecting, and interacting with BLE devices.
 */
export class BLEMaster {
    /**
     * Sets the debug log level for the BLEMaster class.
     * @param {number} debug_level - The debug level to set. Possible values:
     *    `0` - No logs
     *    `1` - Critical errors only
     *    `2` - Errors and warnings
     *    `3` - All logs (including debug information)
     * @example BLEMaster.SetDebugLevel(3); // show all logs
    */
    static SetDebugLevel(debug_level: number): void;
    /**
     * @type {Write} A device writer.
     */
    write: Write;
    /**
     * @type {Read} A device reader.
     */
    read: Read;
    /**
     * @type {On} An instance for handling BLE event callbacks.
     */
    on: On;
    /**
     * @type {Off} An instance for deregistering BLE event callbacks.
     */
    off: Off;
    /**
     * @type {Get} A device information getter.
     */
    get get(): Get;
    /**
     * Starts scanning for BLE devices.
     * @param {Function} response_callback - Callback function called with each device's scan result.
     * @param {Object} [options={}] - Optional parameters for the scan.
     * @param {number} [options.duration] - Duration of the scan in milliseconds. Auto-stops after this duration.
     * @param {Function} [options.on_duration] - Callback function called when the scan stops after the specified duration.
     * @param {number} [options.throttle_interval=1000] - Interval in milliseconds to throttle the processing of scan results.
     * @param {boolean} [options.allow_duplicates=false] - Whether to include duplicate devices in each callback. Defaults to false.
     * @example
     * // example: start scanning for devices and log each found device
     * ble.startScan((device) => { console.log('Found device:', device); });
     *
     * // advanced example: start scanning for 10 seconds with a custom throttle interval and allow duplicates, then stop and log
     * ble.startScan((device) =>  { console.log('Found device during scan:', device); },
     *            { duration: 10000, throttle_interval: 500, allow_duplicates: true, on_duration: () => console.log('Scan complete') });
     * @returns {boolean} true if the scan started successfully, false otherwise.
     */
    startScan(response_callback: Function, options?: {
        duration?: number;
        on_duration?: Function;
        throttle_interval?: number;
        allow_duplicates?: boolean;
    }): boolean;
    /**
     * Stops the ongoing scanning process for BLE devices.
     * This method should be called to terminate a scan started by `startScan` method, especially if the scan was initiated without a specified duration.
     * @example
     * // example: simply stop the scan
     * ble.stopScan();
     * // advanced example: start scanning for devices and then stop scanning after the device was found
     * ble.startScan((device) => {
     *   if (.get.hasMAC("1A:2B:3C:4D:5E:6F")) .stopScan();
     * });
     * @returns {boolean} true if the scan was successfully stopped, false if there was an error in stopping the scan.
     */
    stopScan(): boolean;
    /**
     * Attempts to connect to a BLE device.
     * @param {string} dev_addr - The MAC address of the device to connect to.
     * @param {function} response_callback - Callback function that receives the result of the connection attempt.
     *   The callback is called with an object containing two properties:
     *   - `connected`: A boolean indicating if the connection was successful.
     *   - `status`: A string indicating the connection status. Possible values are `connected`, `invalid mac`,
     *     `in progress`, `failed`, or `disconnected`.
     * @example
     * // example: connect to a device and log the result
     * ble.connect("1A:2B:3C:4D:5E:6F", (result) => {
     *   if (result.connected) {
     *     console.log('Connected to device');
     *   } else {
     *     console.log('Failed to connect. Status:', result.status);
     *   }
     * });
     * @returns {boolean} true if the connection attempt started successfully, false otherwise.
     */
    connect(dev_addr: string, response_callback: Function): boolean;
    /**
     * Disconnects from a BLE device.
     * @example
     * // example: disconnect from a device
     * ble.disconnect();
     * @returns {boolean} true if the disconnection was successful, false if it failed or if the device was not connected.
     */
    disconnect(): boolean;
    /**
     * Attempts to pair with a BLE device.
     * WARNING: This method might not work as expected and could potentially cause crashes. Use with caution.
     * TODO: Backend fix required for stable functionality (?)
     * @example
     * // example: attempt to pair with a device
     * const success = ble.pair();
     * if (success) console.log('Pairing initiated successfully');
     * else console.log('Pairing failed or device not connected');
     * @returns {boolean} Returns true if the call to initiate pairing with the device succeeded, false if it failed or if the device was not connected.
     */
    pair(): boolean;
    /**
     * Starts listening for profile preparation events and builds a profile for interacting with a BLE device.
     * This method registers a callback to handle profile preparation and initiates the process to build a BLE profile based on the provided profile object.
     *
     * @param {Object} profile_object - The profile object describing how to interact with the BLE device. This should be generated using `generateProfileObject` method.
     * @param {Function} response_callback - Callback function called with the result of the profile preparation. The callback receives an object containing 'success', 'message', and optionally 'code' properties.
     *
     * @example
     * // Example: start listener with a profile object
     * const profile_object = ble.generateProfileObject(services); // detailed profile object
     * ble.startListener(profile_object, (response) => {
     *   if (response.success) {
     *     console.log('Profile preparation successful:', response.message);
     *   } else {
     *     console.log('Profile preparation failed:', response.message, 'Code:', response.code);
     *   }
     * });
     *
     * @returns {void} This method doesn't return a value but invokes the response callback with the result of the profile preparation.
     */
    startListener(profile_object: any, response_callback: Function): void;
    /**
     * Generates a generic profile object for interacting with a BLE device.
     * This method constructs a profile object that includes the device's characteristics and descriptors, along with their permissions.
     *
     * @param {object} services - A list of services with their characteristics and descriptors. Each service is identified by its UUID and contains a map of its characteristics. Each characteristic, identified by its UUID, is an array of its descriptor UUIDs.
     * @param {object} [permissions={}] - Optional. An object specifying custom permissions for characteristics and descriptors. If not provided, defaults to a permission value of 32 (all permissions) for each entry.
     *
     * @example
     * // example of generating a profile object for a device with custom permissions
     * const services = {
     *   'service_uuid': {
     *     'char_uuid_1': ['desc_uuid_1', 'desc_uuid_2'],
     *     'char_uuid_2': []
     *   }
     *   // other services...
     * };
     * const permissions = {
     *   'char_uuid_1': PERMISSIONS.READ, // no need to provide perms for all UUIDs
     * };
     * const profile = ble.generateProfileObject(services, permissions);
     *
     * @returns {object|null} A generic profile object for the device, or null if the device was not found. The profile object includes device connection information, services, characteristics, and their permissions.
     */
    generateProfileObject(services: object, permissions?: object): object | null;
    /**
     * Quits all interactions with the currently connected BLE device and resets the BLE Master state.
     * This method performs several actions:
     * 1. Stops communication with the currently connected device.
     * 2. Disconnects the connected device if it's still connected.
     * 3. Deregisters all event callbacks set up for BLE interactions.
     * 4. Resets the last connected device information and any other relevant state.
     * 5. Stops any ongoing BLE device scans.
     * This method is useful for cleanly exiting from BLE interactions, ensuring no lingering connections or callbacks.
     * @example
     * ble.quit(); // example: quit interaction with a connected device and clean up
     */
    quit(): void;
    #private;
}
declare class Write {
    constructor(getCurrentDevice: any, queueManager: any);
    /**
     * Writes data to a characteristic of a BLE device.
     * This operation is queued to ensure proper synchronization with other BLE operations.
     * @param {string} uuid - The UUID of the characteristic to write to.
     * @param {string|ArrayBuffer|Uint8Array} data - The data to write, in various formats.
     * @param {boolean} [write_without_response=false] - If true, writes without using the queue and without waiting for a response.
     * @example
     * // example: write a string to a characteristic
     * ble.write.characteristic('char_uuid', 'Hello World');
     * // advanced example: fast write an ArrayBuffer to a characteristic and don't wait for response
     * const buffer = new Uint8Array([1, 2, 3]).buffer;
     * ble.write.characteristic('char_uuid', buffer, true);
     */
    characteristic(uuid: string, data: string | ArrayBuffer | Uint8Array, write_without_response?: boolean): void;
    /**
     * Writes data to a descriptor of a device's characteristic.
     * This operation is queued to ensure proper synchronization with other BLE operations.
     * @param {string} chara - The UUID of the characteristic that the descriptor belongs to.
     * @param {string} desc - The UUID of the descriptor to write to.
     * @param {string|ArrayBuffer|Uint8Array} data - The data to write. Can be an ArrayBuffer, a Uint8Array, a hex string, or a regular string.
     * @example
     * // example: write a hex string to a descriptor
     * ble.write.descriptor('char_uuid', 'desc_uuid', '0100');
     * // advanced example: write an ArrayBuffer to a descriptor
     * const buffer = new Uint8Array([1, 2, 3]).buffer;
     * ble.write.descriptor('char_uuid', 'desc_uuid', buffer);
     */
    descriptor(chara: string, desc: string, data: string | ArrayBuffer | Uint8Array): void;
    /**
     * Enables or disables notifications for a characteristic by writing to the CCCD (Client Characteristic Configuration Descriptor).
     * This method also waits for a notification to confirm the enablement or disablement.
     * The operation is queued for synchronized execution.
     * @param {string} chara - The UUID of the characteristic.
     * @param {boolean} enable - Set to true to enable notifications, false to disable.
     * @example
     * // example: toggle notifications for a characteristic (true/false)
     * ble.write.enableCharaNotifications('char_uuid', true);
     */
    enableCharaNotifications(chara: string, enable: boolean): void;
    #private;
}
declare class Read {
    constructor(getCurrentDevice: any, queueManager: any);
    /**
     * Reads data from a characteristic of a BLE device.
     * This operation is queued to ensure proper synchronization with other BLE operations.
     * @param {string} uuid - The UUID of the characteristic to read from.
     * @example
     * // example: read data from a characteristic
     * const read = ble.read.characteristic('char_uuid');
     * if (read.success) console.log('Read successful');
     * else console.log('Read failed:', read.error);
     * @returns {Object} An object containing a 'success' property and optionally an 'error' property.
     */
    characteristic(uuid: string): any;
    /**
     * Reads data from a descriptor of a characteristic of a BLE device.
     * This operation is queued to ensure proper synchronization with other BLE operations.
     * @param {string} uuid - The UUID of the characteristic.
     * @param {string} desc - The UUID of the descriptor to read from.
     * @example
     * // example: read data from a descriptor
     * const desc = ble.read.descriptor('char_uuid', 'desc_uuid');
     * if (desc.success) console.log('Descriptor read successful');
     * else console.log('Descriptor read failed:', desc.error);
     * @returns {Object} An object containing a 'success' property and optionally an 'error' property.
     */
    descriptor(chara: any, desc: string): any;
    #private;
}
/**
 * Class to handle BLE event callbacks.
 */
declare class On {
    static "__#5@#chara_write_complete_flag": boolean;
    static "__#5@#desc_write_complete_flag": boolean;
    static "__#5@#last_chara_write_status": number;
    static "__#5@#last_desc_write_status": number;
    static _setCharaWriteCompleteFlag(value: any): void;
    static _setDescWriteCompleteFlag(value: any): void;
    static _getCharaWriteCompleteFlag(): boolean;
    static _getDescWriteCompleteFlag(): boolean;
    static _getLastCharaWriteStatus(): number;
    static _getLastDescWriteStatus(): number;
    static "__#5@#chara_read_complete_flag": boolean;
    static "__#5@#last_chara_read_status": number;
    static "__#5@#desc_read_complete_flag": boolean;
    static "__#5@#last_desc_read_status": number;
    static _setDescReadCompleteFlag(value: any): void;
    static _getDescReadCompleteFlag(): boolean;
    static _getLastDescReadStatus(): number;
    static _setCharaReadCompleteFlag(value: any): void;
    static _getCharaReadCompleteFlag(): boolean;
    static _getLastCharaReadStatus(): number;
    static _cb_charaReadComplete: any;
    static _cb_charaValueArrived: any;
    static _cb_charaWriteComplete: any;
    static _cb_descReadComplete: any;
    static _cb_descValueArrived: any;
    static _cb_descWriteComplete: any;
    static _cb_charaNotification: any;
    static _cb_serviceChangeBegin: any;
    static _cb_serviceChangeEnd: any;
    constructor(profile_pid: any);
    /**
     * Registers a callback for the characteristic read complete event.
     * This callback is triggered after a read operation on a characteristic is completed.
     * @param {Function} callback - The callback to execute on event trigger.
     * @example
     * // example: register callback for characteristic read complete event
     * ble.on.charaReadComplete((uuid, status) => {
     *   console.log('Characteristic read complete for UUID:', uuid, 'with status:', status);
     * });
     * @receive `uuid` (string) and `status` (number).
     */
    charaReadComplete(callback: Function): void;
    /**
     * Registers a callback for the characteristic value arrived event.
     * This callback is triggered when new data is received from a characteristic.
     * @param {Function} callback - The callback to execute on event trigger.
     * @example
     * // example: register callback for characteristic value arrived event
     * .on.charaValueArrived((uuid, data, length) => {
     *   console.log('Value arrived for UUID:', uuid, 'Data:', data, 'Length:', length);
     * });
     * @receive `uuid` (string), `data` (ArrayBuffer), and `length` (number).
     */
    charaValueArrived(callback: Function): void;
    /**
     * Registers a callback for the characteristic write complete event.
     * This callback is triggered after a write operation on a characteristic is completed.
     * @param {Function} callback - The callback to execute on event trigger.
     * @example
     * // example: register callback for characteristic write complete event
     * .on.charaWriteComplete((uuid, status) => {
     *   console.log('Characteristic write complete for UUID:', uuid, 'Status:', status);
     * });
     * @receive `uuid` (string) and `status` (number).
     */
    charaWriteComplete(callback: Function): void;
    /**
     * Registers a callback for the descriptor read complete event.
     * This callback is triggered after a read operation on a descriptor is completed.
     * @param {Function} callback - The callback to execute on event trigger.
     * @example
     * // example: register callback for descriptor read complete event
     * .on.descReadComplete((chara, desc, status) => {
     *   console.log(`Descriptor read complete for Characteristic UUID: ${chara},
     *                             Descriptor UUID: ${desc}, Status: ${status}`);
     * });
     * @receive `chara` (string) - UUID of the characteristic, `desc` (string) - UUID of the descriptor, `status` (number) - Status of the read operation.
     */
    descReadComplete(callback: Function): void;
    /**
     * Registers a callback for the descriptor value arrived event.
     * This callback is triggered when new data arrives at a descriptor.
     * @param {Function} callback - The callback to execute on event trigger.
     * @example
     * // example: register callback for descriptor value arrived event
     * .on.descValueArrived((chara, desc, data, length) => {
     *   console.log(`Descriptor value arrived for Characteristic UUID: ${chara},
     *              Descriptor UUID: ${desc}, Data: ${data}, Length: ${length}`);
     * });
     * @receive `chara` (string) - UUID of the characteristic, `desc` (string) - UUID of the descriptor, `data` (ArrayBuffer) - Data received, `length` (number) - Length of the data.
     */
    descValueArrived(callback: Function): void;
    /**
     * Registers a callback for the descriptor write complete event.
     * This callback is triggered after a write operation on a descriptor is completed.
     * @param {Function} callback - The callback to execute on event trigger.
     * @example
     * // example: register callback for descriptor write complete event
     * .on.descWriteComplete((chara, desc, status) => {
     *   console.log(`Descriptor write complete for Characteristic UUID: ${chara},
     *                              Descriptor UUID: ${desc}, Status: ${status}`);
     * });
     * @receive `chara` (string) - UUID of the characteristic, `desc` (string) - UUID of the descriptor, `status` (number) - Status of the write operation.
     */
    descWriteComplete(callback: Function): void;
    /**
     * Registers a callback for the characteristic notification event.
     * This callback is triggered when a notification is received from a characteristic.
     * @param {Function} callback - The callback to execute on event trigger.
     * @example
     * // example: register callback for characteristic notification event
     * .on.charaNotification((uuid, data, length) => {
     *   console.log(`Notification received for UUID: ${uuid}, Data: ${data}, Length: ${length}`);
     * });
     * @receive `uuid` (string) - UUID of the characteristic, `data` (ArrayBuffer) - Notification data, `length` (number) - Length of the data.
     */
    charaNotification(callback: Function): void;
    /**
     * Registers a callback for the service change begin event.
     * This callback is triggered when a BLE service change process begins.
     * @param {Function} callback - The callback to execute on event trigger.
     * @example
     * // example: register callback for service change begin event
     * .on.serviceChangeBegin(() => {
     *   console.log(`Service change has begun`);
     * });
     * @receive No parameters.
     */
    serviceChangeBegin(callback: Function): void;
    /**
     * Registers a callback for the service change end event.
     * This callback is triggered when a BLE service change process ends.
     * @param {Function} callback - The callback to execute on event trigger.
     * @example
     * // example: register callback for service change end event
     * .on.serviceChangeEnd(() => {
     *   console.log(`Service change has ended`);
     * });
     * @receive No parameters.
     */
    serviceChangeEnd(callback: Function): void;
    #private;
}
/**
 * Class to handle BLE event callbacks deregistration.
 * This class is used in conjunction with the On class to manage the lifecycle of event callbacks.
 */
declare class Off {
    /**
     * Deregisters the callback for characteristic read complete event.
     * @example
     * .off.charaReadComplete();
     */
    charaReadComplete(): void;
    /**
     * Deregisters the callback for characteristic value arrived event.
     * @example
     * .off.charaValueArrived();
     */
    charaValueArrived(): void;
    /**
     * Deregisters the callback for characteristic write complete event.
     * @example
     * .off.charaWriteComplete();
     */
    charaWriteComplete(): void;
    /**
     * Deregisters the callback for descriptor read complete event.
     * @example
     * .off.descReadComplete();
     */
    descReadComplete(): void;
    /**
     * Deregisters the callback for descriptor value arrived event.
     * @example
     * .off.descValueArrived();
     */
    descValueArrived(): void;
    /**
     * Deregisters the callback for descriptor write complete event.
     * @example
     * .off.descWriteComplete();
     */
    descWriteComplete(): void;
    /**
     * Deregisters the callback for characteristic notification event.
     * @example
     * .off.charaNotification();
     */
    charaNotification(): void;
    /**
     * Deregisters the callback for service change begin event.
     * @example
     * .off.serviceChangeBegin();
     */
    serviceChangeBegin(): void;
    /**
     * Deregisters the callback for service change end event.
     * @example
     * .off.serviceChangeEnd();
     */
    serviceChangeEnd(): void;
    /**
     * Deregisters all callbacks associated with the current BLE connection.
     * This method to ensures no event callbacks remain active after stopping BLE operations.
     * @example
     * .off.deregisterAll();
     */
    deregisterAll(): void;
}
declare class Get {
    constructor(getDevices: any, getCurrentDevice: any);
    /**
     * Retrieves information about all discovered devices.
     * @example
     * // example: get all discovered devices
     * const devices = .get.devices();
     * console.log('Discovered devices:', JSON.stringify(devices));
     * @returns {Object} An object containing information about all discovered devices.
     */
    devices(): any;
    /**
     * Checks if a specific device is currently connected.
     * @example
     * // example: check if a device is connected
     * const is_connected = .get.isConnected();
     * console.log('Is device connected:', is_connected);
     * @returns {boolean} True if the device is connected, false otherwise.
     */
    isConnected(): boolean;
    /**
     * Checks if a device with a specific MAC address has been discovered.
     * @param {string} dev_addr - The MAC address of the device.
     * @example
     * // example: check if a mac has been discovered
     * const has_mac = .get.hasMAC("1A:2B:3C:4D:5E:6F");
     * console.log('Has the device been discovered:', has_mac);
     * @returns {boolean} true if the device has been discovered, false otherwise.
     */
    hasMAC(dev_addr: string): boolean;
    /**
     * @deprecated This method is deprecated and will be removed in the future. Please use hasMAC() instead.
     */
    hasDevice(dev_addr: any): boolean;
    /**
     * Checks if any discovered device has a specific device name.
     * @param {string} dev_name - The device name to check for.
     * @example
     * // example: check if any device has the name "my ble peripheral"
     * const has_dev_name = .get.hasDeviceName("my ble peripheral");
     * console.log('Has device name "my ble peripheral":', has_dev_name);
     * @returns {boolean} true if any device has the specified device name, false otherwise.
     */
    hasDeviceName(dev_name: string): boolean;
    /**
     * Checks if any discovered device has a specific service UUID.
     * @param {string} service_uuid - The UUID of the service to check for.
     * @example
     * // example: check if any device has a specific service
     * const has_service = .get.hasService("1812");
     * console.log('Has service 1812:', has_service);
     * @returns {boolean} true if any device has the specified service, false otherwise.
     */
    hasService(service_uuid: string): boolean;
    /**
     * Checks if any discovered device contains specific service data.
     * @param {string} service_data - The service data to check for.
     * @example
     * // example: check if any device contains specific service data
     * const has_service_data = .get.hasServiceData("somedata");
     * console.log('Has service data "somedata":', has_service_data);
     * @returns {boolean} true if any device contains the specified service data, false otherwise.
     */
    hasServiceData(service_data: string): boolean;
    /**
     * Checks if any discovered device contains a specific service data UUID.
     * @param {string} uuid - The service data UUID to check for.
     * @returns {boolean} true if any device contains the specified service data UUID, false otherwise.
     * @example
     * // example: Check if any device contains service data with UUID '1337'
     * const has_sd_uuid = .get.hasServiceDataUUID('1337');
     * console.log('Has service data UUID 1337:', has_sd_uuid);
     */
    hasServiceDataUUID(uuid: string): boolean;
    /**
     * Checks if any discovered device has a specific vendor data.
     * @param {string} vendor_data - The name of the vendor to check for.
     * @example
     * // example: check if any device has "zepp" data
     * const has_vendor_data = .get.hasVendorData("zepp");
     * console.log('Has vendor "zepp":', has_vendor_data);
     * @returns {boolean} true if any device is from the specified vendor, false otherwise.
     */
    hasVendorData(vendor_data: string): boolean;
    /**
     * Checks if any discovered device has a specific vendor ID.
     * @param {number} vendor_id - The vendor ID to check for.
     * @returns {boolean} true if any device has the specified vendor ID, false otherwise.
     * @example
     * // example: Check if any device has vendor ID 777
     * const has_vendor_id = .get.hasVendorID(777);
     * console.log('Has vendor ID 777:', has_vendor_id);
     */
    hasVendorID(vendor_id: number): boolean;
    /**
     * Retrieves the profile pointer ID of a specific device. This is only useful if you need to communicate directly with `hmBle.mst` methods.
     * @example
     * // example: get the profile ID of a device
     * const profile_pid = .get.profilePID();
     * console.log('Profile pointer ID:', profile_pid);
     * @returns {number|null} The profile pointer ID of the device if available, null otherwise.
     */
    profilePID(): number | null;
    /**
     * Retrieves the connection ID of a specific device. This is only useful if you need to communicate directly with `hmBle.mst` methods.
     * @example
     * // example: get the connection ID of a device
     * const connection_id = .get.connectionID();
     * console.log('Connection ID:', connection_id);
     * @returns {number|null} The connection ID of the device if available, null otherwise.
     */
    connectionID(): number | null;
    #private;
}
export {};
