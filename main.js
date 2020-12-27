const electron = require ("electron");
const ejse = require ("ejs-electron");
const {app, BrowserWindow, dialog} = electron;

ejse.data({
    title: "My Excel",
    rows : 100,
    cols : 26
});

let mainWindow;

app.on("ready", function(){
    mainWindow = new BrowserWindow({
        webPreferences:{
            nodeIntegration: true
        }
    });

    mainWindow.loadFile ("index.ejs");
    mainWindow.maximize();
    mainWindow.webContents.openDevTools();
});
