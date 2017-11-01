// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var mdns = require('mdns-js'); // Node library to discover or advertise mDNS adverts
var cmd = require('node-cmd'); // Node library to execute OS terminal commands
const remote = require('electron').remote; // the IPC object to access internal Electron IPC layer
const app = require('electron').remote.app; // the Electron app module to retrieve app specific information
var fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
var dialog = remote.dialog; // Electron framework for showing native OS dialogs.
const {
  createLogger,
  format,
  transports
} = require('winston'); // Node library to enable efficient logging in apps instead of the 'dreaded' console logs 8P
const logger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: app.getAppPath() + '/logs/debug.log',
      level: 'debug'
    }),
    new transports.File({
      filename: app.getAppPath() + '/logs/error.log', // Write all logs error (and below) to `error.log`.
      level: 'error'
    }),
    new transports.File({
      filename: app.getAppPath() + '/logs/combined.log' // Write to all logs with level `info` and below to `combined.log`
    })
  ]
});


window.$ = window.jQuery = require("jquery");
/*
                                             Load the jquery dependency for accessing UI elements
                                             Jquery docs: https://api.jquery.com/
                                              */

var ipcRenderer = require('electron').ipcRenderer;
/*
                                                  The IPC ocject for the renderer to communicate with the main process.
                                                  Electron IPC docs: https://electron.atom.io/docs/api/ipc-renderer/
                                                   */

/*
State variables here
 */
var filepath; // variable to store the path to the binary OTA file selected by user
var ip, port; // varible to store the Ip and port of a selected Ameba devices
var devices = []; // Array to store the list of Devices discovered via mDNS adverts
var selectedDevices = []; // Array to store the devices selected by user to push OAT update
var uploadProgress = 0; // Progress of the number of devices to which an OTA push was executed (not necessarily succeeded)
var uploadSuccess = true; // was the OTA upload operation success (this is cummulative success, would be false if even one device failed the OTA process. however, OTA upload doesnt stop if a device fails OTA, it proceeds with the next device)


/***********************
mDNS serction.
 *************************/

var brw = mdns.createBrowser();
brw.on('ready', function() {
  brw.discover();
});
brw.on('update', function(data) {
  if (data.host == "ameba.local") {
    var device = {};
    ip = data.addresses[0];
    port = data.port
    device.ip = ip;
    device.port = port;
    logger.log('debug', 'ip :: ' + device.ip + " port :: " + device.port);
    message = "<p>Found " + devices.length + " Dash Button(s)</p> <p> - </p> <p> Click Here to Select</p>"
    $("#div_ameba_device").html(message);
    $("#div_ameba_device > p").css({
      "top": "30%",
      "font-size": "12px"
    });
    checkDeviceAndAdd(device);
  }
  logger.log('debug', "devices found :: " + devices.length);
});

/***************************
UI actions (clicks, hovers etc)
/****************************

/*
Close the window when user click the top  right 'X'
 */
$('#div_app_close').click(function() {
  var window = remote.getCurrentWindow();
  window.close();
});

/*
Function to select the OTA.bin file for Upload
 */

$("#ota_fw_file").click(function() {
  logger.log("info", "os environment is :: " + process.platform);
  if (selectedDevices.length <= 0) return;
  dialog.showOpenDialog((fileNames) => { //TODO filter the file for only *.bin
    // fileNames is an array that contains all the selected
    if (fileNames === undefined) {
      logger.log('info', "No file selected");
      return;
    } else {
      filepath = fileNames[0];
      $("#ota_fw_file").html("F/W Selected !").css({
        "color": "green"
      });
      logger.log('debug', "File path selected :: " + filepath);
      fs.readFile(filepath, 'utf-8', (err, data) => {
        if (err) {
          logger.log('error', "An error ocurred reading the file :" + err.message);
          return;
        }
        enableUploadButton(filepath); // Change how to handle the file content
      }); //logger.log('debug', "The file content is : " + data);
    }
  });
})

/*
Perform a OTA upload when the user click the upload button.
 */
$('#ota_upload').click(function() {
  if (!uploadSuccess) {
    dialog.showMessageBox({
      type: "error",
      message: "Some devices failed to get updated. Check the combined.logs in resources\app\logs folder for details"
    });
    return;
  }

  $("#ota_upload").html('Uploading...')
  if (selectedDevices.length <= 0) return; //if selected devices are 0 then there is nothing to do, return gracefully
  selectedDevices.forEach(function(device, index) {
    logger.log("info", "Starting upload to device :: " + devices[device].ip)
    var otaCmd = generateOTACmd(device); //generate OS specifc OTA command line script.
    cmd.get(
      otaCmd,
      function(err, data, stderr) {
        logger.log('info', "filepath is :: " + filepath);
        logger.log('info', 'the current working dir content is : ', data)
        logger.log('error', 'error is any: ', err);
        if (data.includes("Upload success")) {
          logger.info('info', "Upload success for device :: " + devices[device].ip);
          uploadSuccess &= true;
        } else {
          logger.info('info', "OTA Upload failed for :: " + devices[device].ip);
          uploadSuccess &= false;
        }
        uploadProgress++;
        remote.getCurrentWindow().webContents.send("uploadProgress");
      });
  });
});

/*
Reset the app for uploading to a different set of devices.
 */
$("#div_reset").click(function() {
  logger.info('info', "User selected to reset main UI.")
  ip = ""; //make sure all state variables are reet here.
  port = ""; //TODO find a better means of avoiding this global space variable 'pollution'.
  uploadSuccess = true;
  uploadProgress = 0;
  filepath = "";
  selectedDevices = [];
  enableUploadButton("");
  enableBrowseButton();
  $("#ota_upload").html("Upload").css({
    "color": "white"
  });
  $("#ota_fw_file").html("Browse..").css({
    "color": "white"
  });
  $("#div_ameba_device").html('<p>No Device Found<p>	<div class="loader-line"></div>');
  devices = [];
})

/*
Select the devices which need to get an OTA update. Spawns the device selection UI window
 */
$("#div_ameba_device").click(function() {
  logger.log("info", app.getAppPath() + " is the app path");
  if (devices.length >= 1) {
    logger.log('info', "User requests device selection window");
    ipcRenderer.send("select_devices", devices);
  }
});


/*******************************
Util Functions
********************************/
/*
Function to check the device address in the list and see if it is already preset
 */
function checkDeviceAndAdd(amebaDevice) {
  var found = devices.some(function(el) {
    return el.ip === amebaDevice.ip;
  });
  if (!found) {
    devices.push(amebaDevice);
  }
}

/*
Function to generate the device found message for the seletc devices div
 */
function getDeviceFoundMessage() {
  if (devices.length > 1) {
    return "<p>Found  " + devices.length + " Dash Buttons</p> <p> - </p> <p> Click Here to Select</p>"
  } else {
    return "<p>Found Dash Button</p> <p> @ </p> <p> " + ip + ":" + port + "</p>"
  }
}

/*
Function to enable or disbale the Browse.. button based on users sleecton of devices.
 */
function enableBrowseButton() {
  if (selectedDevices.length >= 1) {
    $("#div_file_select").hover(function(e) {
      $(this).css("background-color", e.type === "mouseenter" ? "#2374AB" : "#1C2541");
    });
  } else {
    $("#div_file_select").hover(function() {
      $(this).css("background-color", "#1C2541");
    });
  }
}

/*
Function to enable/disable the upload button based on the OTA.bin file selected by the user
 */
function enableUploadButton(file) {
  if (selectedDevices.length >= 1 && file && file.length > 0) {
    $("#div_ota_upload").hover(function(e) {
      $(this).css("background-color", e.type === "mouseenter" ? "#2374AB" : "#1C2541");
    });
  } else {
    $("#div_ota_upload").hover(function() {
      $(this).css("background-color", "#1C2541");
    });
  }
}

/*
Function to generate the OS specific OTA commands for upload.
 */
function generateOTACmd(device) {
  var otaCmd = ""
  if (process.platform == "win32") {
    otaCmd = '"' + app.getAppPath() + '\\tools' + "\\" + process.platform + '\\upload_ota.exe" -f "' + filepath + '" -i ' + devices[device].ip + ' -p ' + devices[device].port;
  } else if (process.platform == "linux") {
    var otaCmd = '"' + app.getAppPath() + '\\tools' + "\\" + process.platform + '\\upload_ota_linux" -f "' + filepath + '" -i ' + devices[device].ip + ' -p ' + devices[device].port;
  }
  return otaCmd;
}


/*************************
IPC section
*************************/

/*
IPC command when the user has successfully selected devices from the device selection screen.
 */
ipcRenderer.on('devices_selected', function(event, args) {
  if (args.length >= 1) {
    logger.log('info', "Number of device ready for new firmware provisioning :: " + args.length);
    selectedDevices = args;
  } else {
    logger.debug("User did not select any device(s) for new firmware.")
    selectedDevices = [];
  }
  enableBrowseButton();
});

/*
IPC command to get the internal messages when an OTA upload succeeds or fails.
 */
ipcRenderer.on('uploadProgress', function(event, args) {
  logger.log("info", "got progress update");
  if (uploadProgress == selectedDevices.length) {
    if (uploadSuccess) {
      $("#ota_upload").html("OTA success!!").css({
        "color": "green"
      })
    } else {
      $("#ota_upload").html("OTA has failures").css({
        "color": "red"
      })
    }
  }
});
