import { setPageBrightTime } from '@zos/display'

import VisLog from '../libs/vis-log';
const vis = new VisLog("main.js");

import BLEMaster from '../libs/ble-master'
const ble = new BLEMaster();

// insert your MACs here
const LAMP_MAC = "a1:a2:a3:a4:a5:a6";
const SCALE_MAC = "b1:b2:b3:b4:b5:b6"; // "B1:B2:B3:B4:B5:B6" also applicable

const MAC = SCALE_MAC;

// characteristics
// variant A
const light_on_char_val     = "55AA01080501F1";
const light_off_char_val    = "55AA01080500F2";
// variant B
const light_on_ab = new Uint8Array([0x55, 0xAA, 0x01, 0x08, 0x05, 0x01, 0xF1]).buffer;
const light_off_ab = new Uint8Array([0x55, 0xAA, 0x01, 0x08, 0x05, 0x00, 0xF2]).buffer;
// variant C
const light_on_str = "\u0055\u00AA\u0001\u0008\u0005\u0001\u00F1";
const light_off_str = "\u0055\u00AA\u0001\u0008\u0005\u0000\u00F2";

const serv_uuid = "A032"; // 0x
const char_uuid = "A040"; // 0x

class MainPage {
    init(){
        // start scanning for nearby devices
        vis.log("Initializing scan");
        const scan_success = ble.startScan((scan_result) => {
            vis.log("Searching for device:", MAC);
            // if the device that we search for is found
            if (ble.get.hasDevice(MAC)){
                vis.log("Device found, stopping the scan");
                // stop the scan
                ble.stopScan();
                
                // start connecting
                vis.log("Connecting to device:", MAC);
                ble.connect(MAC, (connect_result) => {
                    vis.log("Connect result:", JSON.stringify(connect_result));
                    if (ble.get.isConnected(MAC)){

                        // generate a profile (not yet implemented)
                        //vis.log("Generating a profile");
                        //const profile_object = ble.generateProfileObject(MAC);

                        // init (modify) profile
                        const profile_object = ble.modifyProfileObject(MAC, original_profile_object);

                        // start listener
                        vis.log("Profile ready. Starting the listener");
                        ble.startListener(profile_object, (status)=> { // backend_response // profile, status
                            vis.log("Got a response from the backend!");
                            vis.log(JSON.stringify(status)); 

                            // if status = OK (0), write your attributes
                            if (status === 0){ 
                                // Write the light_off data to the characteristic
                                vis.log("Writing char");
                                const result = ble.write.characteristic(LAMP_MAC, 'A040', light_off_ab);
                                vis.log("Char written");

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
        vis.log("BLE: Stop & Destroy");
        ble.stop(MAC);
    }
}


Page({
    build() {
        setPageBrightTime({ brightTime: 60000 }) // don't turn off the screen for a minute

        this.mainPage = new MainPage();
        this.mainPage.init();
    },
    onDestroy() {
        this.mainPage.stop();
    }
})


// use "nRF Connect" to find all the Services, Characteristics and Descriptors of the device
const original_profile_object = {
    pair: true,
    id: -1,
    profile: "none",
    dev: null,
    len: 1,
    list: [
        {
            uuid: true,
            size: 1,
            len: 1,
            list: [
                {
                    uuid: "00001530-0000-3512-2118-0009af100700",
                    permission: 0,
                    serv: 0,
                    len1: 5, // match the number of chars
                    len2: 5, 
                    list: [
                        {
                            uuid: "00001531-0000-3512-2118-0009af100700",
                            permission: 32, // NOTIFY, WRITE
                            desc: 1,
                            len: 1,
                            list: [
                                {
                                    uuid: "2902", // Client Characteristic Configuration
                                    permission: 0,
                                },
                            ],
                        },
                        {
                            uuid: "00001532-0000-3512-2118-0009af100700",
                            permission: 32, // NOTIFY, READ, WRITE
                            desc: 1,
                            len: 1,
                            list: [
                                {
                                    uuid: "2A04", // Peripheral Preferred Connection Parameters
                                    permission: 0,
                                },
                            ],
                        },
                        {
                            uuid: "00001542-0000-3512-2118-0009af100700",
                            permission: 32, // NOTIFY, READ, WRITE
                            desc: 1,
                            len: 1,
                            list: [
                                {
                                    uuid: "2902", // Client Characteristic Configuration
                                    permission: 0,
                                },
                            ],
                        },
                        {
                            uuid: "00001532-0000-3512-2118-0009af100700",
                            permission: 16, // WRITE NO RESPONSE
                        },
                        {
                            uuid: "00001543-0000-3512-2118-0009af100700",
                            permission: 32, // NOTIFY, READ, WRITE
                            desc: 1,
                            len: 1,
                            list: [
                                {
                                    uuid: "2902", // Client Characteristic Configuration
                                    permission: 0,
                                },
                            ],
                        },
                        // TODO: Add other characteristics...
                    ],
                },
                // TODO: Add other services...
            ],
        },
    ],
};