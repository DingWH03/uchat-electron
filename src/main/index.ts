import { app, shell, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.jpg?asset'
import { Apis } from './api/index.js'
import { getSessionId } from './config/session'
import { performLogout } from './api/anthentication'
import { initDB, registerLocalDBIpcHandlers, closeDB } from './localDB'

const login_width = 1000
const login_height = 700

// 系统托盘相关变量
let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let blinkInterval: NodeJS.Timeout | null = null

function createLoginWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: login_width,
    height: login_height,
    show: false,
    autoHideMenuBar: true,
    frame: true,
    // transparent: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 窗口关闭时隐藏而不是退出（macOS除外）
  window.on('close', (event) => {
    if (process.platform !== 'darwin') {
      event.preventDefault()
      window.hide()
    }
  })

  return window
}

// 创建系统托盘
function createTray(win: BrowserWindow): void {
  const trayIcon = nativeImage.createFromPath(icon)
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))
  tray.setToolTip('我的应用')

  // 创建上下文菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开主窗口',
      click: () => win.show()
    },
    {
      label: '退出',
      click: async () => {
        if (getSessionId() != null) {
          await performLogout()
        }
        if (mainWindow) {
          mainWindow.destroy() // 强制销毁
        }
        tray?.destroy()
        closeDB() // 关闭数据库连接
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  // 点击事件处理
  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })
}

// 闪烁托盘图标
function startBlinking(): void {
  if (!tray) return

  const trayIcon = nativeImage.createFromPath(icon)
  const blankIcon = nativeImage.createEmpty()
  let showIcon = true

  stopBlinking() // 先停止之前的闪烁

  blinkInterval = setInterval(() => {
    tray?.setImage(showIcon ? trayIcon : blankIcon)
    showIcon = !showIcon
  }, 500)
}

// 停止闪烁
function stopBlinking(): void {
  if (blinkInterval) {
    clearInterval(blinkInterval)
    blinkInterval = null
  }
  if (tray) {
    tray.setImage(nativeImage.createFromPath(icon))
  }
}

// 显示通知
function showNotification(title: string, body: string): void {
  if (Notification.isSupported()) {
    new Notification({
      title,
      body,
      silent: true // 我们用自己的声音提示
    }).show()
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  mainWindow = createLoginWindow()
  createTray(mainWindow)

  // 初始化sqlite
  initDB()

  // 注册localDB ipcHandle
  registerLocalDBIpcHandlers()

  // 初始化API
  Apis(mainWindow)

  // 监听来自渲染进程的消息通知
  ipcMain.on('new-message', (_, message) => {
    console.log('收到新消息:', message)
    startBlinking()
    showNotification('新消息', message.content || '您收到一条新消息')
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createLoginWindow()
      if (tray) createTray(mainWindow)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 不再直接退出，由托盘管理
  }
})

// 应用退出时关闭数据库
app.on('before-quit', () => {
  console.log('应用即将退出，正在保存数据...')
  closeDB()
})

// 确保在进程退出时关闭数据库
process.on('exit', () => {
  console.log('进程退出，关闭数据库连接')
  closeDB()
})

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
  closeDB()
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason, 'at', promise)
  closeDB()
  process.exit(1)
})
