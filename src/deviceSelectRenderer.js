const remote = require('electron').remote;
window.$ = window.jQuery = require("jquery");
const {
  createLogger,
  format,
  transports
} = require('winston');
const logger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new transports.Console(),
    new transports.File({
      filename: './logs/debug.log',
      level: 'debug'
    }),
    new transports.File({
      filename: './logs/error.log',
      level: 'error'
    }),
    new transports.File({
      filename: './logs/combined.log'
    })
  ]
});

var ipcRenderer = require('electron').ipcRenderer; //IP renderer object to talk to the main process
var selectedDevices = []; //array of selected devices

/**********************
UI Section (user clicks, hovers etc)
**********************/

/*
Close this window when the user click the top right 'X' button
 */
$('#div_app_close').click(function() {
  ipcRenderer.send("accept_selection", []);
  var window = remote.getCurrentWindow();
  window.close();
});

/*
  reset the UI when the user click to re-define his device selection
 */
$("#div_reset").click(function() {
  logger.info('info', "User selected to reset device selection UI.")
  selectedDevices = [];
})

/*
Accept the selection made by the user and intimate the main app window
 */
$("#accept_selection").click(function() {
  ipcRenderer.send("accept_selection", selectedDevices);
  logger.log('info', "User selected devices ::: " + selectedDevices.length);
});

/*
 reset the UI when the user click to re-define his device selection
 */
$("#reset_selection").click(function() {
  logger.log('info', "User reset device selection");
  $(".list-group > li").removeClass("list-group-item-selected");
  selectedDevices = [];
});

/***************************
Util funtions section
***************************/

/*
Function to draw the devices into a list for the user to scroll and select.
 */
function showDevicesList(devices) {
  var content = "";
  devices.forEach(function(el, index) {
    content += '<li class="list-group-item"> <span class="icon icon-monitor"></span><div class="media-body"><strong>' + el.ip + ' : ' + el.port + '</strong><p>Device description here.</p></div></li>'
  });
  logger.log('debug', "UI shows device[s] :: " + content);
  $(".list-group").html(content);
  $(".list-group > li").click(function() {
    var i = $(this).index();
    logger.log('info', "User selected :: " + i);
    $(this).toggleClass("list-group-item-selected")
    if ($(this).hasClass("list-group-item-selected")) {
      selectedDevices.push(i);
    } else {
      selectedDevices.splice(selectedDevices.indexOf(i), 1);
    }
  });
}


/**********************
IPC section
***********************/
/*
IPC to handle when the select devices screen receives the list of all devices from the main menu
 */
ipcRenderer.on("devices_list", function(event, arg) {
  logger.log('debug', "In device select window :: " + arg);
  showDevicesList(arg);
});
