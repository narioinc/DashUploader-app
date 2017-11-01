// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var mdns = require('mdns-js');
var cmd = require('node-cmd');
const remote = require('electron').remote;
window.$ = window.jQuery = require("jquery");
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log` 
    // - Write all logs error (and below) to `error.log`.
    //
	new transports.Console(),
	new transports.File({ filename: './logs/debug.log', level: 'debug' }),
    new transports.File({ filename: './logs/error.log', level: 'error' }),
    new transports.File({ filename: './logs/combined.log' })
  ]
});

var ipcRenderer = require('electron').ipcRenderer;  
var fs = require('fs'); // Load the File System to execute our common tasks (CRUD)


var dialog = remote.dialog; 
var filepath; 
var ip, port; 
var devices = [];
var selectedDevices = [];

$('#div_app_close').click(function(){
	 var window = remote.getCurrentWindow();
     window.close();
});
 
var brw = mdns.createBrowser();


brw.on('ready', function () {
    brw.discover(); 
});

brw.on('update', function (data) {
    if(data.host == "ameba.local"){
		var device = {};
		ip = data.addresses[0];
		port = data.port
		device.ip = ip;
		device.port = port;
		logger.log('debug', 'ip :: ' + device.ip + " port :: " + device.port);
		message = "<p>Found "+ devices.length +" Dash Button(s)</p> <p> - </p> <p> Click Here to Select</p>"		
		$("#div_ameba_device").html(message);
		$("#div_ameba_device > p").css({"top": "30%", "font-size": "12px"});
		checkDeviceAndAdd(device);
	}
	logger.log('debug', "devices found :: " + devices.length);
}); 
 
$("#ota_fw_file").click(function(){
	if(selectedDevices.length <= 0) return;
	dialog.showOpenDialog((fileNames) => {
    // fileNames is an array that contains all the selected
	if(fileNames === undefined){
        logger.log('info', "No file selected");
        return;
    }else{
		filepath = fileNames[0];
		$("#ota_fw_file").html("F/W Selected !").css({"color": "green"});
		logger.log('debug', "File path selected :: " + filepath);
		fs.readFile(filepath, 'utf-8', (err, data) => {
        if(err){
            logger.log('error', "An error ocurred reading the file :" + err.message);
            return;
        }

        // Change how to handle the file content
        logger.log('debug', "The file content is : " + data);
		enableUploadButton(filepath);
    });
	}
});

})

$('#ota_upload').click(function(){
  $("#ota_upload").html('<p>Uploading...<p>')
  var uploadSuccess = true;
  if(selectedDevices.length <= 0) return;
  selectedDevices.forEach(function(device, index){
	logger.log("info", "Starting upload to device :: " + devices[device].ip)  
	var otaCmd = '.\\tools\\upload_ota.exe -f "' + filepath + '" -i ' + devices[device].ip + ' -p ' + devices[device].port;
	cmd.get(
		otaCmd,
		function(err, data, stderr){
			logger.log('info', "filepath is :: "  + filepath); 	
			logger.log('info', 'the current working dir content is : ', data)
			logger.log('error', 'error is any: ', err);
			if(data.includes("Upload success")){
				$("#ota_upload").html("OTA Success!!!").css({"color": "green"})
				logger.info('info', "Upload success for device :: " + devices[device].ip );
				uploadSuccess &= true;
			}else{
				$("#ota_upload").html("OTA Failed.").css({"color": "red"})
				dialog.showMessageBox({type:"error", message:"Some devices failed to get updated. Check the combined.logs in \logs folder for details"});
				logger.info('info', "OTA Upload failed for :: " +  devices[device].ip );
				uploadSuccess &= false;
			}
    });
  });
});
 
 $("#div_reset").click(function(){
	logger.info('info', "User selected to reset main UI.")
	ip = "";
	port = "";
	$("#ota_upload").html("Upload").css({"color": "white"});
	$("#ota_fw_file").html("Browse..").css({"color": "white"});
	$("#div_ameba_device").html('<p>No Device Found<p>	<div class="loader-line"></div>');
	devices = [];
 })
 
 function checkDeviceAndAdd(amebaDevice) {
  var found = devices.some(function (el) {
    return el.ip === amebaDevice.ip;
  });
  if (!found) { devices.push(amebaDevice); }
}

function getDeviceFoundMessage(){
	if(devices.length > 1){
		return "<p>Found  "+ devices.length +" Dash Buttons</p> <p> - </p> <p> Click Here to Select</p>"
	}else{
		return "<p>Found Dash Button</p> <p> @ </p> <p> " + ip + ":" + port + "</p>"
	}
}
	
$("#div_ameba_device").click(function(){
	if(devices.length >= 1){
		logger.log('info', "User requests device selection window");
		ipcRenderer.send("select_devices", devices);
	}
});

ipcRenderer.on('devices_selected', function(event, args){
	if(args.length >= 1){
		logger.log('info', "Number of device ready for new firmware provisioning :: " + args.length);
		selectedDevices = args;
	}else{
		logger.debug("USer did not select any devices for new firmware.")
		selectedDevices = [];
	}
	enableBrowseButton();
});

function enableBrowseButton(){
	if(selectedDevices.length >= 1 ){
		$("#div_file_select").hover(function(e){
			$(this).css("background-color", e.type === "mouseenter"?"#2374AB":"#1C2541");
		});
	}else{
		$("#div_file_select").hover(function(){
			$(this).css("background-color", "#1C2541");
		});
	}
}

function enableUploadButton(file){
	if(selectedDevices.length >=1 && file && file.length > 0){
		$("#div_ota_upload").hover(function(e){
			$(this).css("background-color", e.type === "mouseenter"?"#2374AB":"#1C2541");
		});
	}else{
		$("#div_ota_upload").hover(function(){
			$(this).css("background-color", "#1C2541");
		});
	}
}
	