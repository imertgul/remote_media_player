// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const electron = require("electron");
const { ipcRenderer, dialog } = electron;
var fs = require('fs');
var nodePath = require('path');
let $ = require('jquery');

ipcRenderer.on("files", function (event, data) {
  console.log(data);
  insertSlide(data[0]);
});

StartWatcher("media");

// $('#start').on("click", function() {
//   $('#start').text("Başladı");
// })


function getFileExtension(filename) {
  return filename.split(".").pop();
}

var splitPath = function (str) {
  return str.split('\\').pop().split('/').pop();
}

function StartWatcher(path) {
  var chokidar = require("chokidar");

  var watcher = chokidar.watch(path, {
    ignored: /[\/\\]\./,
    persistent: true,
  });

  function onWatcherReady() {
    console.info(
      "From here can you check for real changes, the initial scan has been completed."
    );
  }

  // Declare the listeners of the watcher
  watcher
    .on("add", function (path) {
      console.log("File", path, "has been added");
      insertSlide(path);
      // insertSlide(splitPath(path))
      // insertSlide(nodePath.basename(path))
    })
    .on("addDir", function (path) {
      console.log("Directory", path, "has been added");
    })
    .on("change", function (path) {
      console.log("File", path, "has been changed");
    })
    .on("unlink", function (path) {
      console.log("File", path, "has been removed");
    })
    .on("unlinkDir", function (path) {
      console.log("Directory", path, "has been removed");
    })
    .on("error", function (error) {
      console.log("Error happened", error);
    })
    .on("ready", onWatcherReady)
    .on("raw", function (event, path, details) {
      // This event should be triggered everytime something happens.
      console.log("Raw event info:", event, path, details);
    });
}

function insertSlide(data) {
  document.getElementById('mySlide').innerHTML = '';
  var extension = getFileExtension(data);
  if (extension == "mp4") {
    $("#mySlide").prepend(
      '<video style="display: none" width="192" height="360" autoplay><source src= ' +
        data +
        ' type="video/mp4" /></video>'
    );
  } else if (extension == "mov") {
    $("#mySlide").prepend(
      '<video style="display: none" width="192" height="360" src=' +
        data +
        ' autoplay></video>'
    );
  } else {
    $("#mySlide").prepend(
      '<img src=' + data + ' width="192" height="360" style="display: none; ">'
    );
  }
}