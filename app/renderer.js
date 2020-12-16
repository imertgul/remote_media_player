// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const electron = require("electron");
const { ipcRenderer } = electron;
let $ = require("jquery");
var screen = { height: 384, width: 192 };

// StartWatcher("media");

// ************** Media ****************
function insertSlide(data) {
  document.getElementById("mySlide").innerHTML = "";
  var extension = getFileExtension(data);
  if (extension == "mp4") {
    $("#mySlide").prepend(
      '<video class="mySlides" style="display: none" width=' +
        screen.width +
        " height=" +
        screen.height +
        " autoplay loop><source src= " +
        data +
        ' type="video/mp4" /></video>'
    );
  } else if (extension == "mov") {
    $("#mySlide").prepend(
      '<video class="mySlides" style="display: none" width=' + screen.width + " height=" + screen.height + " src=" + data + " autoplay loop></video>"
    );
  } else {
    $("#mySlide").prepend('<img class="mySlides" src=' + data + " width=" + screen.width + " height=" + screen.height + ' style="display: none; ">');
  }
}

var setBrightness = function (data) {
  $("#mySlide").css({
    opacity: data / 10,
  });
};

function getFileExtension(filename) {
  return filename.split(".").pop();
}

// ***********************************
// ************** ipc ****************
// ***********************************

ipcRenderer.on("file", function (event, data) {
  insertSlide(data);
});

ipcRenderer.on("blank", function (event, data) {
  document.getElementById("mySlide").innerHTML = "";
});

ipcRenderer.on("brightness", function (event, data) {
  setBrightness(data);
});

ipcRenderer.on("screenSize", function (event, data) {
  screen.width = data.width;
  screen.height = data.height;
});
