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
devices.push({ip: "192.168.1.7", port: "5000"});

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
		message = getDeviceFoundMessage(devices.length);		
		$("#div_ameba_device").html(message);
		$("#div_ameba_device > p").css({"top": "30%", "font-size": "12px"});
		checkDeviceAndAdd(device);
	}
	logger.log('debug', "devices found :: " + devices.length);
}); 
 
$("#ota_fw_file").click(function(){
	dialog.showOpenDialog((fileNames) => {
    // fileNames is an array that contains all the selected
    if(fileNames === undefined){
        logger.log('info', "No file selected");
        return;
    }else{
		filepath = fileNames[0];
		$("#ota_fw_file").html("F/W Selected !").css({"color": "green"});
		
		fs.readFile(filepath, 'utf-8', (err, data) => {
        if(err){
            logger.log('error', "An error ocurred reading the file :" + err.message);
            return;
        }

        // Change how to handle the file content
        logger.log('debug', "The file content is : " + data);
    });
	}
});
})

$('#ota_upload').click(function(){
  $("#ota_upload").html("Uploading..")
  devices.forEach(function(device, index){
	var otaCmd = '.\\tools\\upload_ota.exe -f "' + filepath + '" -i ' + device.ip + ' -p ' + device.port;
	cmd.get(
		otaCmd,
		function(err, data, stderr){
			logger.log('info', "filepath is :: "  + filepath); 	
			logger.log('info', 'the current working dir content is : ', data)
			logger.log('error', 'error is any: ', err);
			if(data.includes("Upload success")){
				$("#ota_upload").html("OTA Success!!!").css({"color": "green"})
			}else{
				$("#ota_upload").html("OTA Failed.").css({"color": "red"})
				logger.info('info', "OTA Upload failed for :: " + device.ip);
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
		return "<p>Found Dash Buttons</p> <p> - </p> <p> Click Here to Select</p>"
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