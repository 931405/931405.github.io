// 通知系统

class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }
    
    init() {
        // 创建通知容器
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
    }
    
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        this.container.appendChild(notification);
        
        // 动画进入
        setTimeout(() => notification.classList.add('show'), 10);
        
        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
        
        return notification;
    }
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
    
    // 确认对话框
    confirm(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-header">
                    <svg class="confirm-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <h3>确认操作</h3>
                </div>
                <div class="confirm-body">
                    <p>${message}</p>
                </div>
                <div class="confirm-actions">
                    <button class="btn btn-secondary confirm-cancel">取消</button>
                    <button class="btn btn-primary confirm-ok">确定</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const dialog = overlay.querySelector('.confirm-dialog');
        setTimeout(() => {
            overlay.classList.add('show');
            dialog.classList.add('show');
        }, 10);
        
        const close = (result) => {
            overlay.classList.remove('show');
            dialog.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
            return result;
        };
        
        overlay.querySelector('.confirm-ok').onclick = () => {
            close(true);
            if (onConfirm) onConfirm();
        };
        
        overlay.querySelector('.confirm-cancel').onclick = () => {
            close(false);
            if (onCancel) onCancel();
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                close(false);
                if (onCancel) onCancel();
            }
        };
    }
    
    // 加载提示
    loading(message = '加载中...') {
        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
        
        document.body.appendChild(loader);
        setTimeout(() => loader.classList.add('show'), 10);
        
        return {
            update: (newMessage) => {
                const msg = loader.querySelector('.loading-message');
                if (msg) msg.textContent = newMessage;
            },
            close: () => {
                loader.classList.remove('show');
                setTimeout(() => loader.remove(), 300);
            }
        };
    }
}

// 样式
const notificationStyles = `
<style>
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
}

.notification {
    background: var(--glass-bg, rgba(26, 43, 77, 0.9));
    backdrop-filter: blur(20px);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transform: translateX(120%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification.show {
    transform: translateX(0);
}

.notification-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.notification-message {
    flex: 1;
    color: #fff;
    font-size: 0.95rem;
}

.notification-close {
    background: none;
    border: none;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.2s;
}

.notification-close:hover {
    background: rgba(255, 255, 255, 0.1);
}

.notification-success {
    border-left: 4px solid #10b981;
}

.notification-error {
    border-left: 4px solid #ef4444;
}

.notification-warning {
    border-left: 4px solid #f59e0b;
}

.notification-info {
    border-left: 4px solid #3b82f6;
}

.confirm-overlay, .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 27, 51, 0.8);
    backdrop-filter: blur(5px);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
}

.confirm-overlay.show, .loading-overlay.show {
    opacity: 1;
}

.confirm-dialog {
    background: var(--glass-bg, rgba(26, 43, 77, 0.95));
    backdrop-filter: blur(30px);
    border-radius: 20px;
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    transform: scale(0.9);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.confirm-dialog.show {
    transform: scale(1);
}

.confirm-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 1.5rem;
}

.confirm-icon {
    font-size: 2rem;
}

.confirm-header h3 {
    color: #fff;
    font-size: 1.3rem;
    margin: 0;
}

.confirm-body p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    line-height: 1.6;
    margin: 0 0 1.5rem 0;
}

.confirm-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

.loading-content {
    text-align: center;
    padding: 2.5rem;
    background: var(--bg-primary, #fff);
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    min-width: 320px;
}

[data-theme="dark"] .loading-content {
    background: var(--bg-secondary, #1f2937);
}

.loading-spinner {
    width: 56px;
    height: 56px;
    border: 4px solid rgba(37, 99, 235, 0.1);
    border-top: 4px solid #2563eb;
    border-right: 4px solid #2563eb;
    border-radius: 50%;
    animation: spinner-rotate 0.8s linear infinite;
    margin: 0 auto 1.5rem;
}

[data-theme="dark"] .loading-spinner {
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top: 4px solid #3b82f6;
    border-right: 4px solid #3b82f6;
}

@keyframes spinner-rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-message {
    color: var(--text-primary, #111827);
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
}

@media (max-width: 768px) {
    .notification-container {
        left: 20px;
        right: 20px;
        max-width: none;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', notificationStyles);

// 创建全局实例
const notify = new NotificationSystem();
window.notify = notify;

