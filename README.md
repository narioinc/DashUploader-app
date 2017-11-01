# DashUploader-app
OTA firmware uploader software for the RAK Wireless AMEBA IoT board

# Usage
Make sure your Ameba board is flashed with the sample arduino app that is shared in this repo.

Follow the detailed tutorial here:
https://www.hackster.io/naresh-krish/push-ota-updates-to-your-rak-wireless-ameba-devices-fad3fd

# Usage from source code
Usage from the source code is fairly straight forward. From the root of the src folder:

## Install all the dependencies
```javascript 
npm install
```

## Start the application
```javascript 
npm start
```
# Beta v1.1
Beta version v1.1 includes the following changes
* enable/disables the various button based on previous steps success
* multi device support
* selection screen for devices
* minor ui tweaks for the three main screen button
* upload functionality change now to incorporate upload to multiple

# Beta v1.0
Initial release of the Dash uploader app
1) Electronjs based app for uploading ota firmware to Ameba IoT devices
2) Supports upload to single device