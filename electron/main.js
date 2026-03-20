const { app, BrowserWindow, ipcMain, dialog, shell, nativeImage } = require('electron')
const path = require('path')
const XLSX = require('xlsx')
const fs = require('fs')
const os = require('os')
const QRCode = require('qrcode')
const http = require('http')
const https = require('https')
const { URL } = require('url')

// 设置应用名称（包括托盘名称）
app.setName('Summit胜密眼健康客户管理系统')

// 主进程日志写入文件（打包后双击 exe 无控制台，用此文件排查白屏）
// 日志位置：Windows 在 %APPDATA%\Summit胜密眼健康客户管理系统\main.log
let mainLogPath = null
function logMain(msg) {
  const s = `[${new Date().toISOString()}] ${msg}`
  try {
    if (!mainLogPath) {
      mainLogPath = path.join(app.getPath('userData'), 'main.log')
      fs.appendFileSync(mainLogPath, s + '\n', 'utf8')
      fs.appendFileSync(mainLogPath, `[${new Date().toISOString()}] Log file: ${mainLogPath}\n`, 'utf8')
    } else {
      fs.appendFileSync(mainLogPath, s + '\n', 'utf8')
    }
  } catch (e) {}
  console.log(s)
}

// 应用模式配置
const APP_MODES = {
  STABLE: 'stable',      // 稳定版
  TEST: 'test',          // 测试版
  DEVELOPMENT: 'development' // 开发版
}

// 模式对应的URL配置
const MODE_URLS = {
  [APP_MODES.STABLE]: 'https://aiforoptometry.com/media/exehtml/v1/index.html',
  [APP_MODES.TEST]: 'https://aiforoptometry.com/media/exehtml/v2/index.html',
  [APP_MODES.DEVELOPMENT]: 'http://localhost:5173'
}   

// 模式配置文件路径
const MODE_CONFIG_PATH = path.join(app.getPath('userData'), 'app-mode.json')

// 读取应用模式配置
function getAppMode() {
  try {
    if (fs.existsSync(MODE_CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(MODE_CONFIG_PATH, 'utf8'))
      // 如果配置文件存在，使用保存的模式
      if (config.mode && Object.values(APP_MODES).includes(config.mode)) {
        console.log('[App Mode] Loaded saved mode from config:', config.mode)
        return config.mode
      }
    }
  } catch (error) {
    console.error('[App Mode] Failed to read mode config:', error)
  }
  // 首次启动时默认返回稳定版
  console.log('[App Mode] First launch, using default mode: stable')
  return APP_MODES.STABLE
}

// 保存应用模式配置
function saveAppMode(mode) {
  try {
    const config = { 
      mode, 
      timestamp: Date.now(),
      savedAt: new Date().toISOString()
    }
    fs.writeFileSync(MODE_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8')
    console.log('[App Mode] Mode saved:', mode, '- will be used on next startup')
    return true
  } catch (error) {
    console.error('[App Mode] Failed to save mode config:', error)
    return false
  }
}

// 获取当前模式对应的URL
function getCurrentModeURL() {
  const currentMode = getAppMode()
  return MODE_URLS[currentMode] || MODE_URLS[APP_MODES.STABLE]
}

// 判断是否是开发模式
function isDevelopmentMode() {
  return getAppMode() === APP_MODES.DEVELOPMENT
}

// 版本标签配置
const MODE_LABELS = {
  [APP_MODES.STABLE]: 'Stable',
  [APP_MODES.TEST]: 'Test',
  [APP_MODES.DEVELOPMENT]: 'Development'
}

// 检测URL是否可用（在主进程中）
function checkUrlAvailable(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url)
      const isHttps = urlObj.protocol === 'https:'
      const client = isHttps ? https : http
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        timeout: 3000 // 3秒超时
      }
      
      const req = client.request(options, (res) => {
        // 任何响应状态码都表示服务器可用
        resolve(true)
        res.destroy()
      })
      
      req.on('error', (error) => {
        // 网络错误，服务器不可用
        console.log(`  [X] ${url} unavailable: ${error.message}`)
        resolve(false)
      })
      
      req.on('timeout', () => {
        req.destroy()
        console.log(`  [X] ${url} timeout`)
        resolve(false)
      })
      
      req.setTimeout(3000)
      req.end()
    } catch (error) {
      console.log(`  [X] ${url} check failed: ${error.message}`)
      resolve(false)
    }
  })
}

// 检测所有版本的可用性（在主进程中）
async function checkAllVersions() {
  console.log('[Version Check] Starting to check all versions availability...')
  
  const availableModes = []
  
  // 并行检测所有版本
  const checkPromises = Object.values(APP_MODES).map(async (mode) => {
    const url = MODE_URLS[mode]
    const label = MODE_LABELS[mode]
    
    console.log(`[Version Check] Checking ${label} (${mode}): ${url}`)
    const isAvailable = await checkUrlAvailable(url)
    
    if (isAvailable) {
      console.log(`  [OK] ${label} is available`)
      return { value: mode, label, url }
    } else {
      return null
    }
  })
  
  const results = await Promise.all(checkPromises)
  
  // 过滤出可用的版本
  const available = results.filter(mode => mode !== null)
  
  if (available.length > 0) {
    console.log(`[Version Check] Available versions: ${available.map(m => m.label).join(', ')}`)
  } else {
    console.log('[Version Check] No available versions detected, using default stable version')
    // 如果没有可用版本，至少提供稳定版
    available.push({
      value: APP_MODES.STABLE,
      label: MODE_LABELS[APP_MODES.STABLE],
      url: MODE_URLS[APP_MODES.STABLE]
    })
  }
  
  return available
}

// 缓存检测结果
let cachedAvailableVersions = null
let versionCheckTime = 0
const VERSION_CACHE_DURATION = 60000 // 缓存1分钟

// 获取图标路径（优先使用 .ico，如果失败则尝试 .png 或 .jpg）
// 打包后：exe 同目录或 resources 目录（extraFiles 会复制到 exe 同目录）
// 开发时：__dirname 指向 electron 目录，图标在项目根目录
function getIconPath(filename) {
  const exeDir = process.execPath ? path.dirname(process.execPath) : __dirname
  const possiblePaths = [
    path.join(exeDir, filename), // 打包后：exe 同目录（extraFiles 默认放这里）
    path.resolve(exeDir, 'resources', filename), // 打包后：resources/icon.ico
    path.resolve(__dirname, '../', filename), // 开发模式：electron/../icon.ico
    path.resolve(__dirname, '../../', filename), // 打包 asar：app.asar/../../
    path.resolve(process.resourcesPath || __dirname, filename),
    path.resolve(app.getAppPath(), '..', filename)
  ]
  
  for (const iconPath of possiblePaths) {
    if (iconPath && fs.existsSync(iconPath)) {
      console.log(`Found ${filename} at:`, iconPath)
      return iconPath
    }
  }
  
  return null
}

const iconIcoPath = getIconPath('icon.ico') || path.resolve(__dirname, '../icon.ico')
const iconPngPath = getIconPath('icon.png') || path.resolve(__dirname, '../icon.png')
const iconJpgPath = getIconPath('icon.jpg') || path.resolve(__dirname, '../icon.jpg')

let iconPath = iconIcoPath
let appIcon = null

// 按优先级尝试加载图标
const iconPaths = [
  { path: iconIcoPath, name: 'icon.ico' },
  { path: iconPngPath, name: 'icon.png' },
  { path: iconJpgPath, name: 'icon.jpg' }
]

for (const icon of iconPaths) {
  if (icon.path && fs.existsSync(icon.path)) {
    console.log(`Trying to load ${icon.name} from:`, icon.path)
    try {
      const nativeIcon = nativeImage.createFromPath(icon.path)
      if (!nativeIcon.isEmpty()) {
        appIcon = nativeIcon
        iconPath = icon.path
        const size = nativeIcon.getSize()
        console.log(`✓ ${icon.name} loaded successfully, size:`, size)
        break
      } else {
        console.warn(`✗ ${icon.name} exists but is empty`)
      }
    } catch (error) {
      console.warn(`✗ Failed to load ${icon.name}:`, error.message)
    }
  }
}

// 如果所有 nativeImage 都失败，直接使用路径字符串
if (!appIcon) {
  console.warn('All icon loading methods failed, using path string as fallback')
  appIcon = iconPath
}

function createWindow() {
  const APP_TITLE = 'Summit胜密眼健康客户管理系统'
  
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: APP_TITLE,
    icon: appIcon || iconPath, // 窗口图标和任务栏图标
    autoHideMenuBar: true,
    show: false, // 先不显示，等页面就绪再显示，避免长时间白屏
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  })

  // 超时兜底：若 12 秒内未 ready-to-show，强制显示窗口；仅未打包且开发模式时自动打开 DevTools
  let showTimeout = setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) {
      logMain('[Window] timeout: forcing show' + (!app.isPackaged && isDevelopmentMode() ? ' + DevTools' : ''))
      win.show()
      if (!app.isPackaged && isDevelopmentMode()) win.webContents.openDevTools({ mode: 'detach' })
    }
  }, 12000)

  win.once('ready-to-show', () => {
    clearTimeout(showTimeout)
    logMain('[Window] ready-to-show')
    win.show()
    win.focus()
  })
  win.once('closed', () => clearTimeout(showTimeout))

  // 确保窗口图标正确设置（Windows上特别重要，防止远程页面加载后图标丢失）
  if (appIcon) {
    win.setIcon(appIcon)
  }

  // 防止页面标题覆盖窗口标题（远程HTML的title标签会触发此事件）
  win.on('page-title-updated', (event) => {
    event.preventDefault()
    win.setTitle(APP_TITLE)
  })

  // 页面导航完成时，确保标题和图标正确
  win.webContents.on('did-navigate', () => {
    win.setTitle(APP_TITLE)
    if (appIcon) {
      win.setIcon(appIcon)
    }
  })

  // 页面加载完成后，确保标题和图标正确
  win.webContents.on('did-finish-load', () => {
    win.setTitle(APP_TITLE)
    if (appIcon) {
      win.setIcon(appIcon)
    }
  })

  // DOM准备就绪时，再次确保标题正确（远程页面可能动态修改title）
  win.webContents.on('dom-ready', () => {
    win.setTitle(APP_TITLE)
    if (appIcon) {
      win.setIcon(appIcon)
    }
  })

  // 页面框架加载完成时，确保标题正确
  win.webContents.on('did-frame-finish-load', () => {
    win.setTitle(APP_TITLE)
  })

  // 开发模式且本地未启动时：自动切到稳定版并重载，避免白屏
  let didFallbackFromDev = false
  function tryFallbackToStable(errorCode, validatedURL) {
    if (didFallbackFromDev) return false
    const isDevUrl = validatedURL && (validatedURL.startsWith('http://localhost:') || validatedURL.startsWith('http://127.0.0.1:'))
    const isConnectionRefused = errorCode === -102 // ERR_CONNECTION_REFUSED
    if (getAppMode() === APP_MODES.DEVELOPMENT && isDevUrl && isConnectionRefused) {
      didFallbackFromDev = true
      logMain('[Fallback] development URL unreachable, switching to stable and reloading')
      saveAppMode(APP_MODES.STABLE)
      const stableURL = MODE_URLS[APP_MODES.STABLE]
      win.loadURL(stableURL, {
        userAgent: win.webContents.getUserAgent() + ' Electron/SummitEyeHealth'
      }).catch((err) => {
        logMain('[Fallback] load stable failed: ' + (err && err.message))
        win.show()
        if (!app.isPackaged && isDevelopmentMode()) win.webContents.openDevTools({ mode: 'detach' })
      })
      return true
    }
    return false
  }

  // 加载失败时写日志；若为开发模式连不上本地则自动切稳定版
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    logMain(`[Load Failed] code=${errorCode} desc=${errorDescription} url=${validatedURL}`)
    if (tryFallbackToStable(errorCode, validatedURL)) return
    win.show()
    if (!app.isPackaged && isDevelopmentMode()) win.webContents.openDevTools({ mode: 'detach' })
  })

  // 生产模式：F12 打开/关闭开发者工具，便于排查白屏
  const openDevTools = () => {
    if (win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools()
    } else {
      win.webContents.openDevTools({ mode: 'detach' })
    }
  }
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      openDevTools()
      event.preventDefault()
    }
  })

  // 根据保存的模式加载对应的URL
  const currentMode = getAppMode()
  const targetURL = getCurrentModeURL()
  
  logMain(`[App Mode] mode=${currentMode} url=${targetURL}`)
  
  if (currentMode === APP_MODES.DEVELOPMENT) {
    win.loadURL(targetURL)
    if (!app.isPackaged) win.webContents.openDevTools({ mode: 'detach' })
  } else {
    // 稳定版/测试版：加载远程 URL，并自动打开 DevTools 便于排查白屏
    win.loadURL(targetURL, {
      userAgent: win.webContents.getUserAgent() + ' Electron/SummitEyeHealth'
    }).then(() => {
      logMain('[Load] loadURL resolved (request sent)')
    }).catch((err) => {
      logMain('[Load] loadURL rejected: ' + (err && err.message))
      win.show()
      if (!app.isPackaged && isDevelopmentMode()) win.webContents.openDevTools({ mode: 'detach' })
    })
    // 仅未打包且开发模式：远程页面加载后自动打开 DevTools；打包后一律不自动弹，用户可用 F12 打开
    if (!app.isPackaged && isDevelopmentMode()) {
      win.webContents.once('did-finish-load', () => {
        logMain('[Load] did-finish-load')
        win.webContents.openDevTools({ mode: 'detach' })
      })
    }
  }
}

// Windows 上设置应用用户模型 ID，确保任务栏图标正确显示
if (process.platform === 'win32') {
  app.setAppUserModelId('com.summit.eyehealth')
}

app.whenReady().then(async () => {
  // 检查是否是重启后的启动
  const isRelaunch = process.argv.includes('--relaunch')
  if (isRelaunch) {
    console.log('[App Startup] Application relaunched')
  }
  
  // 应用启动时检测所有可用版本
  console.log('[App Startup] Starting version availability check...')
  await checkAllVersions()
  
  // 获取当前模式（会读取上次保存的模式，首次启动时默认稳定版）
  const currentMode = getAppMode()
  console.log('[App Startup] Starting with mode:', currentMode)
  
  // 重新注册所有 IPC 处理器（确保重启后 IPC 通信正常）
  console.log('[App Startup] IPC handlers are registered and ready')
  
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Excel Files', extensions: ['xls', 'xlsx'] }]
  })
  return result.filePaths[0]
})

ipcMain.handle('read-excel', async (event, filePath) => {
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet)
  return data
})

ipcMain.handle('save-template', async () => {
  const result = await dialog.showSaveDialog({
    defaultPath: '批量导入模板.xlsx',
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
  })
  if (!result.canceled) {
    const workbook = XLSX.utils.book_new()
    const worksheetData = [
      ['姓名', '手机号', '性别', '出生日期', '建档日期'],
      ['张三', '13812345678', '男', '1990/1/1', '2024/11/1']
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    XLSX.writeFile(workbook, result.filePath)
    return result.filePath
  }
  return null
})

// 确保所有 ipcMain.handle 定义都在此之后
console.log('Registering ipcMain handler for print-qrcode');

function createTempHtmlFile(data) {
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, 'batch_qrcode_print.html');

  // 检测是否是A4打印（检查第一个元素是否是对象且包含qrCodeUrl，且图片是base64格式的A4尺寸）
  const isA4Print = Array.isArray(data) && data.length > 0 && 
    typeof data[0] === 'object' && data[0].qrCodeUrl && 
    data[0].qrCodeUrl.startsWith('data:image/') && data[0].qrCodeUrl.length > 100000; // A4图片通常很大

  // 处理单个二维码和批量二维码的情况
  const qrCodeImages = Array.isArray(data) 
    ? data.map((patient, index) => {
        const imgSrc = typeof patient === 'object' ? patient.qrCodeUrl : patient;
        if (isA4Print) {
          // A4打印：每页自适应A4尺寸，内容居上
          return `
            <div style="page-break-after: ${index < data.length - 1 ? 'always' : 'avoid'}; width: 100%; min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; background: #fff; box-sizing: border-box;">
              <img src="${imgSrc}" style="max-width: 100%; width: auto; height: auto; display: block;" />
            </div>
          `;
        } else {
          // 二维码打印：垂直居中
          return `
            <div style="page-break-after: always;">
              <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
                <img src="${imgSrc}" alt="患者二维码" style="max-width: 100%;" />
              </div>
            </div>
          `;
        }
      }).join('')
    : `
      <div style="text-align: center;">
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
          <img src="${data}" alt="患者二维码" style="max-width: 100%;" />
        </div>
      </div>
    `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${isA4Print ? '检查报告打印' : '打印'}</title>
        <style>
          @page { 
            size: ${isA4Print ? 'A4' : 'auto'}; 
            margin: 0; 
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
          }
          html, body {
            width: 100%;
            height: 100%;
          }
          img {
            ${isA4Print ? 'max-width: 100%; max-height: 100vh; width: auto; height: auto; object-fit: contain;' : 'max-width: 100%; height: auto;'}
          }
          @media print {
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
            }
            div {
              page-break-inside: avoid;
              width: 100%;
              height: 100%;
            }
            img {
              ${isA4Print ? 'max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain;' : 'max-width: 100%; height: auto;'}
            }
          }
        </style>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </head>
      <body>
        ${qrCodeImages}
      </body>
    </html>
  `;

  fs.writeFileSync(tempFilePath, htmlContent);
  return tempFilePath;
}

ipcMain.handle('print-qrcode', async (event, qrCodeUrl) => {
  console.log('ipcMain received print-qrcode with URL:', qrCodeUrl);
  return new Promise((resolve, reject) => {
    try {
      const tempFilePath = createTempHtmlFile(qrCodeUrl);
      
      shell.openExternal(`file://${tempFilePath}`)
        .then(() => {
          console.log('成功在浏览器中打开打印页面');
          resolve();
        })
        .catch(err => {
          console.error('打开浏览器失败:', err);
          reject(err);
        });
    } catch (error) {
      console.error('创建临时文件失败:', error);
      reject(error);
    }
  });
});

ipcMain.handle('print-report', async (event, printHTML) => {
  console.log('ipcMain received print-report');
  return new Promise((resolve, reject) => {
    try {
      // 创建临时HTML文件
      const tempFilePath = path.join(os.tmpdir(), `examination-report-${Date.now()}.html`);
      fs.writeFileSync(tempFilePath, printHTML, 'utf8');
      
      // 在系统默认浏览器中打开
      shell.openExternal(`file://${tempFilePath}`)
        .then(() => {
          console.log('成功在浏览器中打开检查报告打印页面');
          resolve();
        })
        .catch(err => {
          console.error('打开浏览器失败:', err);
          reject(err);
        });
    } catch (error) {
      console.error('创建打印文件失败:', error);
      reject(error);
    }
  });
});

ipcMain.handle('batch-print-qrcode', async (event, patientsWithQrCode) => {
  console.log('ipcMain received batch-print-qrcode with patients:', patientsWithQrCode);
  return new Promise((resolve, reject) => {
    try {
      // 确保传入的是数组
      const patientsArray = Array.isArray(patientsWithQrCode) ? patientsWithQrCode : [patientsWithQrCode];
      
      const tempFilePath = createTempHtmlFile(patientsArray);
      
      shell.openExternal(`file://${tempFilePath}`)
        .then(() => {
          console.log('成功在浏览器中打开批量打印页面');
          resolve();
        })
        .catch(err => {
          console.error('打开浏览器失败:', err);
          reject(err);
        });
    } catch (error) {
      console.error('批量打印失败:', error);
      reject(error);
    }
  });
});

ipcMain.handle('print-sales-order', async (event, salesOrderData) => {
  console.log('ipcMain received print-sales-order with data:', salesOrderData);
  return new Promise((resolve, reject) => {
    try {
      // 生成所有页面的HTML
      let allPagesHTML = '';
      
      for (let pageIndex = 0; pageIndex < salesOrderData.totalPages; pageIndex++) {
        const startIndex = pageIndex * salesOrderData.itemsPerPage;
        const endIndex = Math.min(startIndex + salesOrderData.itemsPerPage, salesOrderData.items.length);
        const pageItems = salesOrderData.items.slice(startIndex, endIndex);
        
        // 计算当前页的金额汇总
        const pageTotalAmount = pageItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        // 生成商品行HTML
        const itemsHTML = pageItems.map(item => {
          const productName = item.product_name || '未知商品';
          const productDetails = getProductDetails(item);
          const quantity = item.quantity || 1;
          const salePrice = (item.sale_price || 0).toFixed(2);
          const discount = formatDiscount(item.discount, item.sale_price);
          const totalPrice = (item.total_price || 0).toFixed(2);
          
          return `<div class="table-row">
            <div>${productName}</div>
            <div>${productDetails}</div>
            <div>${quantity}</div>
            <div>¥${salePrice}</div>
            <div>${discount}</div>
            <div>¥${totalPrice}</div>
          </div>`;
        }).join('');
        
        // 生成空行HTML
        const emptyRowsHTML = Array(Math.max(0, 10 - pageItems.length)).fill().map(() => 
          `<div class="table-row empty-row">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>`
        ).join('');
        
        // 生成金额汇总HTML
        const summaryHTML = pageIndex === salesOrderData.totalPages - 1 ? 
          `<div class="summary-row">
            <span>商品总额：</span>
            <span>¥${(salesOrderData.totalAmount || 0).toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>应收金额：</span>
            <span>¥${(salesOrderData.receivableAmount || 0).toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>收款详情：</span>
            <span>${getPaymentChannelsText(salesOrderData.paymentChannels)}</span>
          </div>
          <div class="summary-row total">
            <span>实收金额：</span>
            <span>¥${(salesOrderData.actualAmount || 0).toFixed(2)}</span>
          </div>
          ${salesOrderData.debtAmount > 0 ? 
            `<div class="summary-row debt">
              <span>欠款金额：</span>
              <span>¥${(salesOrderData.debtAmount || 0).toFixed(2)}</span>
            </div>` 
            : ''}` 
          : 
          `<div class="summary-row">
            <span>本页小计：</span>
            <span>¥${pageTotalAmount.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>（未完待续）</span>
            <span></span>
          </div>`;
        
        const pageHTML = `<div class="print-page" style="page-break-after: ${pageIndex < salesOrderData.totalPages - 1 ? 'always' : 'avoid'};">
          <div class="print-preview">
            <div class="sales-header">
              <div class="clinic-info">
                <h1>${salesOrderData.clinicName}</h1>
                <p>地址：${salesOrderData.clinicAddress}</p>
                <p>电话：${salesOrderData.clinicPhone}</p>
              </div>
              <div class="sales-info">
                <h2>销售单${salesOrderData.totalPages > 1 ? ` (第${pageIndex + 1}页/共${salesOrderData.totalPages}页)` : ''}</h2>
                <p>日期：${salesOrderData.saleDate}</p>
                <p>操作员：${salesOrderData.operator}</p>
              </div>
            </div>

            <div class="patient-info">
              <h3>患者信息</h3>
              <div class="info-grid">
                <div>姓名：${salesOrderData.patientInfo?.name || ''}</div>
                <div>性别：${salesOrderData.patientInfo?.gender === 'male' ? '男' : '女'}</div>
                <div>手机号：${salesOrderData.patientInfo?.phone || ''}</div>
                <div>出生日期：${salesOrderData.patientInfo?.birthDate || ''}</div>
              </div>
            </div>

            <div class="sales-items">
              <h3>销售明细</h3>
              <div class="items-table">
                <div class="table-header">
                  <div>商品名称</div>
                  <div>规格/详情</div>
                  <div>数量</div>
                  <div>单价</div>
                  <div>优惠价</div>
                  <div>小计</div>
                </div>
                <div class="table-body">
                  ${itemsHTML}
                  ${emptyRowsHTML}
                </div>
              </div>
            </div>

            <div class="amount-summary">
              ${summaryHTML}
            </div>

            <div class="footer-info">
              <div class="print-time">
                <p>打印时间：${salesOrderData.printTime}</p>
              </div>
            </div>
          </div>
        </div>`;
        
        allPagesHTML += pageHTML;
      }
      
      // 构建完整的HTML内容
      const printHTML = `<!DOCTYPE html>
<html>
  <head>
    <title>销售单</title>
    <style>
      /* 自定义横版纸张样式 - 240mm × 160mm */
      @page { 
        size: 240mm 160mm; 
        margin: 6mm 4mm; 
      }
      
      body { 
        margin: 0; 
        padding: 0; 
        font-family: 'Microsoft YaHei', Arial, sans-serif; 
        font-size: 13px; 
        line-height: 1.4;
        width: 232mm; /* 240mm宽度减去8mm边距 */
        height: 148mm; /* 160mm高度减去12mm边距 */
      }
      
      .print-page {
        width: 232mm;
        height: 148mm;
        margin: 0;
        padding: 0;
      }
      
      .sales-header { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 10px; 
        border-bottom: 1px solid #000; 
        padding-bottom: 6px; 
      }
      
      .clinic-info h1 { 
        font-size: 18px; 
        font-weight: bold; 
        margin: 0 0 3px 0; 
        color: #1890ff; 
      }
      
      .clinic-info p { 
        margin: 2px 0; 
        font-size: 11px; 
        color: #666; 
      }
      
      .sales-info h2 { 
        font-size: 16px; 
        font-weight: bold; 
        margin: 0 0 6px 0; 
        text-align: center; 
        color: #1890ff; 
      }
      
      .sales-info p { 
        margin: 2px 0; 
        font-size: 11px; 
      }
      
      .patient-info, .sales-items, .amount-summary { 
        margin-bottom: 10px; 
      }
      
      .patient-info h3, .sales-items h3 { 
        font-size: 15px; 
        font-weight: bold; 
        margin: 0 0 6px 0; 
        border-bottom: 1px solid #1890ff; 
        padding-bottom: 3px; 
        color: #1890ff; 
      }
      
      .info-grid { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 6px; 
        font-size: 12px;
      }
      
      .items-table { 
        border: 1px solid #d9d9d9; 
        margin-top: 6px; 
        font-size: 11px;
        height: 180px; /* 固定高度 - 调整为适应10个条目，增加更多空间 */
        overflow: hidden;
      }
      
      .table-header { 
        display: grid; 
        grid-template-columns: 1.2fr 1.5fr 0.6fr 0.6fr 0.6fr 0.8fr; 
        background: #f5f5f5; 
        font-weight: bold; 
        border-bottom: 1px solid #d9d9d9; 
        height: 28px; /* 固定表头高度 - 增加高度 */
      }
      
      .table-body {
        height: 152px; /* 固定表格体高度 - 调整为适应10个条目，增加更多空间 */
        overflow: hidden;
      }
      
      .table-row { 
        display: grid; 
        grid-template-columns: 1.2fr 1.5fr 0.6fr 0.6fr 0.6fr 0.8fr; 
        border-bottom: 1px solid #f0f0f0; 
        height: 15.2px; /* 固定行高，152px / 10行 = 15.2px */
      }
      
      .empty-row {
        background: #fafafa;
      }
      
      .table-header > div, .table-row > div { 
        padding: 2px 3px; 
        border-right: 1px solid #f0f0f0; 
        display: flex; 
        align-items: center; 
        word-break: break-word; 
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .table-header > div:last-child, .table-row > div:last-child { 
        border-right: none; 
      }
      
      .summary-row { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 4px; 
        padding: 2px 0; 
        font-size: 12px;
      }
      
      .summary-row.total { 
        font-weight: bold; 
        font-size: 14px; 
        border-top: 1px solid #1890ff; 
        padding-top: 6px; 
        margin-top: 6px; 
        color: #1890ff; 
      }
      
      .summary-row.debt { 
        color: #ff4d4f; 
        font-weight: bold; 
      }
      
      .footer-info { 
        margin-top: 15px; 
        display: flex; 
        justify-content: flex-end; 
        border-top: 1px solid #d9d9d9; 
        padding-top: 10px; 
        font-size: 11px;
      }
      
      .print-time { 
        text-align: right; 
        font-size: 10px; 
        color: #999; 
      }
      
      /* 确保内容不超出自定义横版页面 */
      .print-preview {
        max-width: 232mm;
        max-height: 148mm;
        overflow: hidden;
      }
      
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .print-page {
          page-break-inside: avoid;
        }
      }
    </style>
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
          setTimeout(function() {
            window.close();
          }, 1000);
        }, 500);
      };
    </script>
  </head>
  <body>
    ${allPagesHTML}
  </body>
</html>`;

      // 创建临时HTML文件
      const tempFilePath = path.join(os.tmpdir(), `sales-order-${Date.now()}.html`);
      
      fs.writeFileSync(tempFilePath, printHTML);
      
      shell.openExternal(`file://${tempFilePath}`)
        .then(() => {
          console.log('成功在浏览器中打开销售单打印页面');
          resolve();
        })
        .catch(err => {
          console.error('打开浏览器失败:', err);
          reject(err);
        });
    } catch (error) {
      console.error('销售单打印失败:', error);
      reject(error);
    }
  });
});

// 辅助函数
function getProductDetails(item) {
  const details = [];
  
  if (item.category === 'lens') {
    if (item.sphere !== undefined) details.push(`球镜: ${Number(item.sphere).toFixed(2)}D`);
    if (item.cylinder !== undefined && item.cylinder !== 0) details.push(`柱镜: ${Number(item.cylinder).toFixed(2)}D`);
    if (item.axis !== undefined) details.push(`轴位: ${item.axis}°`);
    if (item.eye) details.push(`眼别: ${item.eye === 'left' ? '左眼' : '右眼'}`);
  } else if (item.category === 'frame') {
    if (item.model) details.push(`型号: ${item.model}`);
    if (item.material) details.push(`材质: ${item.material}`);
  } else if (item.category === 'soft_contact') {
    if (item.type) details.push(`类型: ${item.type}`);
    if (item.sphere !== undefined) details.push(`球镜: ${Number(item.sphere).toFixed(2)}D`);
    if (item.batch_number) details.push(`批号: ${item.batch_number}`);
  } else if (item.category === 'solution') {
    if (item.type) details.push(`类型: ${item.type}`);
    if (item.specification) details.push(`规格: ${item.specification}`);
    if (item.batch_number) details.push(`批号: ${item.batch_number}`);
  } else if (item.category === 'non_medical') {
    if (item.production_date) details.push(`生产日期: ${item.production_date}`);
    if (item.expiry_date) details.push(`到期日期: ${item.expiry_date}`);
  } else if (item.category === 'service') {
    if (item.remark) details.push(`备注: ${item.remark}`);
  }
  
  return details.length > 0 ? details.join(', ') : '无';
}

function formatDiscount(discount, sale_price) {
  if (discount === null || discount === undefined || discount === 1) {
    return `¥${sale_price?.toFixed(2) || '0.00'}`;
  }
  if (discount === 0) return '免费';
  const discountedPrice = (sale_price || 0) * discount;
  return `¥${discountedPrice.toFixed(2)}`;
}

// 获取收款渠道信息文本
function getPaymentChannelsText(paymentChannels) {
  const channels = paymentChannels || {};
  const channelList = [];
  
  if (channels.cash_amount && channels.cash_amount > 0) {
    channelList.push(`现金 ¥${Number(channels.cash_amount).toFixed(2)}`);
  }
  if (channels.alipay_amount && channels.alipay_amount > 0) {
    channelList.push(`支付宝 ¥${Number(channels.alipay_amount).toFixed(2)}`);
  }
  if (channels.wechat_amount && channels.wechat_amount > 0) {
    channelList.push(`微信 ¥${Number(channels.wechat_amount).toFixed(2)}`);
  }
  if (channels.bank_amount && channels.bank_amount > 0) {
    channelList.push(`银行卡 ¥${Number(channels.bank_amount).toFixed(2)}`);
  }
  if (channels.meituan_amount && channels.meituan_amount > 0) {
    channelList.push(`美团 ¥${Number(channels.meituan_amount).toFixed(2)}`);
  }
  if (channels.douyin_amount && channels.douyin_amount > 0) {
    channelList.push(`抖音 ¥${Number(channels.douyin_amount).toFixed(2)}`);
  }
  if (channels.other_amount && channels.other_amount > 0) {
    channelList.push(`其他 ¥${Number(channels.other_amount).toFixed(2)}`);
  }
  
  return channelList.length > 0 ? channelList.join(', ') : '未记录';
}

// IPC处理器：获取当前应用模式
ipcMain.handle('get-app-mode', async () => {
  const mode = getAppMode()
  return { mode, url: getCurrentModeURL() }
})

// IPC处理器：获取可用版本列表
ipcMain.handle('get-available-versions', async () => {
  const now = Date.now()
  
  // 如果缓存有效，直接返回
  if (cachedAvailableVersions && (now - versionCheckTime) < VERSION_CACHE_DURATION) {
    console.log('[Version Check] Using cached version check results')
    return cachedAvailableVersions
  }
  
  // 重新检测
  cachedAvailableVersions = await checkAllVersions()
  versionCheckTime = now
  
  return cachedAvailableVersions
})

// IPC处理器：切换应用模式并重启
ipcMain.handle('switch-app-mode', async (event, newMode) => {
  console.log('[App Mode] Received mode switch request:', newMode)
  
  // 验证模式
  if (!Object.values(APP_MODES).includes(newMode)) {
    return { success: false, error: 'Invalid mode' }
  }
  
  // 获取当前模式
  const currentMode = getAppMode()
  console.log('[App Mode] Current mode:', currentMode, '-> New mode:', newMode)
  
  // 如果模式相同，不需要重启
  if (currentMode === newMode) {
    console.log('[App Mode] Mode unchanged, no restart needed')
    return { success: true, message: 'Mode unchanged, no restart needed', restart: false }
  }
  
  // 保存新模式（下次启动时会使用这个模式）
  const saved = saveAppMode(newMode)
  if (!saved) {
    return { success: false, error: 'Failed to save mode config' }
  }
  
  console.log('[App Mode] Mode saved successfully, will restart application...')
  
  // 重启应用（重启后会使用新保存的模式）
  // 注意：app.relaunch() 会启动新的主进程实例，当前进程会退出
  // 新的主进程会重新执行整个 main.js，包括重新注册所有 IPC 处理器
  // 所以 IPC 通信不会受影响，只是会短暂中断直到新进程启动完成
  setTimeout(() => {
    console.log('[App Mode] Relaunching application...')
    app.relaunch({
      args: process.argv.slice(1).concat(['--relaunch'])
    })
    app.exit(0)
  }, 300) // 给前端一点时间接收响应
  
  return { success: true, message: 'Mode switched, application will restart', restart: true }
})