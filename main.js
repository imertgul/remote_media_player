const { rejects } = require("assert");
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    frame: false,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true, // is default value after Electron v5
      // contextIsolation: true, // protect against prototype pollution
      // enableRemoteModule: false,
      // preload: path.join(__dirname, '/page/preload.js')
    },
  });

  mainWindow.loadFile("index.html");
  // mainWindow.webContents.openDevTools();
}

app
  .whenReady()
  .then(() => {
    createWindow();
  })
  // .then(() => {
  //   mainWindow.webContents.on("did-finish-load", () => {
  //     fs.readdir(path.join(__dirname, "./media"), function (err, dir) {
  //       if (err) rejects(err);
  //       else {
  //         mainWindow.webContents.send("files", dir);
  //       }
  //     });
  //   });
  // });

