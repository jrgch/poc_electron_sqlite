const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let db;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    win.loadFile('index.html')
}

app.whenReady().then(() => {
    db = new sqlite3.Database('personas.db');
    const personas = [
        ["Juan", 30],
        ["Pedro", 33],
        ["Martín", 24],
        ["Alejandra", 36]
    ];

    db.run(
        `CREATE TABLE IF NOT EXISTS personas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            edad INTEGER
        )`,
        () => {
            db.get("SELECT COUNT(*) as count FROM personas", (err, row) => {
                if (row.count === 0) {
                    personas.forEach(persona => {
                        db.run("INSERT INTO personas (nombre, edad) VALUES (?, ?)", persona);
                    });
                }
            });
        }
    );
    createWindow()
})

ipcMain.handle('get-personas', async () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM personas", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
});

ipcMain.handle('add-persona', async (_, persona) => {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO personas (nombre, edad) VALUES (?, ?)",
            [persona.nombre, persona.edad],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...persona });
            }
        );
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit()
})