const { create } = require("domain");
const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog,
  Notification,
  Tray,
} = require("electron");
const fs = require("fs");
const path = require("path");
const appPath = app.getPath("userData");

let mainWindow;
let addWindow;
let addTimedWindow;
let addImagedWindow;
let tray = null;

process.env.NODE_ENV = "production";

app.on("ready", function () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");
  mainWindow.on("closed", function () {
    app.quit();
  });

  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);

  mainWindow.on("minimize", function (event) {
    event.preventDefault();
    mainWindow.hide();
    tray = createTray();
  });

  mainWindow.on("restore", function (event) {
    mainWindow.show();
    tray.destroy();
  });
});

function createTray() {
  let iconPath = path.join(__dirname, "./assets/images/icon.png");
  let appIcon = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate(iconMenuTemplate);
  appIcon.on("double-click", function (event) {
    mainWindow.show();
  });
  appIcon.setToolTip("تطبيق اداره المهام");
  appIcon.setContextMenu(contextMenu);
  return appIcon;
}

const iconMenuTemplate = [
  {
    label: "فتح",
    click() {
      mainWindow.show();
    },
  },
  {
    label: "اغلاق",
    click() {
      app.quit();
    },
  },
];

const mainMenuTemplate = [
  {
    label: "القائمة",
    submenu: [
      {
        label: "أضافة مهمة",
        click() {
          initAddWindow();
        },
      },
      {
        label: "أضافة مهمة مؤقتة",
        click() {
          createTimedWindow();
        },
      },
      {
        label: "اضافة مهمة مع صورة",
        click() {
          createImagedWindow();
        },
      },
      {
        label: "خروج",
        accelerator: process.platform === "darwin" ? "cmd+Q" : "ctrl+Q",
        click() {
          app.quit();
        },
      },
    ],
  },
];

if (process.platform === "darwin") {
  mainMenuTemplate.unshift({});
}

if (process.env.NODE_ENV !== "production") {
  mainMenuTemplate.push({
    label: "ادوات المطور",
    submenu: [
      {
        label: "فتح واغلاق ادوات المطور",
        accelerator: process.platform === "darwin" ? "cmd+D" : "ctrl+D",
        click() {
          mainWindow.toggleDevTools();
        },
      },
      {
        label: "اعاده تحميل التطبيق",
        role: "reload",
      },
    ],
  });
}

function initAddWindow() {
  addWindow = new BrowserWindow({
    width: 400,
    height: 250,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  addWindow.loadFile("./views/normalTask.html");

  addWindow.on("closed", (e) => {
    e.preventDefault();
    addWindow = null;
  });
  addWindow.removeMenu();
}

ipcMain.on("add-normal-task", function (e, item) {
  mainWindow.webContents.send("add-normal-task", item);
  addWindow.close();
});

ipcMain.on("new-normal", function (e) {
  initAddWindow();
});

ipcMain.on("create-text", function (e, note) {
  let dest = Date.now() + "-task.text";
  dialog
    .showSaveDialog({
      title: "اختار مكان حفظ الملف",
      defaultPath: path.join(__dirname, "./" + dest),
      buttonLabel: "Save",
      filters: [
        {
          name: "Text Files",
          extensions: ["text"],
        },
      ],
    })
    .then((file) => {
      if (!file.canceled) {
        fs.writeFile(file.filePath.toString(), note, function (err) {
          if (err) throw err;
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

function createTimedWindow() {
  addTimedWindow = new BrowserWindow({
    width: 400,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      webContents: false,
      contextIsolation: false,
    },
  });
  addTimedWindow.loadFile(path.join(__dirname, "./views/timedTask.html"));

  addTimedWindow.on("closed", (e) => {
    e.preventDefault();
    addTimedWindow = null;
  });

  addTimedWindow.removeMenu();
}

ipcMain.on("add-timed-note", function (e, note, notificationTime) {
  mainWindow.webContents.send("add-timed-note", note, notificationTime);
  addTimedWindow.close();
});

ipcMain.on("notify", function (e, taskValue) {
  new Notification({
    title: "لديك تنبيه من مهامك",
    body: taskValue,
    icon: path.join(__dirname, "./assets/images/icon.png"),
  }).show();
});

ipcMain.on("new-timed", function (e) {
  createTimedWindow();
});

function createImagedWindow() {
  addImagedWindow = new BrowserWindow({
    width: 400,
    height: 420,
    webPreferences: {
      nodeIntegration: true,
      webContents: false,
      contextIsolation: false,
    },
  });

  addImagedWindow.loadFile(path.join(__dirname, "./views/imagedTask.html"));

  addImagedWindow.on("closed", (e) => {
    e.preventDefault();
    addImagedWindow = null;
  });

  addImagedWindow.removeMenu();
}

ipcMain.on("upload-image", function (event) {
  dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "images", extensions: ["jpg", "png", "gif"] }],
    })
    .then((result) => {
      event.sender.send("open-file", result.filePaths, appPath);
    });
});

ipcMain.on("add-imaged-task", function (e, note, imgURI) {
  mainWindow.webContents.send("add-imaged-task", note, imgURI);
  addImagedWindow.close();
});

ipcMain.on("new-imaged", function (e) {
  createImagedWindow();
});
