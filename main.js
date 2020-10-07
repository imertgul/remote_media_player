const { rejects } = require("assert");
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
var express = require("express"),
  path = require("path"),
  service = express();



service.set("port", process.env.PORT || 3000);
service.use(express.static("public"));
service.listen(service.get("port"), function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Running on port: " + service.get("port"));
  }
});
service.use(
  express.urlencoded({
    extend: false,
  })
);
service.use(express.json());

service.post('/upload/:filename', function (req, res) {
  var filename = path.basename(req.params.filename);
  filename = path.resolve('media', filename);
  var dst = fs.createWriteStream(filename);
  req.pipe(dst);
  dst.on('drain', function() {
    console.log('drain', new Date());
    req.resume();
  });
  req.on('end', function () {
    mainWindow.webContents.send("file", filename);
    res.send(200);
  });
});

//***************************************************************//
//***************************************************************//
//***********************   ELECTRON  ***************************//
//***************************************************************//
//***************************************************************//
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

  mainWindow.loadFile("window.html");
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
});
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
