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

// StartWatcher("media");

// ************** Media ****************
function insertSlide(data) {
  document.getElementById('mySlide').innerHTML = '';
  var extension = getFileExtension(data);
  if (extension == "mp4") {
    $("#mySlide").prepend(
      '<video class="mySlides" style="display: none" width="192" height="360" autoplay loop><source src= ' +
        data +
        ' type="video/mp4" /></video>'
    );
  } else if (extension == "mov") {
    $("#mySlide").prepend(
      '<video class="mySlides" style="display: none" width="192" height="360" src=' +
        data +
        ' autoplay loop></video>'
    );
  } else {
    $("#mySlide").prepend(
      '<img class="mySlides" src=' + data + ' width="192" height="360" style="display: none; ">'
    )
  }
}

// ************** Media ****************

var setBrightness = function (data) {
  $("#mySlide").css({
    opacity: data / 10
  });
}

function getFileExtension(filename) {
  return filename.split(".").pop();
}

var splitPath = function (str) {
  return str.split('\\').pop().split('/').pop();
}

ipcRenderer.on("file", function (event, data) {
  console.log(data);
  insertSlide(data);
});
ipcRenderer.on("brightness", function (event, data) {
  setBrightness(data);
});

