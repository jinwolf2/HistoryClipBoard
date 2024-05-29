const { app, BrowserWindow, Tray, Menu, clipboard, globalShortcut, nativeImage, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const icon = path.join(__dirname, '../../resources/icon.png');

let mainWindow;
let tray = null;
let lastText = clipboard.readText();
let lastImage = null;
let clipboardWatcher;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 350,
        height: 450,
        show: false,
        autoHideMenuBar: true,
        resizable: false,
        frame: false,
        icon: icon,
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadURL(`file://${path.join(__dirname, '../renderer/index.html')}`);
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('blur', () => {
        mainWindow.hide();
    });
}

function createTray() {
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show', click: () => mainWindow.show() },
        { label: 'Exit', click: () => {
            app.isQuitting = true;
            app.quit();
        }}
    ]);
    tray.setToolTip('Clipboard History');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show());
}

function watchClipboard() {
    const image = clipboard.readImage();
    const text = clipboard.readText();
    const imageUrl = !image.isEmpty() ? image.toDataURL() : null;

    if (text !== lastText) {
        mainWindow.webContents.send('clipboard-change', text);
        if (fs.existsSync(text) && fs.lstatSync(text).isFile()) {
            mainWindow.webContents.send('clipboard-file', text);
        }
        lastText = text;
    }

    if (imageUrl && imageUrl !== lastImage) {
        console.log('Sending image to renderer:', imageUrl.substring(0, 100));
        mainWindow.webContents.send('clipboard-image', imageUrl);
        lastImage = imageUrl;
    }
}

function startClipboardWatch() {
    clipboardWatcher = setInterval(watchClipboard, 500);
}

app.on('ready', () => {
    createTray();
    createWindow();
    startClipboardWatch();

    if (app.dock) {
        app.dock.hide();
    }

    globalShortcut.register('CommandOrControl+Alt+V', () => {
        const cursorPos = screen.getCursorScreenPoint();
        const windowSize = mainWindow.getSize();
        const newX = cursorPos.x - (windowSize[0] / 2);
        const newY = cursorPos.y - (windowSize[1] / 2);
        mainWindow.setPosition(newX, newY);
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    clearInterval(clipboardWatcher);
});

ipcMain.on('copy-to-clipboard', (event, item) => {
    clipboard.writeText(item);
});

ipcMain.on('copy-image-to-clipboard', (event, dataUrl) => {
    const image = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(image);
});

ipcMain.on('copy-files-to-clipboard', (event, files) => {
    clipboard.writeFiles(files);
});
