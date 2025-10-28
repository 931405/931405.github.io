// 工具函数库

class Utils {
    // 日期格式化
    static formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }
    
    // 相对时间
    static formatRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 7) {
            return this.formatDate(date, 'YYYY-MM-DD');
        } else if (days > 0) {
            return `${days}天前`;
        } else if (hours > 0) {
            return `${hours}小时前`;
        } else if (minutes > 0) {
            return `${minutes}分钟前`;
        } else {
            return '刚刚';
        }
    }
    
    // 文件大小格式化
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }
    
    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // 深拷贝
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = this.deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
    
    // 生成唯一ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // 验证邮箱
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // 验证API Key
    static validateApiKey(key) {
        return key && key.length > 20 && key.startsWith('sk-');
    }
    
    // 截断文本
    static truncate(text, length = 100, suffix = '...') {
        if (!text || text.length <= length) return text;
        return text.substring(0, length) + suffix;
    }
    
    // 高亮关键词
    static highlightKeywords(text, keywords) {
        if (!keywords || keywords.length === 0) return text;
        let result = text;
        keywords.forEach(keyword => {
            const regex = new RegExp(keyword, 'gi');
            result = result.replace(regex, match => `<mark>${match}</mark>`);
        });
        return result;
    }
    
    // 计算分数等级
    static getScoreLevel(score) {
        if (score >= 90) return { level: 'excellent', text: '优秀', color: '#10b981' };
        if (score >= 80) return { level: 'good', text: '良好', color: '#3b82f6' };
        if (score >= 70) return { level: 'fair', text: '中等', color: '#f59e0b' };
        if (score >= 60) return { level: 'pass', text: '及格', color: '#fbbf24' };
        return { level: 'fail', text: '不及格', color: '#ef4444' };
    }
    
    // 复制到剪贴板
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    }
    
    // 下载文件
    static downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // 本地存储安全包装
    static safeLocalStorage = {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('LocalStorage get error:', e);
                return defaultValue;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('LocalStorage set error:', e);
                return false;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('LocalStorage remove error:', e);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('LocalStorage clear error:', e);
                return false;
            }
        }
    };
    
    // 错误处理
    static handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        let message = '操作失败，请重试';
        
        if (error.message) {
            if (error.message.includes('API')) {
                message = 'API调用失败，请检查网络和API配置';
            } else if (error.message.includes('quota')) {
                message = 'API额度不足，请检查账户余额';
            } else if (error.message.includes('timeout')) {
                message = '请求超时，请检查网络连接';
            } else {
                message = error.message;
            }
        }
        
        return message;
    }
}

// 导出工具类
window.Utils = Utils;

