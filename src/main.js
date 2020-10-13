const { rejects } = require("assert");
const { app, BrowserWindow, ipcMain } = require("electron");
const { response } = require("express");
const fs = require("fs");
var timer = require("timer")
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

  mainWindow.loadFile("../app/window.html");
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

let MyPlayer = new Player();

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
  filename = path.resolve("app/media", filename.replace(/\s/g, ''));
  var dst = fs.createWriteStream(filename);
  req.pipe(dst);
  dst.on("drain", function () {
    console.log("Yukleniyor... ", new Date());
    req.resume();
  });
  req.on("end", function () {
    console.log("Tamamlandi... "+ filename);
    MyPlayer.add(new Media(filename, 5000));
    res.sendStatus(200);
  });
});

service.post("/brightness", function (req, res) {
  mainWindow.webContents.send("brightness", req.body.brightness);
  res.sendStatus(200);
  console.log(MyPlayer);
});

service.post("/play", function (req, res) {
  res.sendStatus(200);
  MyPlayer.play=!MyPlayer.play
  console.log("Play set: "+MyPlayer.play);
  if (MyPlayer.play) {
    MyPlayer.start(mainWindow, 0);
  } 
});

service.post("/loop", function (req, res) {
  res.sendStatus(200);
  console.log("Loop set: "+req.body.val);
  MyPlayer.loop=!MyPlayer.loop
});

service.post("/init", function (req, res) {
  console.log("PlayerName: "+req.body.playerName);
  res.end(JSON.stringify(MyPlayer));
  res.sendStatus(200);
});

service.post("/screenSize", function (req, res) {
  console.log("Screen size set: "+req.body.width+ " x "+ req.body.height);
  mainWindow.webContents.send("screenSize", {width: req.body.width, height: req.body.height});
  res.sendStatus(200);
});


function Media(myFileName, myLength) {
  this.id = Math.random().toString(36).slice(2);
  this.fileName = myFileName;
  this.duration = myLength;

  this.print = function () {
    console.log(this.id + "  " + this.fileName + " " + this.duration);
  };
  this.play = function (mainWindow) {
    mainWindow.webContents.send("file", this.fileName);
  };
}

function Player() {
  this.count = 0;
  this.play = false;
  this.loop = false;
  this.playList = [];
  this.add = function (object) {
    this.playList[this.count] = object;
    this.count++;
  };
  this.start =function (mainWindow, from) {
    if (!this.play) return 0;
    let index = from;
    console.log("index: " + index + " Count: " + this.count + " Loop: " + this.loop+ " Play: " + this.play);
    this.playList[index].play(mainWindow);
    if (this.loop && index == this.count - 1) setTimeout(()=>this.start(mainWindow, 0), this.playList[index].duration);
    else if (!this.loop && index == this.count - 1)  this.play = false;
    else if (this.play && index < this.count - 1) setTimeout(()=>this.start(mainWindow, ++index), this.playList[index].duration);
    return 0;  
  };
}
