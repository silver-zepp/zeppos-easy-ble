#define HAS_TTGO_TFT  // comment this out if you have ESP32 without a screen (non TTGO)

#ifdef HAS_TTGO_TFT
#include <SPI.h>
#include <TFT_eSPI.h>    	// TTGO specific TFT library
TFT_eSPI tft = TFT_eSPI(); 	// invoke TFT
const int LINE_HEIGHT = 24; // line height for TFT display (font + couple px)
int current_line = 0;       // current line position on TFT display
uint16_t cur_bg_color = TFT_BLACK;
#endif

// ble
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

const char *SERVICE_UUID 		= "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const char *UUID_WRITE_CHARA 	= "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const char *UUID_NOTIFY_CHARA 	= "5a87b4ef-3bfa-76a8-e642-92933c31434f";
// simulated
const char *UUID_CHARA_BATTERY_LEVEL 	= "c656ffc8-67ed-4045-89df-998cb1624adc";
const char *UUID_CHARA_VOLTAGE 			= "88115848-e3c9-4645-bd2f-7388cf5956fd";
const char *UUID_CHARA_TEMPERATURE 		= "caa7135b-44aa-42a8-9f86-24f7bab5e43e";

// buttons
const int BUTTON_1_PIN = 0;
const int BUTTON_2_PIN = 2;

BLECharacteristic *p_battery_level_characteristic;
BLECharacteristic *p_voltage_characteristic;
BLECharacteristic *p_temperature_characteristic;

BLEServer *p_server = nullptr;
BLECharacteristic *p_notify_characteristic;
BLEService *p_service;
int counter = 0;
bool device_connected = false;

const int SERIAL_SPEED = 115200;
const char *DEVICE_NAME = "ESP32_BLE_PERIPHERAL";
const char *DEFAULT_MSG = "ZeppOS";

// proper loop
unsigned long millis_prev = 0;
const long update_interval = 1000;
bool known_device_connected = false;

// prototypes
template <typename T>
void debugLog(T value);
void int_on_button_1();
void int_on_button_2();
void sendButtonNotification(const char* message);

int getBatteryLevel() { return 77; }
float get5VRailVoltage() { return 4.97; }
float getTemperature() { return 36.6; }

class MyServerCallbacks : public BLEServerCallbacks
{
	void onConnect(BLEServer *p_server)
	{
		device_connected = true;
		debugLog("CON: OK");
	};

	void onDisconnect(BLEServer *p_server)
	{
		device_connected = false;
		debugLog("DISCON");
		p_server->startAdvertising(); // restart advertising on disconnect
	}
};

class MyCallbacks : public BLECharacteristicCallbacks
{
    void onWrite(BLECharacteristic *p_characteristic) override
    {
        std::string value = p_characteristic->getValue();
        if (value.length() > 0)
        {
			// check if the value is a color command
            std::string color_prefix = "cmd_color:";
            if (value.rfind(color_prefix, 0) == 0) {
                std::string color_hex = value.substr(color_prefix.length());
                long color_24bit = strtol(color_hex.c_str(), NULL, 16);

                // ttgo supports only RGB565
                uint16_t color_16bit = ((color_24bit >> 8) & 0xF800) | ((color_24bit >> 5) & 0x07E0) | ((color_24bit >> 3) & 0x001F);
				cur_bg_color = color_16bit;

                #ifdef HAS_TTGO_TFT
				// if so - apply it to screen
				tft.setTextColor(TFT_WHITE, cur_bg_color);
                tft.fillScreen(color_16bit);
                debugLog("Color set -> " + color_hex);
                #endif
            }

            Serial.print("VAL: ");
            #ifdef HAS_TTGO_TFT
            tft.print("VAL: ");
            #endif

            for (int i = 0; i < value.length(); i++)
            {
                Serial.print(value[i]);
                #ifdef HAS_TTGO_TFT
                tft.print(value[i]);
                #endif
            }
            debugLog("\n");
        }
    }
};

void setup()
{
#ifdef HAS_TTGO_TFT
	// initialize TFT display
	tft.init();
	tft.fillScreen(cur_bg_color);
	tft.setCursor(0, 0, 4);
	tft.setTextColor(TFT_WHITE, cur_bg_color);
	tft.setTextWrap(false); // disable wrap
#endif
	esp_log_level_set("*", ESP_LOG_VERBOSE);
	// esp_read_mac(&mac[0], ESP_MAC_WIFI_STA);
	Serial.begin(SERIAL_SPEED);

	debugLog("BLE init");
	BLEDevice::init(DEVICE_NAME);
	p_server = BLEDevice::createServer();
	p_server->setCallbacks(new MyServerCallbacks());

	p_service = p_server->createService(SERVICE_UUID);

	// write chara
	BLECharacteristic *p_write_characteristic = p_service->createCharacteristic(
		UUID_WRITE_CHARA,
		BLECharacteristic::PROPERTY_READ | 		// read
		BLECharacteristic::PROPERTY_WRITE | 	// write
		BLECharacteristic::PROPERTY_WRITE_NR); 	// write without response
	p_write_characteristic->setCallbacks(new MyCallbacks());
	p_write_characteristic->setValue(DEFAULT_MSG);

	// notify + indicate chara. Note: INDICATE currently not supported (!)
	p_notify_characteristic = p_service->createCharacteristic(
		UUID_NOTIFY_CHARA,
		BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_INDICATE);

	// add 2902 descriptor to the Notify Characteristic
	BLEDescriptor *p_notify_descriptor = new BLEDescriptor((uint16_t)0x2902);
	p_notify_characteristic->addDescriptor(p_notify_descriptor);

	// get and print the BLE MAC address
	BLEAddress ble_mac = BLEDevice::getAddress();
	std::string ble_mac_str = ble_mac.toString();

	// battery level chara
	p_battery_level_characteristic = p_service->createCharacteristic(
		UUID_CHARA_BATTERY_LEVEL,
		BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ);
	p_battery_level_characteristic->setValue("77");

	BLEDescriptor *p_battery_level_user_description = new BLEDescriptor((uint16_t)0x2901);
	p_battery_level_user_description->setValue("Battery Level");
	p_battery_level_characteristic->addDescriptor(p_battery_level_user_description);

	// voltage chara
	p_voltage_characteristic = p_service->createCharacteristic(
		UUID_CHARA_VOLTAGE,
		BLECharacteristic::PROPERTY_READ);
	p_voltage_characteristic->setValue("4.97");

	// temp chara
	p_temperature_characteristic = p_service->createCharacteristic(
		UUID_CHARA_TEMPERATURE,
		BLECharacteristic::PROPERTY_READ);
	p_temperature_characteristic->setValue("24.5");

	debugLog(">> " + ble_mac_str);
	p_service->start();
	p_server->getAdvertising()->start();

	// buttons
    pinMode(BUTTON_1_PIN, INPUT_PULLUP);
    pinMode(BUTTON_2_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(BUTTON_1_PIN), int_on_button_1, FALLING);
    attachInterrupt(digitalPinToInterrupt(BUTTON_2_PIN), int_on_button_2, FALLING);
}

void loop() {
    unsigned long millis_now = millis();

    // handle notifications and characteristic updates
    if (device_connected && millis_now - millis_prev >= update_interval) {
        millis_prev = millis_now;

        // update counter and send notifications
        counter++;
        char str[10];
        itoa(counter, str, 10);
        p_notify_characteristic->setValue((uint8_t*)str, strlen(str));
        if (device_connected) { // check if the device is still connected
            p_notify_characteristic->notify();
            delay(10); // small delay after sending notifications
        }

		debugLog("Counter: " + String(counter));

        // update other characteristics
        int batteryLevel = getBatteryLevel();
        p_battery_level_characteristic->setValue(std::to_string(batteryLevel).c_str());
        float voltage = get5VRailVoltage();
        p_voltage_characteristic->setValue(std::to_string(voltage).c_str());
        float temperature = getTemperature();
        p_temperature_characteristic->setValue(std::to_string(temperature).c_str());
    }

    // handle disconnection
    if (!device_connected && known_device_connected) {
        delay(500); // give the BLE stack time to get ready
        p_server->startAdvertising(); // restart advertising
        known_device_connected = device_connected;
    }

    // handle new connection
    if (device_connected && !known_device_connected) {
        // do stuff on connecting, if needed
        known_device_connected = device_connected;
    }
}

template <typename T>
void debugLog(T value) {
    #ifdef HAS_TTGO_TFT
    if (current_line >= TFT_HEIGHT - LINE_HEIGHT) {
        // clear the screen and reset current_line to 0 if we're at the bottom
        tft.fillScreen(cur_bg_color);
        current_line = 0;
    }

    tft.setCursor(0, current_line, 4); // set cursor position for TFT
	
    if constexpr (std::is_same<T, std::string>::value) {
        tft.println(value.c_str());
    } else {
        tft.println(value); 
    }

    current_line += LINE_HEIGHT;    // move to the next line on TFT
    #endif

    // handle std::string
    if constexpr (std::is_same<T, std::string>::value) {
        Serial.println(value.c_str()); // for std::string
    } else {
        Serial.println(value); // for other types
    }
}

// interrupts for buttons
void int_on_button_1() {
    sendButtonNotification("cmd_btn:1");
}

void int_on_button_2() {
    sendButtonNotification("cmd_btn:2");
}

void sendButtonNotification(const char* message) {
    if (device_connected) {
        p_notify_characteristic->setValue((uint8_t*)message, strlen(message));
        p_notify_characteristic->notify();
    }
}

/**
 * @changelog
 * 1.0.0
 * - initial release
 * 1.x.x
 * - @upd UUID_WRITE_CHARA now supports write without response
 * - @upd UUID_NOTIFY_CHARA now additionally supports indicator (CURRENTLY NOT SUPPORTED BY BLE Master)
 * - @add descriptor added to UUID_CHARA_BATTERY_LEVEL to test its functionality
 * - @add bi-directional comms
 */