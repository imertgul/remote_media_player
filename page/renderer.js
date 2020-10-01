// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const electron = require("electron");
const { ipcRenderer } = electron;
let $ = require('jquery');

ipcRenderer.on("files", function (event, data) {
  console.log(data);
  insertSlide(data[0]);
});

function insertSlide(data) {
  document.getElementById('mySlide').innerHTML = '';
  var extension = getFileExtension(data);
  if (extension == "mp4") {
    $("#mySlide").prepend(
      '<video style="display: none" autoplay><source src= ./media/"' +
        data +
        '" type="video/mp4" /></video>'
    );
  } else if (extension == "mov") {
    $("#mySlide").prepend(
      '<video width=" style="display: none" src=./media/"' +
        data +
        '" autoplay></video>'
    );
  } else {
    $("#mySlide").prepend(
      '<img src=./media/' + data + ' style="display: none; ">'
    );
  }
}

function getFileExtension(filename) {
  return filename.split(".").pop();
}
