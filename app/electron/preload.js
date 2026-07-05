const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('vaultAPI', {
  getRoot: () => ipcRenderer.invoke('vault:getRoot'),
  chooseRoot: () => ipcRenderer.invoke('vault:chooseRoot'),
  listTree: () => ipcRenderer.invoke('vault:listTree'),
  readFile: (relPath) => ipcRenderer.invoke('vault:readFile', relPath),
  writeFile: (relPath, content) => ipcRenderer.invoke('vault:writeFile', relPath, content),
  createFile: (relPath, content) => ipcRenderer.invoke('vault:createFile', relPath, content),
  createFolder: (relPath) => ipcRenderer.invoke('vault:createFolder', relPath),
  rename: (oldRelPath, newRelPath) => ipcRenderer.invoke('vault:rename', oldRelPath, newRelPath),
  deleteItem: (relPath) => ipcRenderer.invoke('vault:delete', relPath),
  openInFinder: (relPath) => ipcRenderer.invoke('vault:openInFinder', relPath),
  listTemplates: () => ipcRenderer.invoke('vault:listTemplates'),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  onRootChanged: (callback) => {
    const listener = (_event, newRoot) => callback(newRoot)
    ipcRenderer.on('vault:rootChanged', listener)
    return () => ipcRenderer.removeListener('vault:rootChanged', listener)
  },
})
