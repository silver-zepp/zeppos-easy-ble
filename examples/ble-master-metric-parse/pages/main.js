// optional:
import AutoGUI, { multiplyHexColor } from '@silver-zepp/autogui';
const gui = new AutoGUI;

import VisLog from '@silver-zepp/vis-log';
const vis = new VisLog("main.js");

import { BLEMaster, ab2hex, ab2num, ab2str } from "@silver-zepp/easy-ble"
const ble = new BLEMaster();



// replace with your device's MAC (if you know it; otherwise use ble.scan)
const MAC = "xx:xx:xx:xx:xx:xx";

// data for a Write (array buffer form - 0x5A, 0xFA, ... )
const data_ab = new Uint8Array([ /** */]).buffer;

// services and characteristics with human-readable IDs
const UUID = {
	// services
	BATTERY_SERVICE: "180F",
	HR_SERVICE: "180D",

	// characteristics
	BATTERY_LEVEL: "2A19",
  HR_MEASUREMENT: "2A37"
};

const SERVICES = {
	// #1 battery service
	[UUID.BATTERY_SERVICE]: {
		[UUID.BATTERY_LEVEL]: ["2902"],
	},
	// #2 heart rate service
	[UUID.HR_SERVICE]: {
    [UUID.HR_MEASUREMENT]: ["2902"], // (with notification descriptor)
  },
	// ... add other services here
};

// selection
const TARGET_MAC = MAC;
const TARGET_SERVICES = SERVICES;

class MainPage {
	#devices = {};
	#gui_elements = [];

	// initial setup
	init() {
		vis.log("=========================================");
		vis.log("Initializing BLE operations", Date.now());

		this.scan(); 									// option #1 (scan before connect)
		//this.connect(TARGET_MAC);   // option #2 (direct connection)
		this.setupGUI();
	}

	// 1. start the scan
	scan() {
    ble.startScan((scan_result) => {
      const all_devices = ble.get.devices();
      this.#devices = Object.fromEntries(
        Object.entries(all_devices).filter(([mac, device]) => 
					// looking for Amazfit devices to build gui buttons
          device.dev_name && device.dev_name.includes("Amazfit")
        )
      );
      this.updateGUI();
    }); //, { allow_duplicates: true });
  }

	// 2. connect (with additional reconnect logic)
	connect(mac, attempt = 1, max_attempts = 3, delay = 1000) {
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
		ble.on.charaNotification((uuid, data, length) => {
			if (uuid === UUID.HR_MEASUREMENT) {
        this.parseHeartRate(data);
      } else {
				vis.log("charaNotification:", uuid, length + "b");
				vis.log("   > ab2hex:", ab2hex(data));
				vis.log("   > ab2str:", ab2str(data));
				vis.log("   > ab2num:", ab2num(data));
			}
		});

		ble.on.charaValueArrived((uuid, data, length) => {
			switch (uuid) {
				// case UUID.MANUFACTURER_NAME:
				// 	vis.log("Manufacturer Name:", ab2str(data));
				// 	break;
				// case UUID.MODEL_NUMBER:
				// 	vis.log("Model Number:", ab2str(data));
				// 	break;
				case UUID.BATTERY_LEVEL:
					vis.log("Battery Level:", ab2num(data) + "%");
					break;
				case UUID.HR_MEASUREMENT:
					this.parseHeartRate(data);
					break;
				default:
					vis.log("Unknown characteristic:", uuid, ab2str(data));
			}
		});

		ble.on.charaWriteComplete((uuid, status) => {
			vis.log("charaWriteComplete:", uuid, status);
		});

		ble.on.descWriteComplete((chara, desc, status) => {
			vis.log("descWriteComplete:", chara, desc, status)
		});

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
		ble.write.enableCharaNotifications(UUID.HR_MEASUREMENT, true);

		// write to characteristic
		// ble.write.characteristic(CHAR_UUID, data);


		// =========================================================================================
		// READ     |   type ble.read... to see all the read methods
		// =========================================================================================

		// ====================
		// read characteristics
		// ====================
		// ...

		// // read battery level
		ble.read.characteristic(UUID.BATTERY_LEVEL);


		// ====================
		// read descriptors
		// ====================
		// ...

		// =========================================================================================
		// Indicate that all communication commands were executed
		// =========================================================================================
		vis.log("Communicate -> All commands executed");
	}

	// helpers
	setupGUI() {
		this.clearGUI();
		gui.render();
	}

	clearGUI() {
		if (this.#gui_elements && this.#gui_elements.length > 0) {
			this.#gui_elements.forEach(element => {
				if (element && typeof element.remove === 'function') {
					element.remove();
				}
			});
		}
		this.#gui_elements = [];
	}

	updateGUI() {
		this.clearGUI();

		Object.entries(this.#devices).forEach(([mac, device]) => {
			this.createDeviceButton(mac, device);
		});

		gui.render();
	}

	createDeviceButton(mac, device) {
		const btn_text = device.dev_name || "Unknown";
		const btn = gui.button(btn_text, () => this.onDeviceButtonPress(mac));
		gui.newRow();

		this.#gui_elements.push(btn, text);
	}

	onDeviceButtonPress(mac) {
		ble.stopScan();
		this.connect(mac);
	}

	parseHeartRate(data) {
		const view = new Uint8Array(data);
		
		const flags = view[0];
		let hr;
		
		if ((flags & 0x01) === 0) hr = view[1];
		else hr = (view[2] << 8) | view[1];
	
		vis.log("HR:", hr, "bpm");
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