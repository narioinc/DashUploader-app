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
var selectedDevices = [];

 ipcRenderer.on("devices_list", function(event, arg){
	 logger.log('debug', "In device select window :: " + arg);
	 showDevicesList(arg);
 });

$('#div_app_close').click(function(){
	 var window = remote.getCurrentWindow();
     window.close();
});

 $("#div_reset").click(function(){
	logger.info('info', "User selected to reset device selection UI.")
	selectedDevices = [];
 })
 
 function showDevicesList(devices){
 var content="";
 devices.forEach(function(el, index){
	content += "<option>" + el.ip +"</option>"
 });
 console.log(content);
 $("#devices_list").append($('<option>', {
    value: 1,
    text: 'My option'
}));
 $("#devices_list").html(content);
 }
 
