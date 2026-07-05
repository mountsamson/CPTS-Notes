const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron')
const path = require('node:path')
const { Vault } = require('./vault')

const vault = new Vault()
let mainWindow = null

function buildMenu() {
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Change Vault Folder…',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              defaultPath: vault.getRoot(),
            })
            if (!result.canceled && result.filePaths[0]) {
              vault.setRoot(result.filePaths[0])
              mainWindow?.webContents.send('vault:rootChanged', vault.getRoot())
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d0d0d',
    title: 'Pentest Vault',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

function registerIpc() {
  ipcMain.handle('vault:getRoot', () => vault.getRoot())

  ipcMain.handle('vault:chooseRoot', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      defaultPath: vault.getRoot(),
    })
    if (result.canceled || !result.filePaths[0]) return vault.getRoot()
    return vault.setRoot(result.filePaths[0])
  })

  ipcMain.handle('vault:listTree', () => vault.listTree())
  ipcMain.handle('vault:readFile', (_e, relPath) => vault.readFile(relPath))
  ipcMain.handle('vault:writeFile', (_e, relPath, content) => vault.writeFile(relPath, content))
  ipcMain.handle('vault:createFile', (_e, relPath, content) => vault.createFile(relPath, content))
  ipcMain.handle('vault:createFolder', (_e, relPath) => vault.createFolder(relPath))
  ipcMain.handle('vault:rename', (_e, oldRelPath, newRelPath) => vault.rename(oldRelPath, newRelPath))
  ipcMain.handle('vault:delete', (_e, relPath) => vault.deleteToTrash(relPath))
  ipcMain.handle('vault:openInFinder', (_e, relPath) => vault.openInFinder(relPath))
  ipcMain.handle('vault:listTemplates', () => vault.listTemplates())

  ipcMain.handle('shell:openExternal', (_e, url) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
  })
}

app.whenReady().then(() => {
  registerIpc()
  buildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
