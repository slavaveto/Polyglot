const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    sendToElectron: (channel, data) => ipcRenderer.send(channel, data), // 📤 Отправка данных в Electron
    getFromElectron: (channel, callback) => ipcRenderer.once(channel, (_, data) => callback(data)), // 📥 Получение данных
});