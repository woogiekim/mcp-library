import { app, BrowserWindow, shell } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import http from 'http'

const PORT = 3000
const APP_URL = `http://localhost:${PORT}`

let mainWindow: BrowserWindow | null = null
let nextProcess: ChildProcess | null = null

function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs
    const attempt = () => {
      http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve()
        } else {
          retry()
        }
      }).on('error', retry)
    }
    const retry = () => {
      if (Date.now() > deadline) {
        reject(new Error(`Server at ${url} did not start within ${timeoutMs}ms`))
      } else {
        setTimeout(attempt, 500)
      }
    }
    attempt()
  })
}

function spawnNextServer() {
  // next build --output=standalone 으로 빌드한 결과물을 사용
  const serverJs = path.join(process.resourcesPath, 'web-app', 'server.js')
  nextProcess = spawn('node', [serverJs], {
    env: {
      ...process.env,
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
      MCP_SERVER_URL: process.env.MCP_SERVER_URL ?? 'http://localhost:8080',
    },
    stdio: 'pipe',
  })
  nextProcess.stderr?.on('data', (d: Buffer) => console.error('[next]', d.toString()))
  nextProcess.on('error', (e) => console.error('[next] spawn error:', e))
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (app.isPackaged) {
    spawnNextServer()
  }

  try {
    await waitForServer(APP_URL)
  } catch (e) {
    console.error(e)
    app.quit()
    return
  }

  mainWindow.loadURL(APP_URL)

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
      `)
    })
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  nextProcess?.kill()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('before-quit', () => {
  nextProcess?.kill()
})
