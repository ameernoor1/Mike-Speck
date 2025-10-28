const firebaseConfig = {
  apiKey: "AIzaSyB9veHRWl-DZn1o8QWB-iCMrZdzTCVQRaA",
  authDomain: "data-sayed-hussein-al-saadari.firebaseapp.com",
  databaseURL: "https://data-sayed-hussein-al-saadari-default-rtdb.firebaseio.com",
  projectId: "data-sayed-hussein-al-saadari",
  storageBucket: "data-sayed-hussein-al-saadari.firebasestorage.app",
  messagingSenderId: "360870345361",
  appId: "1:360870345361:web:b6098fc1cf33d15b04dd30"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// دوال مساعدة للاشتراكات
function checkSubscriptionStatus() {
    const userId = localStorage.getItem('userId');
    if (!userId) return { active: false, type: 'none', daysLeft: 0 };

    const subscriptionData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
    if (!subscriptionData.type) return { active: false, type: 'none', daysLeft: 0 };

    const now = Date.now();
    const endDate = Number(subscriptionData.end) || 0;
    const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    const active = subscriptionData.status === 'active' && endDate > now;
    return {
        active,
        type: subscriptionData.type,
        daysLeft,
        status: subscriptionData.status,
        end: endDate,
        start: Number(subscriptionData.start) || 0
    };
}

// دالة لحفظ بيانات الاشتراك في localStorage بشكل موحد
function saveSubscriptionToLocal(subscription) {
    localStorage.setItem('subscriptionData', JSON.stringify(subscription));
}

// دالة لإنشاء اسم مستخدم فريد
function generateUsername(firstName, storeName) {
    // استخدام الاسم الأول أو اسم المتجر لإنشاء اسم المستخدم
    const baseName = (firstName || storeName || 'user').replace(/\s+/g, '');
    const timestamp = Date.now().toString().slice(-6); // آخر 6 أرقام من الوقت
    const random = Math.random().toString(36).substr(2, 4).toUpperCase(); // 4 أحرف عشوائية
    return `${baseName}_${timestamp}_${random}`;
}

// دالة لإنشاء رمز حساب فريد
function generateAccountCode() {
    // رمز مكون من 12 خانة (أرقام وحروف)
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    const code = (timestamp + random).substr(0, 12);
    return code.match(/.{1,4}/g).join('-'); // تقسيم الرمز كل 4 خانات
}

function saveUserData(userId, userData) {
    return database.ref('users/' + userId).set(userData);
}

function loadUserData(userId) {
    return database.ref('users/' + userId).once('value');
}

function saveUserProducts(userId, products) {
    return database.ref('users/' + userId + '/products').set(products);
}

function loadUserProducts(userId) {
    return database.ref('users/' + userId + '/products').once('value');
}

function saveUserInvoices(userId, invoices) {
    return database.ref('users/' + userId + '/invoices').set(invoices);
}

function loadUserInvoices(userId) {
    return database.ref('users/' + userId + '/invoices').once('value');
}

function updateLastLogin(userId) {
    return database.ref('users/' + userId + '/lastLogin').set(Date.now());
}