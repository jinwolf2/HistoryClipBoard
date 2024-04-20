const { app, BrowserWindow, Tray, Menu, clipboard, globalShortcut, nativeImage, ipcMain } = require('electron');
const path = require('path');
const icon = path.join(__dirname, '../../resources/icon.png');

let mainWindow;
let tray = null;
let lastText = clipboard.readText();
let lastImage = null; // Almacena la última imagen procesada para comparar
let clipboardWatcher; // Define la variable aquí para evitar ReferenceError

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
        { label: 'Mostrar', click: () => mainWindow.show() },
        { label: 'Salir', click: () => {
            app.isQuitting = true;
            app.quit();
        }}
    ]);

    tray.setToolTip('ClipBoard History');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
}

function watchClipboard() {
    const image = clipboard.readImage();
    const text = clipboard.readText();
    const imageUrl = !image.isEmpty() ? image.toDataURL() : null;

    if (text !== lastText) {
        mainWindow.webContents.send('clipboard-change', text);
        lastText = text;
    }

    if (imageUrl && imageUrl !== lastImage) {
        mainWindow.webContents.send('clipboard-image', imageUrl);
        lastImage = imageUrl;
    }
}

function startClipboardWatch() {
    if (clipboardWatcher) clearInterval(clipboardWatcher);
    clipboardWatcher = setInterval(watchClipboard, 500);
}

app.on('ready', () => {
    createTray();
    createWindow();
    startClipboardWatch();

    // Ocultar la aplicación del Dock en macOS
    if (app.dock) {
        app.dock.hide();
    }

    globalShortcut.register('CommandOrControl+Alt+V', () => {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    clearInterval(clipboardWatcher); // Asegúrate de limpiar el intervalo al salir
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
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
