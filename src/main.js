const { app, BrowserWindow } = require("electron");
const { getVideoDurationInSeconds } = require('get-video-duration');
const fs = require("fs");
var express = require("express"),
  path = require("path"),
  service = express();
var busboy = require('connect-busboy');

//***************************************************************//
//***************************************************************//
//***********************   ELECTRON  ***************************//
//***************************************************************//
//***************************************************************//
let mainWindow;
let defaultDuration = "1000"

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
}).then(() => {
  mainWindow.webContents.on("did-finish-load", () => {
    fs.readdir(path.join(__dirname, "../app/media"), function (err, dir) {
      if (err) console.log(err);
      else {
        // mainWindow.webContents.send("files", dir);
        console.log("Files found in local: " + dir);
        for (let index = 0; index < dir.length; index++) {
          var extension = getFileExtension(dir[index]);
          let temp = path.join(__dirname, "../app/media/") + dir[index];
          if (extension == "mp4" || extension == "mov") {
            getVideoDurationInSeconds(temp).then((duration) => {
              MyPlayer.add(new Media(temp, (duration*1000).toString()));
            });
          } else MyPlayer.add(new Media(temp, defaultDuration));
        }
      }
    });
  });
});

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
  express.urlencoded(),
  busboy()
);
service.use(express.json());

service.post("/upload/:filename", function (req, res) {
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
      console.log("Uploading: " + filename); 
      filename = path.resolve("app/media", filename.replace(/\s/g, ""));
      fstream = fs.createWriteStream(filename);
      file.pipe(fstream);
      fstream.on('close', function () {
        console.log("Tamamlandi... " + filename);
        var extension = getFileExtension(filename);
        if (extension == "mp4" || extension == "mov") {
          getVideoDurationInSeconds(filename).then((duration) => {
            console.log(duration)     
            MyPlayer.add(new Media(filename, (duration*1000).toString()));
          })
        }
        else
          MyPlayer.add(new Media(filename, defaultDuration));
        res.end(JSON.stringify(MyPlayer));
      });
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
service.post("/stop", function (req, res) {
  console.log("Player halted by: " + req.body.playerName);
  MyPlayer.stop();
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
  this.playingIndex = 0;
  this.brightness = "10";
  this.screenSize = { height: 1080, width: 1920 };
  this.playList = [];
  this.add = function (object) {
    this.playList[this.count] = object;
    this.count++;
  };
  this.start = function (mainWindow, from) {
    if (!this.play) return 0;
    this.playingIndex = from;
    console.log("index: " + this.playingIndex + " Count: " + this.count + " Loop: " + this.loop + " Play: " + this.play);
    if (this.playingIndex < this.count) this.playList[this.playingIndex].play(mainWindow);
    if (this.loop && this.playingIndex == this.count - 1) timeOut = setTimeout(() => this.start(mainWindow, 0), this.playList[this.playingIndex].duration);
    else if (!this.loop && this.playingIndex == this.count - 1) this.play = false;
    else if (this.play && this.playingIndex < this.count - 1) timeOut = setTimeout(() => this.start(mainWindow, ++this.playingIndex),this.playList[this.playingIndex].duration);
    return 0;
  };
  this.stop = function () {
    this.play = false;
    global.clearTimeout(timeOut);
    mainWindow.webContents.send("blank");
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