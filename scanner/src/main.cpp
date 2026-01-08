#include "HardwareSerial.h"
#include "esp32-hal-gpio.h"
#include <Arduino.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522v2.h>
// #include <MFRC522DriverI2C.h>
#include <MFRC522Debug.h>
#include <MFRC522DriverPinSimple.h>
#include <WebSocketsClient.h>
#include <WiFi.h>

// IN means INDOOR
// OUT means OUTDOOR

#define IN_IR_PIN 4
#define OUT_IR_PIN 15
#define IN_RFID_PIN 5
#define OUT_RFID_PIN 17
#define BUZZER_PIN 13

#define SSID "iQOO_Z10_X"
#define PASSPHRASE "iQooZ10x"

#define HOST "10.12.13.110"
#define PORT 8080
#define ENDPOINT "/ws"

MFRC522DriverPinSimple inRfidPin(5);
MFRC522DriverPinSimple outRfidPin(17);

MFRC522DriverSPI inRfidDriver{inRfidPin};
MFRC522DriverSPI outRfidDriver{outRfidPin};

MFRC522 inRfid{inRfidDriver};
MFRC522 outRfid{outRfidDriver};

WebSocketsClient ws;

String readRfid(MFRC522 &rfid);
void sendIRsData(int inIr, int outIr);
void onWsEvent(WStype_t type, uint8_t *payload, size_t length);
String getDeviceID();

int lastInIrRecord = 1;
int lastOutIrRecord = 1;

void setup() {
  pinMode(IN_IR_PIN, INPUT);
  pinMode(OUT_IR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  Serial.begin(115200);

  inRfid.PCD_Init();
  outRfid.PCD_Init();

  WiFi.begin(SSID, PASSPHRASE);
  while (WiFi.status() != WL_CONNECTED)
    delay(500);

  ws.begin(HOST, PORT, ENDPOINT);
  ws.onEvent(onWsEvent);
  ws.setReconnectInterval(3000);

  Serial.println("===== SETUP COMPLETE =====");
}

void loop() {
  ws.loop();

  String leftRfidUid = readRfid(inRfid);
  String rightRfidUid = readRfid(outRfid);
  int inIr = digitalRead(IN_IR_PIN);
  int outIr = digitalRead(OUT_IR_PIN);

  String deviceID = getDeviceID();

  if (leftRfidUid != "") {
    Serial.println("IN RFID UID: " + leftRfidUid);
    ws.sendTXT("rfid indoor " + leftRfidUid + " from " + deviceID);
  }
  if (rightRfidUid != "") {
    Serial.println("OUT RFID UID: " + rightRfidUid);
    ws.sendTXT("rfid outdoor " + rightRfidUid + " from " + deviceID);
  }
  if (inIr != lastInIrRecord) {
    lastInIrRecord = inIr;
    sendIRsData(inIr, outIr);
  }
  if (outIr != lastOutIrRecord) {
    lastOutIrRecord = outIr;
    sendIRsData(inIr, outIr);
  }
}

String readRfid(MFRC522 &rfid) {
  if (!rfid.PICC_IsNewCardPresent())
    return "";
  if (!rfid.PICC_ReadCardSerial())
    return "";

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10)
      uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }

  rfid.PICC_HaltA();
  return uid;
}

void sendIRsData(int leftIr, int rightIr) {
  String leftStatus = leftIr == 1 ? "OFF" : "ON";
  String rightStatus = rightIr == 1 ? "OFF" : "ON";
  String deviceID = getDeviceID();

  ws.sendTXT("ir indoor " + leftStatus + " outdoor " + rightStatus + " from " +
             deviceID);

  Serial.println("IN IR: " + leftStatus + " | OUT IR: " + rightStatus);
  if (leftStatus == "OFF" && rightStatus == "OFF")
    Serial.println("==========");
}

void onWsEvent(WStype_t type, uint8_t *payload, size_t length) {
  String msg = String((char *)payload);
  switch (type) {
  case WStype_CONNECTED:
    Serial.println("WS CONNECTED");
    ws.sendTXT("init scanner " + getDeviceID());
    break;

  case WStype_TEXT:
    Serial.printf("WS MESSAGE: %s\n", payload);
    if (msg == "buzzer on") {
      digitalWrite(BUZZER_PIN, HIGH);
    }
    if (msg == "buzzer off") {
      digitalWrite(BUZZER_PIN, LOW);
    }

    break;

  case WStype_DISCONNECTED:
    Serial.println("WS DISCONNECTED");
    break;
  case WStype_ERROR:
  case WStype_BIN:
  case WStype_FRAGMENT_TEXT_START:
  case WStype_FRAGMENT_BIN_START:
  case WStype_FRAGMENT:
  case WStype_FRAGMENT_FIN:
  case WStype_PING:
  case WStype_PONG:
    break;
  }
}

String getDeviceID() {
  uint64_t mac = ESP.getEfuseMac(); // factory-burned, universal

  char id[20];
  sprintf(id, "%04X%08X", (uint16_t)(mac >> 32), (uint32_t)mac);

  return String(id);
}
