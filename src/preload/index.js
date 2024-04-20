import { contextBridge, ipcRenderer } from 'electron'

const api = {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args))
  },
  once: (channel, func) => {
    ipcRenderer.once(channel, (event, ...args) => func(...args))
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)

