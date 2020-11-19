import { ValidationNotification } from './types';

import { app, protocol, BrowserWindow, ipcMain as ipc, Notification } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";

import unhandled from "electron-unhandled";
// eslint-disable-next-line no-unused-expressions
"use strict";

const isDevelopment = process.env.NODE_ENV !== "production";

// https://github.com/sindresorhus/electron-unhandled
// Can open a dialog with a report button
unhandled({ showDialog: false });

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;
let backgroundWin: BrowserWindow | null;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } }
]);

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  });

  backgroundWin = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    backgroundWin.webContents.executeJavaScript("window.IS_WORKER = true");
    backgroundWin.loadURL(`${process.env.WEBPACK_DEV_SERVER_URL}`);
    if (!process.env.IS_TEST) {
      win.webContents.openDevTools();
      backgroundWin.webContents.openDevTools();
    }
  }
  else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
    backgroundWin.webContents.executeJavaScript("window.IS_WORKER = true;");
    backgroundWin.loadURL(`app://./index.html`);
  }

  win.on("closed", () => {
    win = null;
    if (backgroundWin) backgroundWin.close();
    backgroundWin = null;
  });

  backgroundWin.on("closed", () => {
    backgroundWin = null;
    if (win) win.close();
    win = null;
  });

  ipc.on("request", (event, data: object) => {
    console.log("request", data);
    if (backgroundWin) backgroundWin.webContents.send("request", data);
    else throw new Error("Background win is null on ipcMain request");
  });

  ipc.on("response", (event, data: object) => {
    console.log("response", data);
    if (win) win.webContents.send("response", data);
    else throw new Error("Win is null on ipcMain response");
  });

  ipc.on('validation-failure', (event, data: ValidationNotification) => {
    console.log(event, data)
    if (win) {
      // System notification
      const notification = new Notification({
        title: 'Validation error on ' + data.endpoint,
        body: 'Click for details'
      })
      notification.on('click', () => {
        if (win) {
          win.show()
          win.webContents.send('response', {
            event: 'view-validation-failure',
            id: data.id
          })
        }
      })
      notification.show()
    }
  })
}

// Allow notifications on windows, also requires the user puts the app in the start menu
if (process.platform === 'win32') {
  app.setAppUserModelId(process.execPath)
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    }
    catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  createWindow();
  app.setAccessibilitySupportEnabled(true)
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  }
  else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
