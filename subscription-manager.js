// نظام إدارة الاشتراكات والصلاحيات - محدث
class SubscriptionManager {
    constructor() {
        this.userId = localStorage.getItem('userId');
        this.loadSubscriptionData();
    }

    // تحميل بيانات الاشتراك من localStorage
    loadSubscriptionData() {
        const subscriptionData = localStorage.getItem('subscriptionData');
        if (subscriptionData) {
            try {
                const data = JSON.parse(subscriptionData);
                this.subscriptionEnd = data.end;
                this.subscriptionStatus = data.status;
                this.subscriptionType = data.type;
                this.subscriptionStart = data.start;
            } catch (e) {
                console.error('Error parsing subscription data:', e);
                this.subscriptionEnd = null;
                this.subscriptionStatus = null;
                this.subscriptionType = null;
            }
        } else {
            // للتوافق مع الإصدارات القديمة
            this.subscriptionEnd = localStorage.getItem('subscriptionEnd');
            this.subscriptionStatus = localStorage.getItem('subscriptionStatus');
            this.subscriptionType = localStorage.getItem('subscriptionType') || 'free';
        }
    }

    // التحقق من حالة الاشتراك
    checkSubscription() {
        if (!this.userId) {
            this.redirectToLanding();
            return false;
        }

        if (!this.subscriptionEnd) {
            this.redirectToLanding();
            return false;
        }

        const endDate = Number(this.subscriptionEnd);
        const now = Date.now();
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) {
            return false;
        }

        return true;
    }

    // الحصول على الأيام المتبقية
    getDaysLeft() {
        if (!this.subscriptionEnd) return 0;
        
        const endDate = Number(this.subscriptionEnd);
        const now = Date.now();
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        
        return Math.max(0, daysLeft);
    }

    // التحقق من صلاحية تنفيذ عملية
    canPerformAction(actionType) {
        const isActive = this.checkSubscription();
        
        if (!isActive) {
            this.showSubscriptionExpiredModal();
            return false;
        }
        
        // التحقق من الإجراءات المحظورة في النسخة المجانية
        if (this.subscriptionStatus === 'free') {
            const daysLeft = this.getDaysLeft();
            if (daysLeft <= 0) {
                this.showSubscriptionExpiredModal();
                return false;
            }
            
            // عرض تنبيه إذا كانت الأيام المتبقية أقل من 7
            if (daysLeft <= 7 && daysLeft > 0) {
                this.showRenewalReminder(daysLeft);
            }
        }
        
        return true;
    }

    // عرض نافذة انتهاء الاشتراك
    showSubscriptionExpiredModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.zIndex = '10000';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; padding: 3rem; text-align: center;">
                <div style="font-size: 5rem; margin-bottom: 1rem;">⏰</div>
                <h2 style="font-size: 2rem; font-weight: bold; color: #ef4444; margin-bottom: 1rem;">
                    انتهى اشتراكك!
                </h2>
                <p style="font-size: 1.2rem; color: #666; margin-bottom: 2rem;">
                    للاستمرار في استخدام جميع مميزات كاش برو، يرجى تجديد اشتراكك
                </p>
                
                <div style="background: #fef3c7; padding: 1.5rem; border-radius: 15px; margin-bottom: 2rem;">
                    <h3 style="font-weight: bold; margin-bottom: 1rem; color: #92400e;">خطط الاشتراك:</h3>
                    <div style="text-align: right;">
                        <div style="margin-bottom: 0.75rem;">
                            <strong>⚡ الاشتراك الشهري:</strong> 25,000 دينار عراقي
                        </div>
                        <div>
                            <strong>👑 الاشتراك السنوي:</strong> 225,000 دينار عراقي
                            <span style="color: #10b981; font-weight: bold;"> (وفر 75,000 د.ع)</span>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f3f4f6; padding: 1.5rem; border-radius: 15px; margin-bottom: 2rem;">
                    <p style="font-weight: 600; margin-bottom: 0.5rem;">لديك رمز تفعيل؟</p>
                    <input 
                        type="text" 
                        id="activationCodeInput" 
                        placeholder="أدخل رمز التفعيل هنا"
                        style="width: 100%; padding: 1rem; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 1rem; text-align: center; text-transform: uppercase; letter-spacing: 2px;"
                    >
                </div>
                
                <button 
                    onclick="subscriptionManager.activateCode()" 
                    class="btn-primary" 
                    style="width: 100%; padding: 1.2rem; border-radius: 50px; font-size: 1.1rem; margin-bottom: 1rem;"
                >
                    <i class="fas fa-key"></i> تفعيل الاشتراك
                </button>
                
                <button 
                    onclick="window.location.href='landing.html'" 
                    class="btn-primary" 
                    style="width: 100%; padding: 1.2rem; border-radius: 50px; font-size: 1.1rem; background: #10b981;"
                >
                    <i class="fas fa-shopping-cart"></i> شراء اشتراك جديد
                </button>
                
                <p style="color: #999; font-size: 0.9rem; margin-top: 2rem;">
                    للمساعدة أو الاستفسار: 07XX XXX XXXX
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // منع إغلاق النافذة بالنقر خارجها
        modal.onclick = (e) => {
            if (e.target === modal) {
                e.stopPropagation();
            }
        };
    }

    // عرض تذكير بالتجديد
    showRenewalReminder(daysLeft) {
        // عرض التذكير مرة واحدة يومياً فقط
        const lastReminder = localStorage.getItem('lastRenewalReminder');
        const today = new Date().toDateString();
        
        if (lastReminder === today) return;
        
        localStorage.setItem('lastRenewalReminder', today);
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 1.5rem 2rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(245, 158, 11, 0.4);
            z-index: 9999;
            max-width: 500px;
            text-align: center;
            animation: slideDown 0.5s ease;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
            <div style="font-weight: bold; font-size: 1.2rem; margin-bottom: 0.5rem;">
                تنبيه: اشتراكك على وشك الانتهاء!
            </div>
            <div style="font-size: 1rem; opacity: 0.95;">
                المتبقي: ${daysLeft} ${daysLeft === 1 ? 'يوم' : 'أيام'} فقط
            </div>
            <button 
                onclick="this.parentElement.remove()" 
                style="margin-top: 1rem; background: white; color: #d97706; border: none; padding: 0.5rem 1.5rem; border-radius: 50px; font-weight: bold; cursor: pointer;"
            >
                حسناً
            </button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 10000);
    }

    // تفعيل رمز الاشتراك
    async activateCode() {
        const codeInput = document.getElementById('activationCodeInput');
        const code = codeInput.value.trim().toUpperCase();
        
        if (!code) {
            alert('يرجى إدخال رمز التفعيل');
            return;
        }
        
        // عرض مؤشر التحميل
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التفعيل...';
        
        try {
            // التحقق من رمز التفعيل في Firebase
            const codeSnapshot = await firebase.database().ref('subscriptionCodes/' + code).once('value');
            const codeData = codeSnapshot.val();
            
            if (!codeData) {
                alert('❌ رمز التفعيل غير صحيح');
                btn.disabled = false;
                btn.innerHTML = originalText;
                return;
            }
            
            if (codeData.used) {
                alert('❌ رمز التفعيل مستخدم بالفعل');
                btn.disabled = false;
                btn.innerHTML = originalText;
                return;
            }
            
            // حساب تاريخ انتهاء الاشتراك
            let subscriptionEnd;
            if (codeData.type === 'monthly') {
                subscriptionEnd = Date.now() + (30 * 24 * 60 * 60 * 1000);
            } else if (codeData.type === 'yearly') {
                subscriptionEnd = Date.now() + (365 * 24 * 60 * 60 * 1000);
            } else if (codeData.type === 'custom' && codeData.days) {
                subscriptionEnd = Date.now() + (codeData.days * 24 * 60 * 60 * 1000);
            }
            
            // تحديث بيانات الاشتراك
            const subscriptionData = {
                type: codeData.type,
                status: 'active',
                start: Date.now(),
                end: subscriptionEnd
            };
            
            // حفظ في localStorage
            localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));
            
            // تحديث في Firebase
            const userId = localStorage.getItem('userId');
            if (userId) {
                await firebase.database().ref('users/' + userId + '/subscription').set(subscriptionData);
                
                // تحديث حالة الكود
                await firebase.database().ref('subscriptionCodes/' + code).update({
                    used: true,
                    usedBy: userId,
                    usedAt: Date.now()
                });
            }
            
            alert('🎉 تم تفعيل اشتراكك بنجاح!\n\nنوع الاشتراك: ' + 
                  (codeData.type === 'monthly' ? 'شهري' : 'سنوي') + 
                  '\nصالح حتى: ' + new Date(subscriptionEnd).toLocaleDateString('ar-IQ'));
            
            // إعادة تحميل الصفحة
            location.reload();
            
        } catch (error) {
            console.error('Error activating code:', error);
            alert('❌ حدث خطأ في التفعيل. يرجى المحاولة لاحقاً.');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    // التوجيه إلى صفحة الترحيب
    redirectToLanding() {
        if (confirm('يجب عليك التسجيل أولاً. هل تريد الانتقال إلى صفحة التسجيل؟')) {
            window.location.href = 'landing.html';
        } else {
            window.location.href = 'landing.html';
        }
    }

    // تحديث عرض معلومات الاشتراك
    updateSubscriptionDisplay() {
        const daysLeft = this.getDaysLeft();
        const subscriptionType = this.subscriptionType || 'free';
        
        // تحديث عناصر واجهة المستخدم
        const statusElements = document.querySelectorAll('.subscription-status');
        statusElements.forEach(el => {
            if (daysLeft > 0) {
                el.textContent = 'نشط';
                el.className = 'subscription-status badge-success';
            } else {
                el.textContent = 'منتهي';
                el.className = 'subscription-status badge-danger';
            }
        });
        
        const daysElements = document.querySelectorAll('.subscription-days');
        daysElements.forEach(el => {
            el.textContent = daysLeft > 0 ? daysLeft + ' يوم متبقي' : 'انتهى الاشتراك';
        });
        
        const typeElements = document.querySelectorAll('.subscription-type');
        typeElements.forEach(el => {
            const typeNames = {
                'free': 'تجريبي مجاني',
                'monthly': 'شهري',
                'yearly': 'سنوي'
            };
            el.textContent = typeNames[subscriptionType] || 'غير محدد';
        });
        
        const endDateElements = document.querySelectorAll('.subscription-end-date');
        if (this.subscriptionEnd) {
            const endDate = new Date(Number(this.subscriptionEnd));
            endDateElements.forEach(el => {
                el.textContent = endDate.toLocaleDateString('ar-IQ');
            });
        }
    }

    // إضافة حماية للأزرار والوظائف
    protectActions() {
        // حماية أزرار إضافة المنتجات
        const addButtons = document.querySelectorAll('[onclick*="addProduct"], [onclick*="saveProduct"], [onclick*="addCategory"]');
        addButtons.forEach(btn => {
            const originalOnClick = btn.getAttribute('onclick');
            if (originalOnClick && !originalOnClick.includes('subscriptionManager.canPerformAction')) {
                btn.setAttribute('data-original-onclick', originalOnClick);
                btn.setAttribute('onclick', `if(subscriptionManager.canPerformAction('add')) { ${originalOnClick} }`);
            }
        });
        
        // حماية أزرار البيع
        const sellButtons = document.querySelectorAll('[onclick*="completeSale"], [onclick*="addToCart"]');
        sellButtons.forEach(btn => {
            const originalOnClick = btn.getAttribute('onclick');
            if (originalOnClick && !originalOnClick.includes('subscriptionManager.canPerformAction')) {
                btn.setAttribute('data-original-onclick', originalOnClick);
                btn.setAttribute('onclick', `if(subscriptionManager.canPerformAction('sell')) { ${originalOnClick} }`);
            }
        });
        
        // حماية أزرار التعديل والحذف
        const editButtons = document.querySelectorAll('[onclick*="editProduct"], [onclick*="deleteProduct"], [onclick*="editCategory"], [onclick*="deleteCategory"]');
        editButtons.forEach(btn => {
            const originalOnClick = btn.getAttribute('onclick');
            if (originalOnClick && !originalOnClick.includes('subscriptionManager.canPerformAction')) {
                btn.setAttribute('data-original-onclick', originalOnClick);
                btn.setAttribute('onclick', `if(subscriptionManager.canPerformAction('edit')) { ${originalOnClick} }`);
            }
        });
    }
}

// إنشاء نسخة عامة من مدير الاشتراكات
const subscriptionManager = new SubscriptionManager();

// التحقق من الاشتراك عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من وجود مستخدم
    const userId = localStorage.getItem('userId');
    if (!userId) {
        subscriptionManager.redirectToLanding();
        return;
    }
    
    // التحقق من حالة الاشتراك
    const isActive = subscriptionManager.checkSubscription();
    
    // تحديث عرض معلومات الاشتراك
    subscriptionManager.updateSubscriptionDisplay();
    
    // إضافة حماية للوظائف
    setTimeout(() => {
        subscriptionManager.protectActions();
    }, 1000);
    
    // تحديث آخر تسجيل دخول
    if (typeof updateLastLogin === 'function') {
        updateLastLogin(userId);
    }
});

// إضافة CSS للأنيميشن
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-50px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
`;
document.head.appendChild(style);