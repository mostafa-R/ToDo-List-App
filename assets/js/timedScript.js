const { ipcRenderer } = require("electron");

let form = document.querySelector("form");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  let note = document.querySelector(".note").value;
  let pickedHoures = document.querySelector(".pick-hours").value * 3600000;
  let pickedMinutes = document.querySelector(".pick-minutes").value * 60000;
  let notificationDate = Date.now();
  notificationDate += pickedHoures + pickedMinutes;
  notificationDate = new Date(notificationDate);

  ipcRenderer.send("add-timed-note", note, notificationDate);
});
