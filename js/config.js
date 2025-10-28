// 应用配置文件

const APP_CONFIG = {
    name: 'AI面试系统',
    version: 'v2.0.0',
    description: '基于DeepSeek AI的智能面试练习平台',
    
    // API配置
    api: {
        defaultBaseUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        timeout: 30000, // 30秒超时
        maxRetries: 3
    },
    
    // 面试配置
    interview: {
        stages: [
            { id: 1, name: '基础知识', icon: '📚', description: '技术基础和八股文' },
            { id: 2, name: '项目经历', icon: '💼', description: '项目和实习经验' },
            { id: 3, name: '综合能力', icon: '🎯', description: '算法或综合问题' }
        ],
        questionsPerStage: 3,
        defaultTimeLimit: 300, // 5分钟
        minAnswerLength: 10,
        passingScore: 60
    },
    
    // 文件上传配置
    upload: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['.pdf', '.txt', '.doc', '.docx'],
        allowedMimeTypes: [
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
    },
    
    // 本地存储配置
    storage: {
        prefix: 'ai_interview_',
        keys: {
            apiKey: 'deepseek_api_key',
            apiBaseUrl: 'deepseek_api_base_url',
            resumes: 'resumes',
            interviews: 'interviews',
            settings: 'user_settings',
            stats: 'user_stats'
        }
    },
    
    // UI配置
    ui: {
        theme: 'dark',
        animationDuration: 300,
        toastDuration: 3000,
        itemsPerPage: 10
    },
    
    // 功能开关
    features: {
        aiAnalysis: true,
        pdfParsing: true,
        voiceInput: false, // 预留语音输入功能
        exportReport: false, // 预留导出报告功能
        multiLanguage: false // 预留多语言功能
    }
};

// 状态常量
const STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

// 消息类型
const MESSAGE_TYPE = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// 导出配置
window.APP_CONFIG = APP_CONFIG;
window.STATUS = STATUS;
window.MESSAGE_TYPE = MESSAGE_TYPE;

