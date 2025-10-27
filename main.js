const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage } = require('electron');
const path = require('path');

let clipboardy = null;
async function loadClipboardy() {
  if (!clipboardy) {
    clipboardy = await import('clipboardy');
  }
  return clipboardy;
}

let mainWindow = null;
let tray = null;
let isListening = false;

// إنشاء النافذة الرئيسية
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 450,
    height: 650,
  show: true,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    }
  });

  mainWindow.loadFile('renderer/index.html');

  // إخفاء النافذة عند فقدان التركيز
  mainWindow.on('blur', () => {
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });

  // فتح DevTools في وضع التطوير (اختياري)
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

// إنشاء أيقونة Tray
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Voice Typer',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'فتح لوحة التحكم',
      click: () => {
        showWindow();
      }
    },
    {
      label: 'بدء/إيقاف الاستماع (Ctrl+Alt+M)',
      click: () => {
        toggleListening();
      }
    },
    { type: 'separator' },
    {
      label: 'حول التطبيق',
      click: () => {
        showAbout();
      }
    },
    {
      label: 'خروج',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Voice Typer - محول الصوت إلى نص');

  // النقر على الأيقونة يفتح النافذة
  tray.on('click', () => {
    showWindow();
  });
}

// إظهار النافذة بجانب أيقونة Tray
function showWindow() {
  if (!mainWindow) return;

  const trayBounds = tray.getBounds();
  const windowBounds = mainWindow.getBounds();

  // حساب الموضع
  const x = Math.round(trayBounds.x - (windowBounds.width / 2) + (trayBounds.width / 2));
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  mainWindow.setPosition(x, y, false);
  mainWindow.show();
  mainWindow.focus();
}

// تبديل حالة الاستماع
function toggleListening() {
  isListening = !isListening;
  
  // تحديث أيقونة Tray
  const iconName = isListening ? 'tray-icon-active.png' : 'tray-icon.png';
  const iconPath = path.join(__dirname, 'assets', iconName);
  const icon = nativeImage.createFromPath(iconPath);
  tray.setImage(icon.resize({ width: 16, height: 16 }));
  
  // إرسال حالة الاستماع للنافذة
  if (mainWindow) {
    mainWindow.webContents.send('toggle-listening', isListening);
  }
}

// إظهار معلومات عن التطبيق
function showAbout() {
  const { dialog } = require('electron');
  dialog.showMessageBox({
    type: 'info',
    title: 'Voice Typer',
    message: 'Voice Typer v1.0.0',
    detail: 'تطبيق حديث لتحويل الصوت إلى نص\n\nاختصار التبديل: Ctrl+Alt+M\n\n© 2025 Voice Typer Team',
    buttons: ['موافق']
  });
}

// تسجيل الاختصار العالمي
function registerShortcuts() {
  const ret = globalShortcut.register('CommandOrControl+Alt+M', () => {
    toggleListening();
  });

  if (!ret) {
    console.log('فشل تسجيل الاختصار');
  }
}

// استقبال النص النهائي من renderer
ipcMain.on('final-text', async (event, text) => {
  console.log('[IPC] استقبلنا نص نهائي من الـ renderer:', text);
  if (!text || text.trim() === '') {
    console.log('[IPC] النص فارغ أو غير صالح، لن يتم النسخ.');
    return;
  }
  try {
    // نسخ النص إلى الحافظة
    const cb = await loadClipboardy();
    await cb.default.write(text);
    console.log('[Clipboardy] تم نسخ النص إلى الحافظة:', text);
    // الانتظار قليلاً ثم محاكاة Ctrl+V
    setTimeout(() => {
      try {
        const robot = require('robotjs');
        robot.keyTap('v', ['control']);
        console.log('[RobotJS] تم لصق النص تلقائيًا.');
      } catch (error) {
        console.error('[RobotJS] خطأ في اللصق التلقائي:', error);
      }
    }, 100);
  } catch (error) {
    console.error('[Clipboardy] خطأ في معالجة النص:', error);
  }
});

// استقبال طلب إظهار النافذة
ipcMain.on('show-window', () => {
  showWindow();
});

// استقبال طلب إخفاء النافذة
ipcMain.on('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

// عند جاهزية التطبيق
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// إلغاء تسجيل الاختصارات عند الإغلاق
app.on('will-quit', () => {
  if (app.isReady()) {
    globalShortcut.unregisterAll();
  }
});

// إغلاق التطبيق عند إغلاق جميع النوافذ (إلا على macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // لا نغلق التطبيق لأننا نعمل في Tray
    // app.quit();
  }
});

// منع فتح عدة نسخ من التطبيق
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      showWindow();
    }
  });
}
