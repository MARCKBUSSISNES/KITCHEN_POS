const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");

let mainWindow;

function getLicensePath() {
  return path.join(app.getPath("userData"), "license.json");
}

function getDeviceId() {
  const raw = [
    os.hostname(),
    os.platform(),
    os.arch(),
    os.cpus()?.[0]?.model || "CPU",
    String(os.totalmem() || 0)
  ].join("|");

  const hash = crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();
  return "MB-" + hash.slice(0, 4) + "-" + hash.slice(4, 8) + "-" + hash.slice(8, 12) + "-" + hash.slice(12, 16);
}

function generarLicencia(deviceId) {
  const secret = "MARCKBUSINESS2026";
  let hash = 0;
  const str = deviceId + secret;

  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }

  return "LIC-" + Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
}

function validarLicencia(deviceId, license) {
  if (!license) return false;
  return String(license).trim().toUpperCase() === generarLicencia(deviceId);
}

function hasValidLicense() {
  try {
    const licensePath = getLicensePath();
    if (!fs.existsSync(licensePath)) return false;

    const saved = JSON.parse(fs.readFileSync(licensePath, "utf8"));
    const deviceId = getDeviceId();

    return saved.deviceId === deviceId && validarLicencia(deviceId, saved.license);
  } catch (error) {
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  const firstPage = hasValidLicense()
    ? path.join(__dirname, "app", "splash.html")
    : path.join(__dirname, "app", "activate.html");

  mainWindow.loadFile(firstPage);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Para depurar errores, descomenta:
  // mainWindow.webContents.openDevTools();
}

ipcMain.handle("license:get-device-id", () => {
  return getDeviceId();
});

ipcMain.handle("license:activate", async (event, license) => {
  const deviceId = getDeviceId();
  const cleanedLicense = String(license || "").trim().toUpperCase();
  const valid = validarLicencia(deviceId, cleanedLicense);

  if (!valid) {
    return { success: false, message: "Licencia inválida para esta computadora." };
  }

  const payload = {
    deviceId,
    license: cleanedLicense,
    activatedAt: new Date().toISOString()
  };

  fs.writeFileSync(getLicensePath(), JSON.stringify(payload, null, 2), "utf8");
  return { success: true };
});

ipcMain.handle("license:check", () => {
  return { valid: hasValidLicense(), deviceId: getDeviceId() };
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});
