const { app, BrowserWindow, ipcMain, dialog } = require('electron');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    }
  });
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(0.85);
  });

   mainWindow.loadFile('index.html');
   mainWindow.maximize();
   mainWindow.webContents.setZoomFactor(2.5);

});

ipcMain.on('show-save-dialog', async (event, arg) => {
  const options = {
      type: 'info',
      title: 'Save mask',
      message: 'Do you want to save this mask?',
      buttons: ['Yes', 'No'],
      checkboxLabel: 'Do not show this message again',
      checkboxChecked: false
  };

  const userResponse = await dialog.showMessageBox(options);
  
  event.reply('save-dialog-response', {
      save: userResponse.response === 0, 
      doNotShowAgain: userResponse.checkboxChecked 
  });
});

ipcMain.handle('confirm-overwrite-dialog', async (event, arg) => {
  const options = {
      type: 'warning',
      buttons: ['Yes', 'No'],
      defaultId: 1, 
      title: 'Confirm Overwrite',
      message: arg.message,
  };

  const response = await dialog.showMessageBox(options);
  return response.response === 0;  
});

ipcMain.on('show-end-message', async (event, arg) => {
  const options = {
      type: 'info',
      title: 'Done',
      message: 'All maskes have been created'
  };

  dialog.showMessageBox(options);
  
});