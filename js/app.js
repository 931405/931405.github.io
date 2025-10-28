// 主应用逻辑

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    loadTheme(); // 先加载主题
    initApp();
});

// 初始化应用
function initApp() {
    // 检查API Key
    checkApiKey();
    
    // 初始化导航
    initNavigation();
    
    // 初始化简历上传（如果函数存在）
    if (typeof initResumeUpload === 'function') {
        initResumeUpload();
    }
    
    // 加载初始数据
    if (typeof loadResumeList === 'function') {
        loadResumeList();
    }
    if (typeof loadInterviewList === 'function') {
        loadInterviewList();
    }
    
    // 加载设置
    loadSettings();
    
    // 更新首页统计
    updateHomeStats();
    
    // 初始化筛选器
    initInterviewFilters();
    
    // 初始化快捷键
    if (typeof KeyboardShortcuts !== 'undefined') {
        KeyboardShortcuts.init();
    }
    
    // 初始化题库
    if (typeof QuestionBank !== 'undefined') {
        QuestionBank.initializeDefaultBank();
    }
}

// 检查API Key
function checkApiKey() {
    const apiKey = storage.getApiKey();
    if (!apiKey) {
        setTimeout(() => {
            notify.confirm(
                '检测到您还未配置DeepSeek API Key，是否现在配置？',
                () => navigateTo('settings')
            );
        }, 1500); // 延迟显示，避免和加载动画冲突
    }
}

// 初始化导航
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            navigateTo(page);
        });
    });
}

// 页面导航
function navigateTo(pageName) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageName) {
            btn.classList.add('active');
        }
    });
    
    // 刷新页面数据
    if (pageName === 'resume') {
        if (typeof loadResumeList === 'function') {
            loadResumeList();
        }
    } else if (pageName === 'interview') {
        if (typeof loadInterviewList === 'function') {
            loadInterviewList();
        }
    } else if (pageName === 'settings') {
        loadSettings();
    }
    
    // 更新首页统计
    if (pageName === 'home') {
        updateHomeStats();
    }
}

// 加载设置
function loadSettings() {
    document.getElementById('apiKey').value = storage.getApiKey();
    document.getElementById('apiBaseUrl').value = storage.getApiBaseUrl();
    
    // 更新数据统计
    const resumes = storage.getResumes();
    const interviews = storage.getInterviews();
    
    document.getElementById('settingsResumeCount').textContent = resumes.length;
    document.getElementById('settingsInterviewCount').textContent = interviews.length;
    
    // 计算存储使用
    const storageSize = new Blob([JSON.stringify(localStorage)]).size;
    document.getElementById('storageUsage').textContent = (storageSize / 1024).toFixed(2) + ' KB';
}

// 更新首页统计
function updateHomeStats() {
    const resumes = storage.getResumes();
    const interviews = storage.getInterviews();
    const completedInterviews = interviews.filter(i => i.status === 'completed');
    const completedWithScore = completedInterviews.filter(i => i.score);
    
    // 基础统计
    document.getElementById('totalResumes').textContent = resumes.length;
    document.getElementById('totalInterviews').textContent = interviews.length;
    document.getElementById('completedCount').textContent = completedInterviews.length;
    
    // 已分析简历数
    const analyzedCount = resumes.filter(r => r.analysis).length;
    const analyzedEl = document.getElementById('analyzedResumes');
    if (analyzedEl) {
        analyzedEl.textContent = `${analyzedCount} 份已分析`;
    }
    
    // 平均分数
    if (completedWithScore.length > 0) {
        const avgScore = Math.round(
            completedWithScore.reduce((sum, i) => sum + i.score, 0) / completedWithScore.length
        );
        document.getElementById('avgScore').textContent = avgScore;
        
        // 分数徽章
        const scoreLevel = Utils.getScoreLevel(avgScore);
        const scoreBadge = document.getElementById('scoreBadge');
        if (scoreBadge) {
            scoreBadge.textContent = scoreLevel.text;
            scoreBadge.style.background = scoreLevel.color;
        }
    } else {
        document.getElementById('avgScore').textContent = '--';
        const scoreBadge = document.getElementById('scoreBadge');
        if (scoreBadge) scoreBadge.textContent = '--';
    }
    
    // 通过率
    const passedCount = completedWithScore.filter(i => i.score >= 60).length;
    const passRate = completedInterviews.length > 0 
        ? Math.round((passedCount / completedInterviews.length) * 100) 
        : 0;
    const passRateEl = document.getElementById('passRate');
    if (passRateEl) {
        passRateEl.textContent = passRate + '%';
    }
    
    // 更新最近动态
    updateRecentActivity();
    
    // 更新能力雷达图
    if (typeof SimpleChart !== 'undefined') {
        SimpleChart.updateRadarChart(interviews);
    }
}

// 更新最近动态
function updateRecentActivity() {
    const resumes = storage.getResumes();
    const interviews = storage.getInterviews();
    const container = document.getElementById('recentActivityList');
    
    if (!container) return;
    
    // 合并所有活动
    const activities = [];
    
    // 简历活动
    resumes.forEach(resume => {
        activities.push({
            type: 'resume',
            iconType: 'document',
            title: '上传了简历',
            desc: resume.filename,
            time: new Date(resume.createdAt)
        });
    });
    
    // 面试活动
    interviews.forEach(interview => {
        const statusText = {
            'pending': '创建了面试',
            'in_progress': '开始了面试',
            'completed': '完成了面试'
        }[interview.status] || '更新了面试';
        
        const iconType = {
            'pending': 'add',
            'in_progress': 'play',
            'completed': 'check'
        }[interview.status] || 'list';
        
        activities.push({
            type: 'interview',
            iconType: iconType,
            title: statusText,
            desc: `${interview.position}${interview.companyName ? ' - ' + interview.companyName : ''}`,
            time: new Date(interview.createdAt),
            score: interview.score
        });
    });
    
    // 按时间排序，取最近5条
    activities.sort((a, b) => b.time - a.time);
    const recentActivities = activities.slice(0, 5);
    
    if (recentActivities.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 3rem 2rem;">
                <svg class="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                </svg>
                <h4>暂无动态</h4>
                <p>开始上传简历或创建面试吧</p>
            </div>
        `;
        return;
    }
    
    const iconMap = {
        'document': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
        'add': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
        'play': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
        'check': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        'list': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line></svg>'
    };
    
    container.innerHTML = recentActivities.map(activity => `
        <div class="activity-item glass-card">
            <div class="activity-icon">${iconMap[activity.iconType] || iconMap['list']}</div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-desc">${activity.desc}</div>
            </div>
            <div class="activity-time">${Utils.formatRelativeTime(activity.time)}</div>
            ${activity.score ? `<div class="activity-score">${activity.score}分</div>` : ''}
        </div>
    `).join('');
}

// 初始化面试筛选器
function initInterviewFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 更新激活状态
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 筛选面试列表
            const filter = btn.getAttribute('data-filter');
            filterInterviews(filter);
        });
    });
}

// 筛选面试
function filterInterviews(filter) {
    const interviews = storage.getInterviews();
    let filtered = interviews;
    
    if (filter !== 'all') {
        filtered = interviews.filter(i => i.status === filter);
    }
    
    // 重新渲染列表
    renderInterviewList(filtered);
}

// 渲染面试列表（从interview.js中分离出来）
function renderInterviewList(interviews) {
    const container = document.getElementById('interviewList');
    
    if (interviews.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>暂无面试记录</h3>
                <p>点击"创建新面试"开始您的第一次模拟面试</p>
            </div>
        `;
        return;
    }
    
    // 按创建时间倒序排列
    interviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    container.innerHTML = interviews.map(interview => {
        const statusClass = `status-${interview.status.replace('_', '-')}`;
        const statusText = {
            'pending': '待开始',
            'in_progress': '进行中',
            'completed': '已完成'
        }[interview.status] || interview.status;
        
        return `
            <div class="interview-card glass-card">
                <div class="interview-header">
                    <div class="interview-title-section">
                        <h4 class="interview-title">${interview.position}</h4>
                        ${interview.companyName ? `<p class="interview-company">${interview.companyName}</p>` : ''}
                    </div>
                    <span class="interview-status ${statusClass}">
                        <span class="status-text">${statusText}</span>
                    </span>
                </div>
                <div class="interview-meta">
                    <div class="meta-item">
                        <span class="meta-text">${new Date(interview.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-text">阶段 ${interview.currentStage}/3</span>
                    </div>
                    ${interview.score ? `
                        <div class="meta-item score-item">
                            <span class="meta-text score-value">${interview.score}分</span>
                        </div>
                    ` : ''}
                </div>
                <div class="interview-actions">
                    ${interview.status === 'pending' || interview.status === 'in_progress' ? 
                        `<button class="btn btn-primary btn-small" onclick="continueInterview(${interview.id})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            <span class="btn-text">${interview.status === 'pending' ? '开始' : '继续'}</span>
                        </button>` : ''}
                    ${interview.status === 'completed' ? 
                        `<button class="btn btn-secondary btn-small" onclick="viewInterviewResult(${interview.id})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                            <span class="btn-text">查看结果</span>
                        </button>` : ''}
                    <button class="btn btn-danger btn-small" onclick="deleteInterview(${interview.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span class="btn-text">删除</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 切换密码可见性
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

// 保存API Key
function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const apiBaseUrl = document.getElementById('apiBaseUrl').value.trim();
    
    if (!apiKey) {
        notify.warning('请输入API Key');
        return;
    }
    
    if (!Utils.validateApiKey(apiKey)) {
        notify.error('API Key格式不正确，应以 sk- 开头');
        return;
    }
    
    storage.setApiKey(apiKey);
    storage.setApiBaseUrl(apiBaseUrl);
    
    notify.success('API Key已保存');
}

// 测试API连接
async function testApiKey() {
    const apiKey = storage.getApiKey();
    
    if (!apiKey) {
        notify.warning('请先配置API Key');
        return;
    }
    
    const loader = notify.loading('正在测试连接...');
    
    try {
        const result = await deepseekAPI.testConnection();
        loader.close();
        
        if (result.success) {
            notify.success(result.message);
        } else {
            notify.error(result.message);
        }
    } catch (error) {
        loader.close();
        const errorMsg = Utils.handleError(error, 'API测试');
        notify.error(errorMsg);
    }
}

// 清除所有数据
function clearAllData() {
        notify.confirm(
        '此操作将清除所有数据（简历、面试记录、配置等），且无法恢复！确定继续吗？',
        () => {
            const success = Utils.safeLocalStorage.clear();
            if (success) {
                notify.success('数据已清除，页面即将刷新');
                setTimeout(() => location.reload(), 1500);
            } else {
                notify.error('清除数据失败');
            }
        }
    );
}

// 模态框管理
function showModal(modalId, content = null) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    if (content && modalId === 'resultModal') {
        document.getElementById('resultContent').innerHTML = content;
    }
    
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// 点击模态框外部关闭
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// 加载提示
let loadingDiv = null;

function showLoading(message = '加载中...') {
    // 移除旧的加载提示
    hideLoading();
    
    loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingOverlay';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
    `;
    
    loadingDiv.innerHTML = `
        <div class="spinner" style="border-color: rgba(255,255,255,0.3); border-top-color: white;"></div>
        <p style="margin-top: 1rem; font-size: 1.1rem;">${message}</p>
    `;
    
    document.body.appendChild(loadingDiv);
}

function hideLoading() {
    if (loadingDiv && loadingDiv.parentNode) {
        loadingDiv.parentNode.removeChild(loadingDiv);
        loadingDiv = null;
    }
}

// 工具函数：格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 工具函数：格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 错误处理
window.addEventListener('error', (e) => {
    console.error('全局错误:', e.error);
    hideLoading();
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise错误:', e.reason);
    hideLoading();
});

// 主题切换
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        if (newTheme === 'dark') {
            themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        } else {
            themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
        }
    }
    
    notify.success(`已切换到${newTheme === 'dark' ? '暗色' : '亮色'}主题`, 2000);
}

// 加载主题
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        if (savedTheme === 'dark') {
            themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        } else {
            themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
        }
    }
}

// 帮助系统
function toggleHelp() {
    const helpContent = `
        <div class="help-content">
            <h2>使用指南</h2>
            
            <div class="help-section">
                <h3>快速开始</h3>
                <ol>
                    <li>在<strong>设置</strong>页面配置DeepSeek API Key</li>
                    <li>在<strong>简历管理</strong>上传您的简历（支持PDF/TXT）</li>
                    <li>创建新面试，选择岗位和公司</li>
                    <li>开始答题，获取AI评分和反馈</li>
                </ol>
            </div>
            
            <div class="help-section">
                <h3>功能说明</h3>
                <ul>
                    <li><strong>智能简历分析：</strong>AI自动提取教育、经历、技能等信息</li>
                    <li><strong>三阶段面试：</strong>基础知识→项目经历→综合能力</li>
                    <li><strong>实时评分：</strong>每道题即时反馈，给出改进建议</li>
                    <li><strong>历史记录：</strong>保存所有面试记录，随时查看</li>
                </ul>
            </div>
            
            <div class="help-section">
                <h3>注意事项</h3>
                <ul>
                    <li>API Key保存在本地浏览器，请勿在公共电脑使用</li>
                    <li>所有数据存储在LocalStorage，清除浏览器数据会丢失</li>
                    <li>PDF文件需要网络加载解析库，首次使用可能较慢</li>
                    <li>建议使用Chrome、Edge等现代浏览器</li>
                </ul>
            </div>
            
            <div class="help-section">
                <h3>获取API Key</h3>
                <p>访问 <a href="https://platform.deepseek.com/" target="_blank">DeepSeek开放平台</a> 注册并获取API Key</p>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3>帮助中心</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                ${helpContent}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// 数据导入导出
function exportAllData() {
    DataExportImport.exportAllData();
}

function importData(file) {
    if (!file) return;
    DataExportImport.importData(file);
}

function exportInterviewsCSV() {
    const interviews = storage.getInterviews();
    if (interviews.length === 0) {
        notify.info('暂无面试记录可导出');
        return;
    }
    DataExportImport.exportInterviewsCSV(interviews);
}

// 导出函数供HTML使用
window.navigateTo = navigateTo;
window.saveApiKey = saveApiKey;
window.testApiKey = testApiKey;
window.clearAllData = clearAllData;
window.showModal = showModal;
window.closeModal = closeModal;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.togglePasswordVisibility = togglePasswordVisibility;
window.renderInterviewList = renderInterviewList;
window.toggleTheme = toggleTheme;
window.toggleHelp = toggleHelp;
window.exportAllData = exportAllData;
window.importData = importData;
window.exportInterviewsCSV = exportInterviewsCSV;
// 需要从interview.js导出的函数
if (typeof searchCompanyInfo !== 'undefined') {
    window.searchCompanyInfo = searchCompanyInfo;
}
if (typeof analyzeJD !== 'undefined') {
    window.analyzeJD = analyzeJD;
}
if (typeof generateScenario !== 'undefined') {
    window.generateScenario = generateScenario;
}

