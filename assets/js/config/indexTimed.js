const { ipcRenderer } = require("electron");
const connection = require("./connection");

let newTimed = document.querySelector(".todo--timed .add-new-task");
newTimed.addEventListener("click", function () {
  ipcRenderer.send("new-timed");
});

ipcRenderer.on("add-timed-note", function (e, note, notificationTime) {
  addTimedTask(note, notificationTime);
});

function addTimedTask(note, notificationTime) {
  connection
    .insert({
      into: "timed",
      values: [
        {
          note: note,
          pick_status: 0,
          pick_time: notificationTime,
        },
      ],
    })
    .then(() => showTimed());
}

function deleteTimedTask(taskId) {
  return connection
    .remove({
      from: "timed",
      where: {
        id: taskId,
      },
    })
    .then(() => showTimed());
}

function updateTimedTask(taskId, taskValue) {
  connection
    .update({
      in: "timed",
      where: {
        id: taskId,
      },
      set: {
        note: taskValue,
      },
    })
    .then(() => showTimed());
}

function showTimed() {
  let clearTimedBTN = document.querySelector(".todo--timed .clear-all");
  let timedList = document.querySelector(".todo--timed__list");
  timedList.innerHTML = "";

  connection
    .select({
      from: "timed",
    })
    .then((tasks) => {
      if (tasks.length === 0) {
        timedList.innerHTML = "<li class='empty-list'>لا توجد مهام</li>";
        clearTimedBTN.classList.remove("clear-all--show")
      } else {
        clearTimedBTN.classList.add("clear-all--show");
        clearTimedBTN.addEventListener("click", function () {
          return connection
            .remove({
              from: "timed",
            })
            .then(() => showTimed());
        });
        for (let task of tasks) {
          let listItem = document.createElement("li");
          let taskInput = document.createElement("input");
          let timeHolder = document.createElement("div");
          let deleteBTN = document.createElement("button");
          let buttonsHolder = document.createElement("div");
          let updateBTN = document.createElement("button");
          let exportBTN = document.createElement("button");

          timeHolder.classList.add("time-holder");
          buttonsHolder.classList.add("buttons-holder");

          deleteBTN.innerHTML = "حذف <i class='fas fa-trash-alt'></i>";
          updateBTN.innerHTML = "تحديث <i class='fas fa-cloud-upload-alt'></i>";
          exportBTN.innerHTML = "تصدير <i class='fas fa-file-export'></i>";

          taskInput.value = task.note;

          deleteBTN.addEventListener("click", function () {
            deleteTimedTask(task.id);
          });

          updateBTN.addEventListener("click", function () {
            updateTimedTask(task.id, taskInput.value);
          });

          exportBTN.addEventListener("click", function () {
            ipcRenderer.send("create-text", task.note);
          });

          if (task.pick_status === 1) {
            timeHolder.innerHTML =
              "تم التنبيه" + task.pick_time.toLocaleTimeString();
          } else {
            timeHolder.innerHTML =
              "سيتم التذكير في " + task.pick_time.toLocaleTimeString();
          }

          let checkInterval = setInterval(function () {
            let currentDate = new Date();

            if (task.pick_time.toString() === currentDate.toString()) {
              connection
                .update({
                  in: "timed",
                  where: {
                    id: task.id,
                  },
                  set: {
                    pick_status: 1,
                  },
                })
                .then(() => showTimed());

              ipcRenderer.send("notify", task.note);

              clearInterval(checkInterval);
            }
          }, 1000);

          buttonsHolder.appendChild(deleteBTN);
          buttonsHolder.appendChild(updateBTN);
          buttonsHolder.appendChild(exportBTN);
          listItem.appendChild(taskInput);
          listItem.appendChild(timeHolder);
          listItem.appendChild(buttonsHolder);
          timedList.appendChild(listItem);
        }
      }
    });
}
showTimed();
