const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getDeviceId: () => ipcRenderer.invoke("license:get-device-id"),
  activateLicense: (license) => ipcRenderer.invoke("license:activate", license),
  checkLicense: () => ipcRenderer.invoke("license:check")
});
