const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => {
        const validChannels = ['copy-to-clipboard', 'copy-image-to-clipboard', 'copy-files-to-clipboard'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        const validChannels = ['clipboard-change', 'clipboard-image', 'clipboard-files', 'clipboard-file'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});
