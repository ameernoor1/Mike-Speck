// مثال عملي لاستخدام مكتبة speech-to-text في Electron
// هذا الكود يجب استدعاؤه من index.html أو ملف جافاسكريبت مرتبط

const SpeechToText = require('speech-to-text');

let listener = null;
let finalTranscript = '';

function onSpeechRecognized(result) {
  if (result) {
    finalTranscript += result;
    // يمكنك هنا إرسال النص النهائي إلى main process
    if (window.voiceAPI && window.voiceAPI.sendFinalText) {
      window.voiceAPI.sendFinalText(finalTranscript.trim());
    }
    // تحديث واجهة المستخدم
    document.getElementById('transcript').innerText = finalTranscript;
  }
}

function onError(error) {
  console.error('Speech recognition error:', error);
}

function startListening() {
  finalTranscript = '';
  listener = new SpeechToText(onSpeechRecognized, onError);
  listener.startListening();
}

function stopListening() {
  if (listener) {
    listener.stopListening();
  }
}

// مثال: ربط الأزرار
// document.getElementById('micButton').addEventListener('click', startListening);
// document.getElementById('clearBtn').addEventListener('click', stopListening);

// يمكنك تعديل الكود ليتوافق مع تصميمك وواجهة المستخدم الخاصة بك
