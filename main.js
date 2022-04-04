// Modules to control application life and create native browser window
const path = require("path");
var QRCode = require("qrcode");
const { BrowserWindow, app, ipcMain, dialog } = require("electron");
const fs = require("fs/promises");

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, "preload.js"), // use a preload script
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");
};

ipcMain.on("saveFile", (event, args) => {
  saveFile(args);
});

async function saveFile(data) {

  // Strip and convert string so it is filesystem friendly
  let filename = data.url.replace(/[^a-z0-9_\-]/gi, "_").toLowerCase();

  // Options for Dialog. Only allowing PNG Images
  const options = {
    filters: { name: "images", extensions: ["png"] },
    defaultPath: path.join(__dirname, filename + ".png"),
  };

  // Result should include a success indicator and a filepath
  let result = await dialog.showSaveDialog(mainWindow, options);

  if (result.canceled == true || result.filePath == null) {
    return
  }
  
  // Base 64 Data contains web specific prefix that needs to be stipped in order to save them
  let base64Image = data.qrcode.split(";base64,").pop();

  // write the file. No error checks here for simplicity
  await fs
    .writeFile(result.filePath, base64Image, { encoding: "base64" })
    .then((result) => {
      console.log(result);
    });
}

ipcMain.on("generateQRCode", (event, args) => {
  console.log(args);
  var errCorrRate = "high";

  // check if value is set and if value is a valid against a known set
  if (
    args.errCorrRate != null &&
    ["low", "medium", "high", "quartile"].indexOf(args.errCorrRate) > -1
  ) {
    errCorrRate = args.errCorrRate;
  }
  // Only setting errCorrRate. Color and other things are ignored for now
  const options = {
    errorCorrectionLevel: errCorrRate,
  };

  QRCode.toDataURL(args.url, options, function (err, data) {
    console.log(data);

    const dataObj = {
      url: args.url,
      errCorrRate: errCorrRate,
      qrcode: data,
    };

    // Sending the base64 image back to the browser context
    mainWindow.webContents.send("qRCodeGenerated", dataObj);
  });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
