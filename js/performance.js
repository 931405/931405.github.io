// 性能优化模块

class PerformanceOptimizer {
    constructor() {
        this.observers = new Map();
        this.init();
    }
    
    init() {
        // 图片懒加载
        this.setupLazyLoading();
        
        // 滚动性能优化
        this.optimizeScroll();
        
        // 内存监控
        this.monitorMemory();
    }
    
    // 懒加载设置
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });
            
            this.observers.set('images', imageObserver);
        }
    }
    
    // 优化滚动性能
    optimizeScroll() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }
    
    handleScroll() {
        // 可以在这里添加滚动相关的性能优化
        // 比如：虚拟滚动、元素可见性检测等
    }
    
    // 内存监控
    monitorMemory() {
        if (performance.memory) {
            setInterval(() => {
                const usage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
                if (usage > 0.9) {
                    console.warn('内存使用率过高:', (usage * 100).toFixed(2) + '%');
                    this.cleanupMemory();
                }
            }, 60000); // 每分钟检查一次
        }
    }
    
    // 清理内存
    cleanupMemory() {
        // 清理未使用的缓存
        if (window.caches) {
            caches.keys().then(keys => {
                keys.forEach(key => {
                    if (key.includes('old')) {
                        caches.delete(key);
                    }
                });
            });
        }
    }
    
    // 批处理DOM操作
    static batchDOMUpdates(updates) {
        requestAnimationFrame(() => {
            const fragment = document.createDocumentFragment();
            updates.forEach(update => update(fragment));
        });
    }
    
    // 节流函数包装器
    static throttleEvent(element, event, handler, limit = 100) {
        element.addEventListener(event, Utils.throttle(handler, limit), { passive: true });
    }
    
    // 防抖函数包装器
    static debounceEvent(element, event, handler, wait = 300) {
        element.addEventListener(event, Utils.debounce(handler, wait));
    }
}

// 代码分割 - 按需加载
class CodeSplitter {
    static async loadModule(moduleName) {
        try {
            const module = await import(`./modules/${moduleName}.js`);
            return module;
        } catch (error) {
            console.error(`加载模块 ${moduleName} 失败:`, error);
            return null;
        }
    }
    
    // 预加载关键资源
    static preloadResources(resources) {
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = resource.type;
            link.href = resource.url;
            document.head.appendChild(link);
        });
    }
}

// 缓存管理
class CacheManager {
    constructor(maxSize = 50) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    
    set(key, value, ttl = 300000) { // 默认5分钟过期
        if (this.cache.size >= this.maxSize) {
            // LRU策略：删除最旧的项
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            expires: Date.now() + ttl
        });
    }
    
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) return null;
        
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    clear() {
        this.cache.clear();
    }
    
    // 清理过期项
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expires) {
                this.cache.delete(key);
            }
        }
    }
}

// 创建全局实例
const perfOptimizer = new PerformanceOptimizer();
const cacheManager = new CacheManager();

// 定期清理缓存
setInterval(() => cacheManager.cleanup(), 60000);

// 导出
window.PerformanceOptimizer = PerformanceOptimizer;
window.CacheManager = CacheManager;
window.perfOptimizer = perfOptimizer;
window.cacheManager = cacheManager;

