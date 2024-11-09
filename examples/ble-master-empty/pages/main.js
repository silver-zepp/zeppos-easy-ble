import VisLog from '@silver-zepp/vis-log';
const vis = new VisLog("main.js");

import { BLEMaster, ab2hex, ab2num, ab2str } from "@silver-zepp/easy-ble"
const ble = new BLEMaster();

// replace with your device's MAC (if you know it; otherwise use ble.scan)
const MAC = "xx:xx:xx:xx:xx:xx";

// data for a Write (array buffer form - 0x5A, 0xFA, ... )
const data_ab = new Uint8Array([ /** */]).buffer;

const SERVICES = {
  "180F" : { // battery service
		"2A19" : ["2902"] // battery level
	}
	// ... add other services here
};

// selection
const TARGET_MAC = MAC;
const TARGET_SERVICES = SERVICES;

class MainPage {
	// initial setup
	init() {
		vis.log("=========================================");
		vis.log("Initializing BLE operations", Date.now());

		this.scan(); 									// option #1 (scan before connect)
		//this.connect(TARGET_MAC);   // option #2 (direct connection)
	}

	// 1. start the scan
	scan(){
		// scan for all the devices (this step is optional)
		const scan_success = ble.startScan((scan_result) => {
				// did we find the device we were looking for?
				if (ble.get.hasMAC(TARGET_MAC)){ 

						// if so - stop the scan
						vis.log("Device found, stopping the scan");
						ble.stopScan();

						// try connect to the device
						this.connect(TARGET_MAC);
				}
		}); // }, { allow_duplicates: true });
  }

	// 2. connect (with additional reconnect logic)
	connect(mac, attempt = 1, max_attempts = 3, delay = 1000) {
		ble.connect(mac, (connect_result) => {
			vis.log("Connect result:", JSON.stringify(connect_result));

			// try to reconnect until we get a successful connection
			if (!connect_result.connected) {
				if (attempt < max_attempts) {
					// first kill the connection
					ble.quit();
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
	listen() {
		// generate a profile
		vis.log("Generating a profile");
		const profile_object = ble.generateProfileObject(TARGET_SERVICES);

		// start the listener and use full profile
		vis.log("Starting the listener");
		ble.startListener(profile_object, (response) => {
			// check if the profile was built OK and the device is ready for comms
			vis.log("Backend response:", response.message);
			if (response.success) {
				// finally manipulate - read, write, subscribe to notifications
				this.communicate();
			} else {
				vis.log(`Error starting listener: ${response.message} (Code: ${response.code})`);
			}
		});
	}

	// 4. communicate with the BLE peripheral
	communicate() {
		// =========================================================================================
		// The connection and all the preparations are successful you now can subscribe, write and read
		// =========================================================================================
		vis.log("Communicate -> Executing commands");

		// =========================================================================================
		// CALLBACKS    |   type ble.on... to see all the callbacks you can subscribe to
		// =========================================================================================
		// ...

		// =========================================================================================
		// WRITE    |   (type ble.write... to see all the write methods)
		// =========================================================================================
		// ...
		

		// =========================================================================================
		// READ     |   type ble.read... to see all the read methods
		// =========================================================================================

		// ====================
		// read characteristics
		// ====================
		// ...

		// ====================
		// read descriptors
		// ====================
		// ...

		// =========================================================================================
		// Indicate that all communication commands were executed
		// =========================================================================================
		vis.log("Communicate -> All commands executed");
	}

	quit() {
		vis.log("BLE: Stop & Destroy");
		ble.quit();
	}
}


Page({
	onInit() {
		this.mainPage = new MainPage();
		this.mainPage.init();
		//BLEMaster.SetDebugLevel(3); // uncomment to show all logs
	},
	build() {

	},
	onDestroy() {
		this.mainPage.quit();
	}
})


/** HELPERS */

// don't turn off the screen for 10 min
import { setPageBrightTime } from '@zos/display'
const result = setPageBrightTime({ brightTime: 6E6, })

// don't turn off the screen on wrist down for 10 min
import { pauseDropWristScreenOff } from '@zos/display'
pauseDropWristScreenOff({ duration: 6E6, })