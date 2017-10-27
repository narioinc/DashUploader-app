/*
  Author Naresh Krish
  
  This arduino program shows how to update AmebaIOT image via Arduino IDE.

   1) Upload the sketch to the creator pro baord for the first time and Reset the board Ameba. 
   2) Part of the code starts an mdns service called " MyAmeba". Ideally the version of sketc is version 1
   3) Now edit this sketch. (Ex. the version number) and then reupload, this time instead of choosing USB port, 
     use the IP based port that will show up in the port meny in the arduino IDE
   4) Once done Ameba would reboot. Check the serial port for the changes (eg version).

*/

#include <WiFi.h>
#include <OTA.h>

char nw_ssid[] = "xxxxx";     //  your network SSID (name)
char pass[] = "xxxxx";  // your network password
char mDNS_NAME[] = "AmebaIoT";
#define FW_REV 1
#define FW_OTA_PORT 8888

/**
 * Here we define the recovery pins for the board
 * for the 8195/8711 its 18 and and for 8710 its 17
 */
#if defined(BOARD_RTL8195A)
#define RECOVER_PIN 18
#elif defined(BOARD_RTL8710)
#define RECOVER_PIN 17
#else
#define RECOVER_PIN 18
#endif



void setup() {
  
  //set the mdns name for the board to publish here.
  

  //output the version number of the firmware here:
  printf("Firmware revision version: %d\r\n\r\n", FW_REV);
  printf("Connect to %s\r\n", nw_ssid);

  //wait for wifi to get connected to the access point you specifi
  while (WiFi.begin(nw_ssid, pass) != WL_CONNECTED) {
    printf("Couldnt connect to ssid...\r\n");
    //wait for a second before retrying...
    delay(1000);
  }

  //if connected print the success....
  printf("Successfully Connected to %s\r\n", nw_ssid);

  // These setting are mostly one time setting. We dont need it to be built into the future versions code
  #if FW_REV == 1

  // Set the recovery pin . 
  //Boot device with pull up this pin (Eq. connect pin to 3.3V) to recover to firmware rev 1 (forctory firmware)
  OTA.setRecoverPin(RECOVER_PIN);
  
  
  
  // This set the flash address that store the OTA image. 
  // Default value is DEFAULT_OTA_ADDRESS
  OTA.setOtaAddress(DEFAULT_OTA_ADDRESS);

  
  #endif

  // Broadcast mDNS service at OTA_PORT that makes Arduino IDE find Ameba device
  OTA.beginArduinoMdnsService(mDNS_NAME, FW_OTA_PORT);

  // Listen at OTA_PORT and wait for client (Eq. Arduino IDE). Client would send OTA image and make a update.
  if (OTA.beginLocal(FW_OTA_PORT) < 0) {
    printf("OTA firmware upload failed!!\r\n");
  }
}


void loop() {
  Serial.begin(9600);
  /**
   * Any user code here. Make sure the firmware code is just half of the programmable flash size 
   * (excluding bootloader, and other sections of flash).
   * as the chip would store two firmwares, one latest and one for factory reset.
   */
  delay(1000);
}
