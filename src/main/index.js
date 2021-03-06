import { app, BrowserWindow, ipcMain, dialog } from 'electron'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    title: '洋芋田加密音乐转换'
    height: 500,
    width: 800,
    frame: false,
    fullscreenable: false,
    resizable: false,
    show: false
  })

  mainWindow.loadURL(winURL)
  
  mainWindow.on('ready-to-show', function () {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.on('minimize', function() {
  mainWindow.minimize();
})

ipcMain.on('exit', function() {
  mainWindow.close();
})

ipcMain.on('choose-source-folder', function(event) {
  dialog.showOpenDialog({
    title: "选择文件夹",
    properties: ['openDirectory']
  }, function (folder) {
    if (folder) {
      event.sender.send('source-selected', folder[0])
    }
  })
})

ipcMain.on('choose-save-folder', function(event) {
  dialog.showOpenDialog({
    title: "选择文件夹",
    properties: ['openDirectory']
  }, function (folder) {
    if (folder) {
      event.sender.send('save-selected', folder[0])
    }
  })
})

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
