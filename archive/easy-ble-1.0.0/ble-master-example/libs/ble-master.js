/** @about BLE Master 1.0.0 @min_zeppos 3.0 @author: Silver, Zepp Health. @license: MIT */
import * as hmBle from '@zos/ble'

const ENABLE_DEBUG_LOG = true;

const ERR_IDP_NOT_FOUND             = "eBLE: The ID pointer is not found for this MAC address. Please use startListener before trying to write char/desc!";
const ERR_IDP_NOT_FOUND_SHORT       = "eBLE: Profile ID pointer not found";
const ERR_NOT_IMPLEMENTED           = "eBLE: This feature is currently not implemented";
const ERR_PROFILE_CREATION_FAILED   = "eBLE: Profile creation failed";
const ERR_CHAR_READ_FAIL            = "eBLE: Failed to read characteristic";
const ERR_DESC_READ_FAIL            = "eBLE: Failed to read descriptor";
const ERR_CHAR_WRITE_FAIL           = "eBLE: Failed to write characteristic";
const ERR_DESC_WRITE_FAIL           = "eBLE: Failed to write descriptor";

const SHORT_DELAY = 50; // millis

class BLEMaster {
    #devices = {};
    #last_connected_mac = null;
    #getDevices = () => this.#devices;
    
    /**
     * @type {Write} A device writer.
     */
    write;

    /**
     * @type {Read} A device reader.
     */
    read;

    constructor(){
        this.write = new Write(this.#getDevices);
        this.read = new Read(this.#getDevices);
    }
    /**
     * @type {Get} A device information getter.
     */
    get get() {
        return new Get(this.#getDevices);
    }
    /**
     * Starts scanning for devices.
     * @param {Function} response_callback - The callback function that will be called with the scan result for each device.
     * @param {Object} [options={}] - Optional parameters for the scan.
     * @param {number} [options.duration] - The duration of the scan in milliseconds. If specified, the scan will automatically stop after this duration.
     * @param {Function} [options.on_duration] - A callback function that will be called when the scan stops due to reaching the specified duration.
     * @returns {boolean} Returns true if the call to start the scan succeeded, false if it failed.
     */
    startScan(response_callback, options = {}) {
        const modified_callback = (scan_result) => {
            const scan_result_str = {
                ...scan_result,
                dev_addr: ab2mac(scan_result.dev_addr),
                vendor_data: ab2str_stripped(scan_result.vendor_data), // decode
                service_data_array: scan_result.service_data_array ? scan_result.service_data_array.map(service => ({ // map (!) empty
                    ...service,
                    service_data: ab2str_stripped(service.service_data)
                })) : []
            };
            this.#devices[scan_result_str.dev_addr] = {
                dev_name: scan_result_str.dev_name,
                rssi: scan_result_str.rssi,
                service_uuid_array: scan_result_str.service_uuid_array,
                service_data_array: scan_result_str.service_data_array,
                vendor_id: scan_result_str.vendor_id,
                vendor_data: scan_result_str.vendor_data
            };
            
            response_callback(scan_result_str);
        }
        
        const success = hmBle.mstStartScan(modified_callback);
        if (options.duration !== undefined) {
            setTimeout(() => {
                this.stopScan();
                if (options.on_duration) {
                    options.on_duration();
                }
            }, options.duration);
        }
        return success;
    }
    /**
     * Stops scanning for devices.
     * @returns {boolean} Returns true if the call to stop the scan succeeded, false if it failed.
     */
    stopScan() {
        return hmBle.mstStopScan();
    }
    /**
     * Connects to a device.
     * @param {string} dev_addr - The MAC address of the device to connect to.
     * @param {Function} response_callback - The callback function that will be called with the result of the connection attempt.
     * @returns {boolean} Returns true if the call to connect to the device succeeded, false if it failed.
     */
    connect(dev_addr, response_callback) {
        dev_addr = dev_addr.toLowerCase(); // failsafe
        const dev_addr_ab = mac2ab(dev_addr);
        const modified_callback = (result) => {
            const result_str = {
                ...result,
                dev_addr: ab2mac(result.dev_addr) // dev_addr
            };
            if (result_str.connected === 0) {
                this.#devices[result_str.dev_addr] = { 
                    ...this.#devices[result_str.dev_addr], // spread the existing device object
                    connect_id: result_str.connect_id,
                    is_connected: true
                };
                this.#last_connected_mac = result_str.dev_addr;
            }
            response_callback(result_str);
        }
        
        return hmBle.mstConnect(dev_addr_ab, modified_callback);
    }
    /**
     * Disconnects from a device.
     * @param {string} dev_addr - The MAC address of the device to disconnect from.
     * @returns {boolean} Returns true if the call to disconnect from the device succeeded, false if it failed or if the device was not connected.
     */
    disconnect(dev_addr) {
        dev_addr = dev_addr.toLowerCase();
        const device = this.#devices[dev_addr];
        if (device && device.is_connected) {
            return hmBle.mstDisconnect(device.connect_id);
        }
    }
    /**
     * Pairs with a device.
     * @param {string} dev_addr - The MAC address of the device to pair with.
     * @returns {boolean} Returns true if the call to pair with the device succeeded, false if it failed or if the device was not connected.
     */
    pair(dev_addr) {
        dev_addr = dev_addr.toLowerCase();
        const device = this.#devices[dev_addr];
        if (device && device.is_connected) {
            return hmBle.mstPair(device.connect_id);
        }
    }
    /**
     * Starts listening for profile preparation events and builds a profile for interaction with a device.
     * @param {Object} profile_object - The profile object that describes how to interact with the device.
     * @param {Function} response_callback - The callback function that will be called when a profile preparation event occurs.
     * @returns {Object} Returns an object with a 'success' property indicating whether the call succeeded and an 'error' property containing an error message if the call failed.
     */
    startListener(profile_object, response_callback) {
        debugLog("startListener called with profile_object:", JSON.stringify(profile_object));
        // 1. register the mstOnPrepare callback to handle profile preparation
        hmBle.mstOnPrepare((backend_response) => {
            debugLog("mstOnPrepare called with backend_response:", JSON.stringify(backend_response));
            if (backend_response.status === 0) {
                // save profile pointer (only if we were able to properly connect)
                this.#devices[this.#last_connected_mac].profile_idp = backend_response.profile; // profile, status
            } else {
                debugLog("Error mstOnPrepare. Status:", backend_response.status);
            }

            // 3. [old] execute the response_callback with the profile pointer (profile_idp) as the argument 
            //    [new] returns status to the end user. (profile_idp) is now hidden from the end user interactions
            debugLog("Executing backend_response");
            response_callback(backend_response.status); // backend_response.profile
        });
    
        // add a delay before calling mstBuildProfile
        setTimeout(() => {
            // 2. build the profile
            const success = hmBle.mstBuildProfile(profile_object);
            debugLog("mstBuildProfile called with success:", success);
        }, SHORT_DELAY);  // 100ms
    
        return {
            success,
            error: success ? null : ERR_PROFILE_CREATION_FAILED, // multilayer, proper error handling
        };
    }
    /**
     * Temporary replacement for the generateProfileObject function. 
     * Modifies a profile object with required values for a device.
     * @param {string} dev_addr - The MAC address of the device.
     * @param {Object} profile_object - The profile object to be modified.
     * @returns {Object|null} Returns the modified profile object for the device, or null if the device was not found.
     */
    modifyProfileObject(dev_addr, profile_object) {
        const device = this.#devices[dev_addr];
        if (!device) {
            console.log("eBLE: Device not found:", dev_addr);
            return null;
        }
    
        const modified_profile_object = {
            ...profile_object,
            id: device.connect_id,
            profile: device.dev_name,
            dev: mac2ab(dev_addr),
        };
    
        return modified_profile_object;
    }
    /**
     * @warning [NOT IMPLEMENTED] Generates a generic profile object for a device.
     * @param {string} dev_addr - The MAC address of the device.
     * @returns {Object|null} Returns a generic profile object for the device, or null if the device was not found.
     */
     generateProfileObject(dev_addr) {
        const device = this.#devices[dev_addr];
        if (!device) {
            console.log("eBLE: Device not found:", dev_addr);
            return { success: false, error: "Device not found: " + dev_addr };
        }
    
        console.log(ERR_NOT_IMPLEMENTED);
        return { success: false, error: ERR_NOT_IMPLEMENTED }; // exit point
        // TODO: implementation (most devices don't have enough data to generate a profile from the scan, needs a generalized approach)
        const profile_object = {
            pair: true,
            id: device.connect_id,
            profile: device.dev_name,
            dev: mac2ab(dev_addr),
            len: 1,
            list: []
        };
    
        // add services
        for (const service_uuid of device.service_uuid_array || []) { // empty arr if we have nothing + need to make sure we gen all 5 levels
            const service = {
                uuid: true,
                size: 1,
                len: 1,
                list: []
            };
            profile_object.list.push(service);
    
            // add characteristics
            for (const characteristic of device.characteristics || []) {
                if (characteristic.service_uuid === service_uuid) {
                    const characteristic_obj = {
                        uuid: characteristic.uuid,
                        permission: 0,
                        desc: 1,
                        len: 1,
                        list: []
                    };
                    service.list.push(characteristic_obj);
    
                    // add descriptors
                    for (const descriptor of characteristic.descriptors || []) {
                        const descriptor_obj = {
                            uuid: descriptor.uuid,
                            permission: 0
                        };
                        characteristic_obj.list.push(descriptor_obj);
                    }
                }
            }
        }
    }
    /**
     * Stops all interactions with a device.
     * @param {string} dev_addr - The MAC address of the device.
     */
    stop(dev_addr) {
        dev_addr = dev_addr.toLowerCase();
        const device = this.#devices[dev_addr];
        if (device && device.is_connected) {
            hmBle.mstOffAllCb();
            if (device.profile_idp !== undefined) {
                hmBle.mstDestroyProfileInstance(device.profile_idp);
            }
            hmBle.mstDisconnect(device.connect_id);
            device.is_connected = false;
        }
    }
}

class Write {
    #getDevices;
    
    constructor(getDevices) {
        this.#getDevices = getDevices;
    }
    /**
     * Writes to a characteristic of a device.
     * @param {string} dev_addr - The MAC address of the device.
     * @param {string} uuid - The UUID of the characteristic to write to.
     * @param {string|ArrayBuffer} data - The data to write to the characteristic.
     * @returns {Object} Returns an object with a 'success' property indicating whether the write succeeded and an 'error' property containing an error message if the write failed.
     */
    characteristic(dev_addr, uuid, data) {
        dev_addr = dev_addr.toLowerCase();
        const device = this.#getDevices()[dev_addr];
        if (!device || device.profile_idp === undefined) {
            console.log(ERR_IDP_NOT_FOUND);
            return { success: false, error: ERR_IDP_NOT_FOUND_SHORT }; // handle layering
        }
        const profile_idp = device.profile_idp;
        const data_ab = data2ab(data);
        const data_len = data_ab.byteLength;
        const success = hmBle.mstWriteCharacteristic(profile_idp, uuid, data_ab, data_len);
        return {
            success,
            error: success ? null : ERR_CHAR_WRITE_FAIL,
        };
    }
    /**
     * Writes to a descriptor of a characteristic of a device.
     * @param {string} dev_addr - The MAC address of the device.
     * @param {string} chara - The UUID of the characteristic that the descriptor belongs to.
     * @param {string} desc - The UUID of the descriptor to write to.
     * @param {string|ArrayBuffer} data - The data to write to the descriptor.
     * @returns {Object} Returns an object with a 'success' property indicating whether the write succeeded and an 'error' property containing an error message if the write failed.
     */
    descriptor(dev_addr, chara, desc, data) {
        dev_addr = dev_addr.toLowerCase();
        const device = this.#getDevices()[dev_addr];
        if (!device || device.profile_idp === undefined) {
            console.log(ERR_IDP_NOT_FOUND);
            return { success: false, error: ERR_IDP_NOT_FOUND_SHORT };
        }
        const profile_idp = device.profile_idp;
        const data_ab = data2ab(data);
        const data_len = data_ab.byteLength;
        const success = hmBle.mstWriteDescriptor(profile_idp, chara, desc, data_ab, data_len);
        return {
            success,
            error: success ? null : ERR_DESC_WRITE_FAIL,
        };
    }
}

class Read {
    #getDevices;
    
    constructor(getDevices) {
        this.#getDevices = getDevices;
    }
    /**
     * Reads from a characteristic of a device.
     * @param {string} dev_addr - The MAC address of the device.
     * @param {string} uuid - The UUID of the characteristic to read from.
     * @returns {Object} Returns an object with a 'success' property indicating whether the read succeeded and an 'error' property containing an error message if the read failed.
     */
    characteristic(dev_addr, uuid) {
        dev_addr = dev_addr.toLowerCase();
        const device = this.#getDevices()[dev_addr];
        if (!device || device.profile_idp === undefined) {
            console.log(ERR_IDP_NOT_FOUND);
            return { success: false, error: ERR_IDP_NOT_FOUND_SHORT };
        }
        const profile_idp = device.profile_idp;
        const success = hmBle.mstReadCharacteristic(profile_idp, uuid);
        return {
            success,
            error: success ? null : ERR_CHAR_READ_FAIL,
        };
    }
    /**
     * Reads from a descriptor of a characteristic of a device.
     * @param {string} dev_addr - The MAC address of the device.
     * @param {string} uuid - The UUID of the characteristic that the descriptor belongs to.
     * @param {string} desc - The UUID of the descriptor to read from.
     * @returns {Object} Returns an object with a 'success' property indicating whether the read succeeded and an 'error' property containing an error message if the read failed.
     */
    descriptor(dev_addr, uuid, desc) {
        dev_addr = dev_addr.toLowerCase();
        const device = this.#getDevices()[dev_addr];
        if (!device || device.profile_idp === undefined) {
            console.log(ERR_IDP_NOT_FOUND);
            return { success: false, error: ERR_IDP_NOT_FOUND_SHORT };
        }
        const profile_idp = device.profile_idp;
        const success = hmBle.mstReadDescriptor(profile_idp, uuid, desc);
        return {
            success,
            error: success ? null : ERR_DESC_READ_FAIL,
        };
    }
}

class Get {
    #getDevices;
    constructor(getDevices) {
        this.#getDevices = getDevices;
    }
    /**
     * Returns all devices.
     * @returns {Object} Returns an object containing information about all devices.
     */
    devices() {
        return this.#getDevices();
    }
    /**
     * Checks if a device is connected.
     * @param {string} dev_addr - The MAC address of the device.
     * @returns {boolean} Returns true if the device is connected, false otherwise.
     */
    isConnected(dev_addr){
        dev_addr = dev_addr.toLowerCase();
        const device = this.#getDevices()[dev_addr];
        return device && device.is_connected;
    }
    /**
     * Checks if a device exists.
     * @param {string} dev_addr - The MAC address of the device.
     * @returns {boolean} Returns true if the device exists, false otherwise.
     */
    hasDevice(dev_addr) {
        return this.#getDevices().hasOwnProperty(dev_addr.toLowerCase());
    }
}

/* HELPERS */

function str2ab_with_len(str){
    const data_arr = str.split('').map(char => char.charCodeAt(0));
    return { data_ab: new Uint8Array(data_arr).buffer, data_len: data_arr.length };
}

function ab2mac(ab) {
    const bytes = new Uint8Array(ab);
    const mac = Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join(':');
    return mac;
}

function mac2ab(mac) {
    const bytes = mac.split(':').map(byte => parseInt(byte, 16));
    const ab = new Uint8Array(bytes).buffer;
    return ab;
}

function ab2str_stripped(buffer) { // strip unicode
    return Array.prototype.map.call(new Uint8Array(buffer), u => ('00' + u.toString(16)).slice(-2)).join('');
}

function debugLog(...params) {
    if (ENABLE_DEBUG_LOG) {
        console.log("eBLE:", ...params);
    }
}

function data2ab(data) {
    if (data instanceof ArrayBuffer) {
        return data;
    } else if (typeof data === "string") {
        if (/^[0-9A-Fa-f]+$/.test(data)) { // hex string
            return new Uint8Array(data.match(/.{1,2}/g).map(byte => parseInt(byte, 16))).buffer;
        } else { // normal string
            return str2ab_with_len(data).data_ab;
        }
    }
}

export default BLEMaster;

/**
 * @changelog
 * 1.0.0
 * - initial release
 */
