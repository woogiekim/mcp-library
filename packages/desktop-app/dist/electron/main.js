"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const PORT = 3000;
const APP_URL = `http://localhost:${PORT}`;
let mainWindow = null;
let nextProcess = null;
function waitForServer(url, timeoutMs = 30_000) {
    return new Promise((resolve, reject) => {
        const deadline = Date.now() + timeoutMs;
        const attempt = () => {
            http_1.default.get(url, (res) => {
                if (res.statusCode && res.statusCode < 500) {
                    resolve();
                }
                else {
                    retry();
                }
            }).on('error', retry);
        };
        const retry = () => {
            if (Date.now() > deadline) {
                reject(new Error(`Server at ${url} did not start within ${timeoutMs}ms`));
            }
            else {
                setTimeout(attempt, 500);
            }
        };
        attempt();
    });
}
function spawnNextServer() {
    // next build --output=standalone 으로 빌드한 결과물을 사용
    const serverJs = path_1.default.join(process.resourcesPath, 'web-app', 'server.js');
    nextProcess = (0, child_process_1.spawn)('node', [serverJs], {
        env: {
            ...process.env,
            PORT: String(PORT),
            HOSTNAME: '127.0.0.1',
            NODE_ENV: 'production',
            MCP_SERVER_URL: process.env.MCP_SERVER_URL ?? 'http://localhost:8080',
        },
        stdio: 'pipe',
    });
    nextProcess.stderr?.on('data', (d) => console.error('[next]', d.toString()));
    nextProcess.on('error', (e) => console.error('[next] spawn error:', e));
}
async function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    if (electron_1.app.isPackaged) {
        spawnNextServer();
    }
    try {
        await waitForServer(APP_URL);
    }
    catch (e) {
        console.error(e);
        electron_1.app.quit();
        return;
    }
    mainWindow.loadURL(APP_URL);
    // macOS hiddenInset: 웹 콘텐츠가 타이틀바 영역을 덮어 드래그 불가 → 상단에 드래그 핸들 주입
    if (process.platform === 'darwin') {
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow?.webContents.insertCSS(`
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 72px;
          right: 0;
          height: 28px;
          -webkit-app-region: drag;
          -webkit-user-select: none;
          z-index: 99999;
          pointer-events: auto;
        }
      `);
        });
    }
    if (!electron_1.app.isPackaged) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    mainWindow.on('closed', () => { mainWindow = null; });
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    nextProcess?.kill();
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createWindow();
});
electron_1.app.on('before-quit', () => {
    nextProcess?.kill();
});
