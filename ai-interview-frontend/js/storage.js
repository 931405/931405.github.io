// LocalStorage 数据管理

class StorageManager {
    constructor() {
        this.keys = {
            API_KEY: 'deepseek_api_key',
            API_BASE_URL: 'deepseek_api_base_url',
            RESUMES: 'resumes',
            INTERVIEWS: 'interviews',
            CURRENT_INTERVIEW: 'current_interview'
        };
    }

    // API配置
    getApiKey() {
        return localStorage.getItem(this.keys.API_KEY) || '';
    }

    setApiKey(key) {
        localStorage.setItem(this.keys.API_KEY, key);
    }

    getApiBaseUrl() {
        return localStorage.getItem(this.keys.API_BASE_URL) || 'https://api.deepseek.com';
    }

    setApiBaseUrl(url) {
        localStorage.setItem(this.keys.API_BASE_URL, url);
    }

    // 简历管理
    getResumes() {
        const data = localStorage.getItem(this.keys.RESUMES);
        return data ? JSON.parse(data) : [];
    }

    saveResume(resume) {
        const resumes = this.getResumes();
        resume.id = Date.now();
        resume.createdAt = new Date().toISOString();
        resumes.push(resume);
        localStorage.setItem(this.keys.RESUMES, JSON.stringify(resumes));
        return resume;
    }

    getResumeById(id) {
        const resumes = this.getResumes();
        return resumes.find(r => r.id === id);
    }

    updateResume(id, updates) {
        const resumes = this.getResumes();
        const index = resumes.findIndex(r => r.id === id);
        if (index !== -1) {
            resumes[index] = { ...resumes[index], ...updates };
            localStorage.setItem(this.keys.RESUMES, JSON.stringify(resumes));
            return resumes[index];
        }
        return null;
    }

    deleteResume(id) {
        const resumes = this.getResumes();
        const filtered = resumes.filter(r => r.id !== id);
        localStorage.setItem(this.keys.RESUMES, JSON.stringify(filtered));
    }

    // 面试管理
    getInterviews() {
        const data = localStorage.getItem(this.keys.INTERVIEWS);
        return data ? JSON.parse(data) : [];
    }

    saveInterview(interview) {
        const interviews = this.getInterviews();
        interview.id = Date.now();
        interview.createdAt = new Date().toISOString();
        interview.status = 'pending';
        interview.currentStage = 1;
        interview.questions = { stage_1: [], stage_2: [], stage_3: [] };
        interview.answers = {};
        interview.evaluations = {};
        interviews.push(interview);
        localStorage.setItem(this.keys.INTERVIEWS, JSON.stringify(interviews));
        return interview;
    }

    getInterviewById(id) {
        const interviews = this.getInterviews();
        return interviews.find(i => i.id === id);
    }

    updateInterview(id, updates) {
        const interviews = this.getInterviews();
        const index = interviews.findIndex(i => i.id === id);
        if (index !== -1) {
            interviews[index] = { ...interviews[index], ...updates };
            localStorage.setItem(this.keys.INTERVIEWS, JSON.stringify(interviews));
            return interviews[index];
        }
        return null;
    }

    deleteInterview(id) {
        const interviews = this.getInterviews();
        const filtered = interviews.filter(i => i.id !== id);
        localStorage.setItem(this.keys.INTERVIEWS, JSON.stringify(filtered));
    }

    // 当前面试
    getCurrentInterview() {
        const data = localStorage.getItem(this.keys.CURRENT_INTERVIEW);
        return data ? JSON.parse(data) : null;
    }

    setCurrentInterview(interview) {
        localStorage.setItem(this.keys.CURRENT_INTERVIEW, JSON.stringify(interview));
    }

    clearCurrentInterview() {
        localStorage.removeItem(this.keys.CURRENT_INTERVIEW);
    }

    // 清除所有数据
    clearAll() {
        if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
            localStorage.clear();
            alert('所有数据已清除');
            location.reload();
        }
    }
}

const storage = new StorageManager();

