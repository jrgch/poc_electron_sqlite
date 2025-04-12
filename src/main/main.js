const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { dialog } = require('electron');


let db;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    win.loadFile('src/renderer/index.html')
}

app.whenReady().then(() => {

    let configPath;
    let fullDbPath;

    if (app.isPackaged) {
        configPath = path.join(process.resourcesPath, "db-config.json");
    } else {
        configPath = path.join(__dirname, "..", "..", "db-config.json");
    }

    try {
        const configData = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configData);

        if (!config.dbPath || !config.dbName) {
            throw new Error('Faltan parámetros dbPath o dbName en el archivo de configuración.');
        }

        fullDbPath = path.join(config.dbPath, config.dbName);
    } catch (err) {
        console.error('Error al leer db-config.json:', err.message);
        dialog.showErrorBox(
            'Error de Configuración',
            'No se pudo leer la configuración de la base de datos desde db-config.json.\nVerifica que el archivo exista y tenga el formato correcto.'
        );
        app.quit();
        return;
    }

    const dbDir = path.dirname(fullDbPath);

    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new sqlite3.Database(fullDbPath, (err) => {
        if (err) {
            console.error('Error al abrir la base de datos:', err.message);
            dialog.showErrorBox('Error', 'No se pudo abrir la base de datos.');
            app.quit();
            return;
        }

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
    });

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