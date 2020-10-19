const { rejects } = require("assert");
const { app, BrowserWindow, ipcMain } = require("electron");
const { getVideoDurationInSeconds } = require('get-video-duration');
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
    frame: false,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile("../app/window.html");
  //mainWindow.webContents.openDevTools();
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
var timeOut;

service.set("port", process.env.PORT || 3000);
service.use(express.static("public"));
service.listen(service.get("port"), function (err) {
  if (err) {
    console.log(err);
  } else {
    // console.log("Running on port: " + service.get("port"));
    require('dns').lookup(require('os').hostname(), function (err, add, fam) {
      console.log('Connect test UI: http://'+add+':'+service.get("port"));
      console.log('Your target on Test UI must be: http://'+add+':'+service.get("port"));
    })
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
  filename = path.resolve("app/media", filename.replace(/\s/g, ""));
  var dst = fs.createWriteStream(filename);
  req.pipe(dst);
  dst.on("drain", function () {
    console.log("Yukleniyor... ", new Date());
    req.resume();
  });
  req.on("end", function () {
    console.log("Tamamlandi... " + filename);
    var extension = getFileExtension(filename);
    if (extension == "mp4" || extension == "mov") {
      getVideoDurationInSeconds(filename).then((duration) => {
        console.log(duration)     
        MyPlayer.add(new Media(filename, duration*1000));
      })
    }
    else
      MyPlayer.add(new Media(filename, 5000));
    res.end(JSON.stringify(MyPlayer));
  });
});

service.post("/brightness", function (req, res) {
  if (req.body.brightness > 10 && req.body.brightness < 0) res.sendStatus(400);
  else {
    MyPlayer.brightness = req.body.brightness;
    mainWindow.webContents.send("brightness", MyPlayer.brightness);
    res.end(JSON.stringify(MyPlayer));
  }
});

service.post("/play", function (req, res) {
  //Warning, res.body.val just a toggle signal
  MyPlayer.play = !MyPlayer.play;
  console.log("Play set: " + MyPlayer.play);
  if (MyPlayer.play) {
    MyPlayer.start(mainWindow, 0);
  }
  res.end(JSON.stringify(MyPlayer));
});

service.post("/loop", function (req, res) {
  //Warning, res.body.val just a toggle signal
  MyPlayer.loop = !MyPlayer.loop;
  console.log("Loop set: " + MyPlayer.loop);
  res.end(JSON.stringify(MyPlayer));
});

service.post("/init", function (req, res) {
  console.log("PlayerName: " + req.body.playerName);
  res.end(JSON.stringify(MyPlayer));
});

service.post("/deleteMedia", function (req, res) {
  MyPlayer.playList = arrayRemove(MyPlayer.playList, req.body.id);
  MyPlayer.count--;
  console.log("Deleted: " + req.body.id);
  if (MyPlayer.play == true) {
    MyPlayer.stop();
    MyPlayer.play = true;
    MyPlayer.start(mainWindow, 0);
  }
  res.end(JSON.stringify(MyPlayer));
});

service.post("/updateDuration", function (req, res) {
  if (req.body.duration >0) {
    console.log(
      "Updated duration: " + req.body.duration + " for: " + req.body.id
    );
    MyPlayer.playList[indexOfID(req.body.id, MyPlayer.playList)].duration =
      req.body.duration;
    res.end(JSON.stringify(MyPlayer));
  }
  else
    res.sendStatus(400);
});

service.post("/updateList", function (req, res) {
  if (req.body.to >= 0 && req.body.to < MyPlayer.playList.length) {
    console.log("Updated List for: " + req.body.id + " toIndex: " + req.body.to);
    var temp = MyPlayer.playList[indexOfID(req.body.id, MyPlayer.playList)];
    MyPlayer.playList = arrayRemove(MyPlayer.playList, req.body.id);
    MyPlayer.playList.splice(req.body.to, 0, temp);
    res.end(JSON.stringify(MyPlayer));
  }
  else
    res.sendStatus(400);
});

service.post("/playFrom", function (req, res) {
  if (req.body.index >= 0 && req.body.index < MyPlayer.playList.length) {
    MyPlayer.stop();
    MyPlayer.play = true;
    MyPlayer.start(mainWindow, req.body.index);
    res.end(JSON.stringify(MyPlayer));
    console.log("Player starts from: " + req.body.index);
  }
  else
    res.sendStatus(400);
});

service.post("/screenSize", function (req, res) {
  if (req.body.height < 0 && req.body.width < 0) res.sendStatus(400);
  else {
    console.log("Screen size set: " + req.body.width + " x " + req.body.height);
    MyPlayer.screenSize = req.body;
    mainWindow.webContents.send("screenSize", req.body);
    res.end(JSON.stringify(MyPlayer));
  }
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
  this.brightness = 10;
  this.screenSize = { height: 360, width: 192 };
  this.playList = [];
  this.add = function (object) {
    this.playList[this.count] = object;
    this.count++;
  };
  this.start = function (mainWindow, from) {
    if (!this.play) return 0;
    let index = from;
    console.log("index: " + index + " Count: " + this.count + " Loop: " + this.loop + " Play: " + this.play);
    if (index < this.count) this.playList[index].play(mainWindow);
    if (this.loop && index == this.count - 1) timeOut = setTimeout(() => this.start(mainWindow, 0), this.playList[index].duration);
    else if (!this.loop && index == this.count - 1) this.play = false;
    else if (this.play && index < this.count - 1) timeOut = setTimeout(() => this.start(mainWindow, ++index),this.playList[index].duration);
    return 0;
  };
  this.stop = function () {
    this.play = false;
    global.clearTimeout(timeOut);
    console.log("Player Halted");
  };
}

var indexOfID = function (id, arr) {
  for (let i = 0; i < arr.length; i++) {
    if (id == arr[i].id) {
      return i;
    }
  }
  return null;
};

function arrayRemove(arr, value) {
  return arr.filter(function (ele) {
    return ele.id != value;
  });
}

function getFileExtension(filename) {
  return filename.split(".").pop();
}