
const { contextBridge, ipcRenderer } = require('electron');

// تعريض واجهة آمنة للـ renderer process
contextBridge.exposeInMainWorld('voiceAPI', {
  // إرسال النص النهائي للعملية الرئيسية
  sendFinalText: (text) => {
    ipcRenderer.send('final-text', text);
  },
  // الاستماع لحدث تبديل الاستماع
  onToggleListening: (callback) => {
    ipcRenderer.on('toggle-listening', (event, isListening) => {
      callback(isListening);
    });
  },
  // إظهار النافذة
  showWindow: () => {
    ipcRenderer.send('show-window');
  },
  // إخفاء النافذة
  hideWindow: () => {
    ipcRenderer.send('hide-window');
  },
  platform: process.platform,
  version: '1.0.0'
});

console.log('✓ Preload script loaded successfully');
