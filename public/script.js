var target = "http://192.168.88.33:3000";
// var target = "http://127.0.0.1";

var play = false;
var loop = true;
document.getElementById("brigthnessID").addEventListener("change", (event) => {
  var temp = event.target.value;
  $.post(target + "/brightness/", { brightness: temp }, function (data) {
    console.log("Parlaklık Başarılı");
    document.getElementById("label").innerHTML = data;
  });
});

$("#initButton").on("click", (e) => {
  $.post(target + "/init/", { playerName: "TestUi" }, function (data) {
    console.log(data);
    document.getElementById("label").innerHTML = data;
  });
});

$("#playButton").on("click", (e) => {
  $.post(target + "/play/", { val: play }, function (data) {
    play = !play;
    console.log("Play Başarılı");
    document.getElementById("label").innerHTML = data;
  });
});

$("#loopButton").on("click", (e) => {
  $.post(target + "/loop/", { val: loop }, function (data) {
    loop = !loop;
    console.log("loop Başarılı");
    document.getElementById("label").innerHTML = data;
  });
});

$("#sizeButton").on("click", (e) => {
  let screen = {
    width: $("#widthID").val(),
    height: $("#heightID").val(),
  };
  $.post(target + "/screenSize/", screen, function (data) {
    document.getElementById("label").innerHTML = data;
  });
});

$("#deleteButton").on("click", (e) => {
  $.post(target + "/deleteMedia/", { id: $("#mediaID").val() }, function (
    data
  ) {
    document.getElementById("label").innerHTML = data;
  });
});

$("#updateDurationButton").on("click", (e) => {
  $.post(
    target + "/updateDuration/",
    { id: $("#mediaID").val(), duration: $("#durationID").val() },
    function (data) {
      document.getElementById("label").innerHTML = data;
    }
  );
});

$("#updateListButton").on("click", (e) => {
  $.post(
    target + "/updateList/",
    { id: $("#mediaID").val(), to: $("#placeID").val() },
    function (data) {
      document.getElementById("label").innerHTML = data;
    }
  );
});
$("#playFromButton").on("click", (e) => {
  $.post(target + "/playFrom/", { val: $("#fromID").val() }, function (data) {
    document.getElementById("label").innerHTML = data;
  });
});

$("#insertSlide").on("click", (e) => {
  const selectedFile = document.getElementById("media").files[0];

  $.ajax({
    type: "POST",
    url: target + "/upload/" + selectedFile.name,
    data: selectedFile,
    processData: false,
    contentType: false,
  }).done(function (data) {
    document.getElementById("label").innerHTML = data;
  });
});
