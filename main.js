const { rejects } = require("assert");
const { app, BrowserWindow, ipcMain } = require("electron");
const { response } = require("express");
const fs = require("fs");
var express = require("express"),
  path = require("path"),
  service = express();


//***************************************************************//
//***************************************************************//
//***********************   ELECTRON  ***************************//
//***************************************************************//
//***************************************************************//
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    frame: true,
    fullscreen: false,
    webPreferences: {
      nodeIntegration: true,
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

//***************************************************************//
//***************************************************************//
//***********************   SERVICES  ***************************//
//***************************************************************//
//***************************************************************//

var fileList = [];
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

service.post("/upload/:filename", function (req, res) {
  var filename = path.basename(req.params.filename);
  filename = path.resolve("media", filename);
  var dst = fs.createWriteStream(filename);
  req.pipe(dst);
  dst.on("drain", function () {
    console.log("Yukleniyor... ", new Date());
    req.resume();
  });
  req.on("end", function () {
    console.log("Tamamlandi...");
    fileList.push(filename);
    mainWindow.webContents.send("file", filename);
    res.sendStatus(200);
  });
});

service.post("/brightness", function (req, res) {
  mainWindow.webContents.send("brightness", req.body.brightness);
  res.end("yes");
});

service.post("/delete/:filename", function(req, res){
  
})