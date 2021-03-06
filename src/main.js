const electron = require('electron') // Electron module
const app = electron.app // Module to control application life.
const BrowserWindow = electron.BrowserWindow // Module to create native browser window.
const path = require('path') // Module for accessing file paths
const url = require('url') // Module for loading the url from links (local or web)
var {
  ipcMain
} = electron; // Main module IPC object
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
      filename: './logs/debug.log',
      level: 'debug'
    }),
    new transports.File({
      filename: './logs/error.log',
      level: 'error'
    }), // Write all logs error (and below) to `error.log`.
    new transports.File({
      filename: './logs/combined.log'
    }) // Write to all logs with level `info` and below to `combined.log`
  ]
});


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let deviceSelectWindow;

/*
Function to create the main windows for the DashUploader app
 */
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 300,
    frame: false
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.setResizable(false);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    logger.log('debug', "App was closed");
    mainWindow = null
  })

}

/*
Function to create the device selection window for the Dashuploader app
 */
function createSelectDeviceWindow(devices) {
  // Create the browser window.
  deviceSelectWindow = new BrowserWindow({
    width: 400,
    height: 800,
    frame: false,
    parent: mainWindow,
    modal: true
  })

  // and load the index.html of the app.
  deviceSelectWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'deviceSelect.html'),
    protocol: 'file:',
    slashes: true
  }))

  deviceSelectWindow.webContents.on('did-finish-load', () => {
    logger.log("debug", "windows finsihed loading..sending info now");
    deviceSelectWindow.webContents.send('devices_list', devices)
  })

  deviceSelectWindow.setResizable(false);

  // Open the DevTools.
  //deviceSelectWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  deviceSelectWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    deviceSelectWindow = null;
  })

  deviceSelectWindow.show()
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
// Listen for async message from renderer process
ipcMain.on('async', (event, arg) => {
  // Print 1
  console.log("Got async message", arg);
  // Reply on async message from renderer process
  //event.sender.send('async-reply', 2);
});

/****************************
IPC Section
*****************************/

/*
IPC message to process the event when user presses the select devices button
 */
ipcMain.on('select_devices', (event, arg) => {
  logger.log('info', "Launch select devices window" + JSON.stringify(arg));
  createSelectDeviceWindow(arg);
});

/*
IPC Message to process the event when the user has finalised his device selection 
 */
ipcMain.on('accept_selection', (event, arg) => {
  logger.log('info', arg.length + " device(s) ready for firmware upload procedure.");
  deviceSelectWindow.close();
  mainWindow.webContents.send("devices_selected", arg);
});
