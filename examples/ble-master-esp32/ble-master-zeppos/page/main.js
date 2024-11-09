import AutoGUI, { multiplyHexColor } from '@silver-zepp/autogui';
const gui = new AutoGUI;

import VisLog from '@silver-zepp/vis-log';
const vis = new VisLog("main.js");
// "../../easy-ble/dist/ble-master"
import { BLEMaster, ab2hex, ab2num, ab2str } from '@silver-zepp/easy-ble';
import { PERMISSIONS } from '@silver-zepp/easy-ble/extra';

const ble = new BLEMaster();

// constants.js
import {  ESP32_MAC, COLOR_BLACK, COLOR_BLUE, COLOR_GREEN, COLOR_INDIGO, COLOR_ORANGE, COLOR_RED, COLOR_VIOLET, COLOR_YELLOW } from '../include/constants';

// optional import to support direct hmBle.mst writes
import * as hmBle from '@zos/ble' 

// gui
const btn_fill_arr = [];
const btn_stroke_arr = [];
const cur_btn_colors_arr = [];
let is_ble_ready = false;

const MAC_ESP32 = ESP32_MAC;
const ESP32_SERVICE_UUID                = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const ESP32_UUID_WRITE_CHAR             = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const ESP32_UUID_NOTIFY_CHAR            = "5a87b4ef-3bfa-76a8-e642-92933c31434f";
const ESP32_UUID_READ_CHAR_BATT_LEVEL   = "c656ffc8-67ed-4045-89df-998cb1624adc";
const ESP32_UUID_READ_CHAR_VOLT_LEVEL   = "88115848-e3c9-4645-bd2f-7388cf5956fd";
const ESP32_UUID_READ_CHAR_TEMP_LEVEL   = "caa7135b-44aa-42a8-9f86-24f7bab5e43e";

// data for a write - "ZeppOS 3.0!";
const zeppos_ab = new Uint8Array([ 0x5A, 0x65, 0x70, 0x70, 0x4F, 0x53, 0x20, 0x33, 0x2E, 0x30, 0x21 ]).buffer;

const esp32_services = {
    // #1 service UUID
    [ ESP32_SERVICE_UUID ]: {
        // write characteristic and its descriptors
        [ ESP32_UUID_WRITE_CHAR ]: [], // no descriptors for write characteristic
        // notify characteristic and its descriptors
        [ ESP32_UUID_NOTIFY_CHAR ]: ["2902"], // descriptor for enabling notifications
        // battery level characteristic (READ type)
        [ ESP32_UUID_READ_CHAR_BATT_LEVEL ]: ["2901"], // now READ type, includes a descriptor
        // voltage characteristic (READ type)
        [ ESP32_UUID_READ_CHAR_VOLT_LEVEL ]: [], // now READ type, no descriptors needed
        // temperature characteristic (READ type)
        [ ESP32_UUID_READ_CHAR_TEMP_LEVEL ]: [] // now READ type, no descriptors needed
    } // ... add other services if needed
};

// optional - specify permissions per chara/desc
const esp32_custom_permissions = {
    [ ESP32_UUID_READ_CHAR_BATT_LEVEL ]: PERMISSIONS.READ,
    [ ESP32_UUID_READ_CHAR_VOLT_LEVEL ]: PERMISSIONS.READ,
    [ ESP32_UUID_READ_CHAR_TEMP_LEVEL ]: PERMISSIONS.READ,
    [ ESP32_UUID_WRITE_CHAR ]: PERMISSIONS.WRITE
}

// selection
const TARGET_MAC = MAC_ESP32; // MAC_ESP32 MAC_LAMP MAC_EB3A MAC_X3
const TARGET_SERVICES = esp32_services; // esp32_services bluetti_eb3a_services x3_services

class MainPage {
    // initial setup
    init(){
        vis.log("=========================================");
        vis.log("Initializing BLE operations", Date.now());

        this.drawGUI();

        this.scan();               // option #1 (scan before the connect)
        //this.connect(TARGET_MAC);   // option #2 (direct connection)
    }

    // 1. start the scan (optional)
    scan(){
        // scan for all the devices (this step is optional)
        const scan_success = ble.startScan((scan_result) => {
            // print object with all found devices (note the return)
            //vis.log(JSON.stringify(ble.get.devices())); return;
            
            // did we find the device we were looking for?
            if (ble.get.hasMAC(TARGET_MAC)){ // ble.get.hasDeviceName("ESP32_BLE_PERIPHERAL")

                // if so - stop the scan
                vis.log("Device found, stopping the scan");
                ble.stopScan();
    
                // try connect to the device
                this.connect(TARGET_MAC);
            }
        }); // }, { allow_duplicates: true });
    }

    // 2. connect (with additional reconnect logic)
    connect(mac, attempt = 1, max_attempts = 3, delay = 1000){
        ble.connect(mac, (connect_result) => {
            vis.log("Connect result:", JSON.stringify(connect_result));

            // try to reconnect until we get a successful connection
            if (!connect_result.connected) {
                if (attempt < max_attempts) {
                    // first kill the connection
                    ble.quit(); // ble.disconnect(ble.get.connectionID());
                    // retry
                    vis.log(`Attempt ${attempt} failed. Retrying in ${delay / 1000} seconds...`);
                    setTimeout(() => this.connect(mac, attempt + 1, max_attempts, delay), delay);
                } else {
                    vis.log("Connection failed. Max attempts reached.");
                    // handle max retry attempts reached
                }
            } else { // successful connection - build profile and start listener
                this.listen();
            }
        });
    }

    // 3. build profile and start the listener
    listen(){
        // generate a profile
        vis.log("Generating a profile");
        const profile_object = ble.generateProfileObject(TARGET_SERVICES);
        
        // start the listener and use full profile
        vis.log("Starting the listener");
        ble.startListener(profile_object, (response) => {

            // check if the profile was built OK and the device is ready for comms
            vis.log("Backend response:", response.message);
            if (response.success) {
                is_ble_ready = true; // gui buttons flag - allow clicking on them
                
                // finally manipulate - read, write, subscribe to notifications
                this.communicate();
            } else {
                vis.log(`Error starting listener: ${response.message} (Code: ${response.code})`);
            }
        });
    }

    // 4. communicate with the BLE peripheral
    communicate(){
        // =========================================================================================
        // The connection and all the preparations are successful you now can subscribe, write and read
        // =========================================================================================
        vis.log("Communicate -> Executing commands");

        const profile_pid = ble.get.profilePID();
        const connection_id = ble.get.connectionID();
        vis.log("Pointer ID:", profile_pid);
        vis.log("Connection ID:", connection_id);

        // =========================================================================================
        // CALLBACKS    |   type ble.on... to see all the callbacks you can subscribe to
        // =========================================================================================
        ble.on.charaNotification((uuid, data, length) => {
            if (uuid === ESP32_UUID_NOTIFY_CHAR){
                // through this UUID, ESP sends a counter as an array buffer
                // we can use helper methods to decode the message
                // ===============================================
                // ab2hex(data)     = 39 35 32 (0x39 0x35 0x32)
                // ab2str(data)     = 952 <- our counter value
                vis.log("Counter:", ab2str(data));

                const msg = ab2str(data);
                if (msg === "cmd_btn:1") {
                    handleButtonPressNotification();
                }
            } else {
                vis.log("charaNotification:", uuid, length + "b");
                vis.log("   > ab2hex:", ab2hex(data));
                vis.log("   > ab2str:", ab2str(data));
                vis.log("   > ab2num:", ab2num(data));
            }
            
        });

        // deregister a callback (if/when needed)
        //ble.off.charaNotification();

        ble.on.descWriteComplete((chara, desc, status) => {
            vis.log("descWriteComplete:", chara, desc, status)
        });

        ble.on.charaWriteComplete((uuid, status) => {
            vis.log("charaWriteComplete:", uuid, status);
        });

        // simplified approach for charaValueArrived looks like this
        // ble.on.charaValueArrived((uuid, data, length) => {
        //     // no uuid validation
        //     vis.log(uuid, data, length);
        // });

        // extended charaValueArrived approach were we can implement additional logic
        // per each READ request using a switch case
        ble.on.charaValueArrived((uuid, data, length) => {
            vis.log("UUID READ:", uuid);
            switch (uuid) {
                case ESP32_UUID_READ_CHAR_BATT_LEVEL:
                    vis.log("Battery:", ab2str(data) + "%");
                    break;
                case ESP32_UUID_READ_CHAR_VOLT_LEVEL:
                    vis.log("Voltage:", ab2str(data) + "V");
                    break;
                case ESP32_UUID_READ_CHAR_TEMP_LEVEL:
                    vis.log("Temperature:", ab2str(data) + "C");
                    break;
                default:
                    vis.log("Unknown: hex", ab2hex(data), 
                            " str:",        ab2str(data), 
                            " num:",        ab2num(data));
                    break;
            }
        });

        // this event will also be triggered, but it doesn't provide the data itself
        // ble.on.charaReadComplete((uuid, status) => {
        //     vis.log("charaReadComplete:", uuid, status);
        // });
        
        // ... subscribe to more callbacks
        ble.on.descReadComplete((chara, desc, status) => {
            vis.log(`Desc READ chara UUID: ${chara}, 
                desc UUID: ${desc}, status: ${status}`);
        });
        ble.on.descValueArrived((chara, desc, data, length) => {
            vis.log("Val arrived");
            vis.log(chara, desc, ab2hex(data), length)
        });
        
        // =========================================================================================
        // WRITE    |   (type ble.write... to see all the write methods)
        // =========================================================================================

        // enable CCCD and start receiving notifications from it
        ble.write.enableCharaNotifications(ESP32_UUID_NOTIFY_CHAR, true);

        // write "ZeppOS 3.0!" on ESP's & watch's screens
        ble.write.characteristic(ESP32_UUID_WRITE_CHAR, zeppos_ab);
        // change display color to red on the esp32
        //ble.write.characteristic(ESP32_UUID_WRITE_CHAR, "cmd_color:FF0000"); // red
        
    
        // =========================================================================================
        // READ     |   type ble.read... to see all the read methods
        // =========================================================================================
        
        // ====================
        // read characteristics
        // ====================
        // ...

        // reading battery level
        vis.log("Reading battery level");
        ble.read.characteristic(ESP32_UUID_READ_CHAR_BATT_LEVEL);
        // reading voltage
        vis.log("Reading voltage");
        ble.read.characteristic(ESP32_UUID_READ_CHAR_VOLT_LEVEL);
        // reading temperature
        vis.log("Reading temperature");
        ble.read.characteristic(ESP32_UUID_READ_CHAR_TEMP_LEVEL);
        // read the message
        vis.log("Reading message");
        ble.read.characteristic(ESP32_UUID_WRITE_CHAR);

        // ====================
        // read descriptors
        // ====================
        // ...
        
        // =========================================================================================
        // Indicate that all communication commands were executed
        // =========================================================================================
        vis.log("Communicate -> All commands executed");
    }

    drawGUI(){ // esp32 example
        if (!is_ble_ready){
            vis.log("The BLE isn't ready!");
            return;
        }

        // function to handle button presses and send them to ESP32 with an updated color
        function onButtonPress(bnt_index) {
            const color = cur_btn_colors_arr[bnt_index];
            const color_hex = color.toString(16).padStart(6, '0');
            // send the color to the ESP32 using BLE
            ble.write.characteristic(ESP32_UUID_WRITE_CHAR, "cmd_color:" + color_hex);
        }

        // define button colors
        const btn_color_arr = [
            { color: COLOR_RED, dim_color: multiplyHexColor(COLOR_RED, 0.7) },
            { color: COLOR_GREEN, dim_color: multiplyHexColor(COLOR_GREEN, 0.7) },
            { color: COLOR_BLUE, dim_color: multiplyHexColor(COLOR_BLUE, 0.7) },
            { color: COLOR_YELLOW, dim_color: multiplyHexColor(COLOR_YELLOW, 0.7) }
        ];

        // create GUI with 4 buttons
        for (let i = 0; i < btn_color_arr.length; i++) {
            const { color, dim_color } = btn_color_arr[i];
            
            // store the initial color
            cur_btn_colors_arr[i] = color; 

            gui.startGroup();
                const fill = gui.fillRect(color, { radius: 8 });
                const stroke = gui.strokeRect(dim_color, { line_width: 8, radius: 8 });
                stroke.onPress(() => { onButtonPress(i); });
                // store fill & stroke
                btn_fill_arr.push(fill);        
                btn_stroke_arr.push(stroke); 
            gui.endGroup();
            
            // add a new row after every two buttons
            if (i % 2 === 1) {
                gui.newRow();
            }
        }

        // render the GUI
        gui.render();
    }

    quit(){
        vis.log("BLE: Stop & Destroy");
        ble.quit();
    }
}


Page({
    onInit(){
        this.mainPage = new MainPage();
        this.mainPage.init();
        //BLEMaster.SetDebugLevel(3); // uncomment to show all logs
    },
    build() {
        vis.updateSettings({ line_count: 3 });
        vis.refresh();
    },
    onDestroy() {
        this.mainPage.quit();
    }
})


/** HELPERS */

// don't turn off the screen for 10 min
import { setPageBrightTime } from '@zos/display'
const result = setPageBrightTime({
  brightTime: 6E6,
})

// don't turn off the screen on wrist down for 10 min
import { pauseDropWristScreenOff } from '@zos/display'
pauseDropWristScreenOff({
  duration: 6E6,
})

// ===========
// GUI helpers
// ===========
// function to shuffle colors
function shuffleColors() {
    const colors = [COLOR_BLACK, COLOR_ORANGE, COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_INDIGO, COLOR_VIOLET];
    // simple  shuffle logic
    for (let i = colors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [colors[i], colors[j]] = [colors[j], colors[i]]; // swap
    }
    return colors.slice(0, 4); // return first 4 colors
}

// function to handle ESP32 button press gui interacttions on received notification
function handleButtonPressNotification() {
    // scramble colors of all buttons
    const new_colors = shuffleColors();
    for (let i = 0; i < btn_fill_arr.length; i++) {
        const new_color = new_colors[i];
        const dim_color = multiplyHexColor(new_color, 0.7);
        btn_fill_arr[i].update({ color: new_color });
        btn_stroke_arr[i].update({ color: dim_color });
        cur_btn_colors_arr[i] = new_color;
    }
}

// ======================
// Data Structure Samples
// ======================

const temp_devices = {
    "24:6f:28:xx:xx:xx": {
      "dev_name": "ESP32_BLE_PERIPHERAL",
      "rssi": -61,
      "service_data_array": [],
      "vendor_data": ""
    },
    "24:94:94:xx:xx:xx": {
      "dev_name": "LEDnetWF",
      "rssi": -60,
      "service_data_array": [],
      "vendor_id": 23042,
      "vendor_data": "5203249494120b8100a33403010203040506070809a1a2a3a4a5a6"
    },
    "db:39:c3:xx:xx:xx": {
      "dev_name": "SMI-X3",
      "rssi": -92,
      "service_uuid_array": [
        "180A", // device info
        "0001", // ?? not in nrf (nordic uart service?)
        "1530"  // device firmware update service
      ],
      "service_data_array": [
        {
          "uuid": "FE95",
          "service_data": "3120ce0000a44581c339db0d"
        }
      ],
      "vendor_id": 21845,
      "vendor_data": "736f6f636172657833db39c38145a4" // decoded hex: "soocarex39E"
    }
}

const full_esp32_profile_example = {
    "pair": true,
    "id": 0,
    "profile": "ESP32_BLE_PERIPHERAL",
    "dev": {}, // mac, array buffer
    "len": 1,
    "list": [
      {
        "uuid": true,
        "size": 1,
        "len": 1,
        "list": [
          {
            "uuid": "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
            "permission": 0,
            "len1": 5,
            "len2": 5,
            "list": [
              {
                "uuid": "beb5483e-36e1-4688-b7f5-ea07361b26a8",
                "permission": 32,
                "desc": 0,
                "len": 0
              },
              {
                "uuid": "5a87b4ef-3bfa-76a8-e642-92933c31434f",
                "permission": 32,
                "desc": 1,
                "len": 1,
                "list": [
                  {
                    "uuid": "2902",
                    "permission": 32
                  }
                ]
              },
              {
                "uuid": "c656ffc8-67ed-4045-89df-998cb1624adc",
                "permission": 32,
                "desc": 1,
                "len": 1,
                "list": [
                  {
                    "uuid": "2901",
                    "permission": 32
                  }
                ]
              },
              {
                "uuid": "88115848-e3c9-4645-bd2f-7388cf5956fd",
                "permission": 32,
                "desc": 0,
                "len": 0
              },
              {
                "uuid": "caa7135b-44aa-42a8-9f86-24f7bab5e43e",
                "permission": 32,
                "desc": 0,
                "len": 0
              }
            ]
          }
        ]
      }
    ]
}

// ESP32 Communication log (execution of this example program) [ log level 1]
// --------------------
// [LOG] ========================================= 
// [LOG] Initializing BLE operations 1706639604323 
// [LOG] The BLE isn't ready! 
// [LOG] Device found, stopping the scan
// [LOG] Connect result: {"connected":true,"status":"connected"}
// [LOG] Generating a profile
// [LOG] Starting the listener 
// [LOG] Backend response: Success 
// [LOG] Pointer ID: 687045108
// [LOG] Communicate -> Executing commands
// [LOG] Reading message
// [LOG] Reading battery level
// [LOG] Reading voltage
// [LOG] Reading temperature
// [LOG] Connection ID: 1
// [LOG] Communicate -> All commands executed
// [LOG] descWriteComplete: 5a87b4ef-3bfa-76a8-e642-92933c31434f 2902 0 
// [LOG] UUID READ: c656ffc8-67ed-4045-89df-998cb1624adc 
// [LOG] Battery: 77%
// [LOG] Counter: 3 
// [LOG] UUID READ: 88115848-e3c9-4645-bd2f-7388cf5956fd
// [LOG] Voltage: 4.970000V
// [LOG] UUID READ: caa7135b-44aa-42a8-9f86-24f7bab5e43e 
// [LOG] Temperature: 36.599998C
// [LOG] UUID READ: beb5483e-36e1-4688-b7f5-ea07361b26a8 
// [LOG] Unknown: hex 5A 65 70 70 4F 53  str: ZeppOS  num: 90
// [LOG] Counter: 4 
// [LOG] Counter: 5 
// [LOG] Counter: 6 
// [LOG] Counter: 7 
// [LOG] Counter: 8 
// [LOG] charaWriteComplete: beb5483e-36e1-4688-b7f5-ea07361b26a8 0 
// [LOG] Counter: 9 
// [LOG] Counter: 10


// ESP32 Communication log (execution of this example program) [ log level 3]
// --------------------
// [LOG] ========================================= 
// [LOG] Initializing BLE operations 1706640819299 
// [easy-ble] Adding new device d9:52:71:xx:xx:xx 
// [LOG] The BLE isn't ready!
// [easy-ble] Adding new device b4:67:41:xx:xx:xx
// [LOG] Device found, stopping the scan
// [easy-ble] Adding new device 24:6f:28:xx:xx:xx
// [easy-ble] Attempting to connect to device: 24:6f:28:xx:xx:xx
// [LOG] Connect result: {"connected":true,"status":"connected"} 
// [easy-ble] Successful connection to device: 24:6f:28:xx:xx:xx
// [LOG] Generating a profile 
// [easy-ble] Generating full profile object
// [LOG] Starting the listener
// [easy-ble] Starting listener with profile object {"pair":true,"id":0,"profile":"ESP32_BLE_PERIPHERAL","dev":{},"len":1,"list":[{"uuid":true,"size":1,"len":1,"list":[{"uuid":"4fafc201-1fb5-459e-8fcc-c5c9c331914b","permission":0,"len1":5,"len2":5,"list":[{"uuid":"beb5483e-36e1-4688-b7f5-ea07361b26a8","permission":32,"desc":0,"len":0},{"uuid":"5a87b4ef-3bfa-76a8-e642-92933c31434f","permission":32,"desc":1,"len":1,"list":[{"uuid":"2902","permission":32}]},{"uuid":"c656ffc8-67ed-4045-89df-998cb1624adc","permission":32,"desc":1,"len":1,"list":[{"uuid":"2901","permission":32}]},{"uuid":"88115848-e3c9-4645-bd2f-7388cf5956fd","permission":32,"desc":0,"len":0},{"uuid":"caa7135b-44aa-42a8-9f86-24f7bab5e43e","permission":32,"desc":0,"len":0}]}]}]}
// [LOG] Connect result: {"connected":false,"status":"disconnected"}      
// [easy-ble] Setting a timeout before calling mstBuildProfile
// [easy-ble] Stopping the BLE Master comms.
// [easy-ble] mstBuildProfile called with success: true
// [easy-ble] Disconnecting device: ESP32_BLE_PERIPHERAL
// [LOG] Attempt 1 failed. Retrying in 1 seconds...
// [easy-ble] Attempting to connect to device: 24:6f:28:xx:xx:xx 
// [easy-ble] Successful connection to device: 24:6f:28:xx:xx:xx 
// [LOG] Connect result: {"connected":true,"status":"connected"} 
// [LOG] Generating a profile
// [LOG] Starting the listener 
// [easy-ble] Generating full profile object
// [easy-ble] Starting listener with profile object {"pair":true,"id":1,"profile":"ESP32_BLE_PERIPHERAL","dev":{},"len":1,"list":[{"uuid":true,"size":1,"len":1,"list":[{"uuid":"4fafc201-1fb5-459e-8fcc-c5c9c331914b","permission":0,"len1":5,"len2":5,"list":[{"uuid":"beb5483e-36e1-4688-b7f5-ea07361b26a8","permission":32,"desc":0,"len":0},{"uuid":"5a87b4ef-3bfa-76a8-e642-92933c31434f","permission":32,"desc":1,"len":1,"list":[{"uuid":"2902","permission":32}]},{"uuid":"c656ffc8-67ed-4045-89df-998cb1624adc","permission":32,"desc":1,"len":1,"list":[{"uuid":"2901","permission":32}]},{"uuid":"88115848-e3c9-4645-bd2f-7388cf5956fd","permission":32,"desc":0,"len":0},{"uuid":"caa7135b-44aa-42a8-9f86-24f7bab5e43e","permission":32,"desc":0,"len":0}]}]}]}
// [easy-ble] mstBuildProfile called with success: true 
// [easy-ble] Setting a timeout before calling mstBuildProfile
// [easy-ble] mstOnPrepare succeed, proceeding with profile pointer saving. Pointer ID: 685542196
// [LOG] Pointer ID: 685542196
// [LOG] Backend response: Success
// [LOG] Communicate -> Executing commands
// [easy-ble] mstOnPrepare callback triggered {"profile":685542196,"status":0}
// [LOG] Connection ID: 1
// [LOG] Reading voltage
// [easy-ble] EXEC: hmBle.mstWriteDescriptor(685542196, 5a87b4ef-3bfa-76a8-e642-92933c31434f, 2902, 01 00, 2)
// [LOG] Reading battery level
// [LOG] Reading temperature 
// [LOG] descWriteComplete: 5a87b4ef-3bfa-76a8-e642-92933c31434f 2902 0   
// [LOG] Reading message
// [LOG] Communicate -> All commands executed
// [LOG] Counter: 3 
// [easy-ble] EXEC: hmBle.mstReadCharacteristic(685542196, c656ffc8-67ed-4045-89df-998cb1624adc)
// [LOG] UUID READ: c656ffc8-67ed-4045-89df-998cb1624adc 
// [easy-ble] EXEC: hmBle.mstReadCharacteristic(685542196, 88115848-e3c9-4645-bd2f-7388cf5956fd)
// [LOG] Battery: 77%
// [LOG] UUID READ: 88115848-e3c9-4645-bd2f-7388cf5956fd 
// [easy-ble] EXEC: hmBle.mstReadCharacteristic(685542196, caa7135b-44aa-42a8-9f86-24f7bab5e43e)
// [LOG] Voltage: 4.970000V
// [LOG] UUID READ: caa7135b-44aa-42a8-9f86-24f7bab5e43e 
// [easy-ble] EXEC: hmBle.mstReadCharacteristic(685542196, beb5483e-36e1-4688-b7f5-ea07361b26a8)
// [LOG] Temperature: 36.599998C
// [LOG] Unknown: hex 5A 65 70 70 4F 53  str: ZeppOS  num: 90 
// [LOG] UUID READ: beb5483e-36e1-4688-b7f5-ea07361b26a8
// [LOG] Counter: 4 
// [LOG] Counter: 5 
// [LOG] Counter: 6 
// [LOG] Counter: 7 
// [LOG] Counter: 8 