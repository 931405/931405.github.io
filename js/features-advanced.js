// 高级实用功能模块

// 1. 面试记录对比功能
class InterviewComparison {
    static compare(interview1Id, interview2Id) {
        const i1 = storage.getInterviewById(interview1Id);
        const i2 = storage.getInterviewById(interview2Id);
        
        if (!i1 || !i2) return null;
        
        return {
            scoreChange: (i2.score || 0) - (i1.score || 0),
            timeChange: this.calculateTimeDiff(i1, i2),
            improvements: this.findImprovements(i1, i2),
            regressions: this.findRegressions(i1, i2)
        };
    }
    
    static calculateTimeDiff(i1, i2) {
        if (!i1.completedAt || !i2.completedAt) return null;
        const t1 = new Date(i1.completedAt) - new Date(i1.createdAt);
        const t2 = new Date(i2.completedAt) - new Date(i2.createdAt);
        return t2 - t1;
    }
    
    static findImprovements(i1, i2) {
        const improvements = [];
        // 比较各阶段得分
        for (let stage = 1; stage <= 3; stage++) {
            const s1 = this.getStageScore(i1, stage);
            const s2 = this.getStageScore(i2, stage);
            if (s2 > s1 + 5) {
                improvements.push(`阶段${stage}提升了${s2 - s1}分`);
            }
        }
        return improvements;
    }
    
    static findRegressions(i1, i2) {
        const regressions = [];
        for (let stage = 1; stage <= 3; stage++) {
            const s1 = this.getStageScore(i1, stage);
            const s2 = this.getStageScore(i2, stage);
            if (s2 < s1 - 5) {
                regressions.push(`阶段${stage}下降了${s1 - s2}分`);
            }
        }
        return regressions;
    }
    
    static getStageScore(interview, stage) {
        const stageKey = `stage_${stage}`;
        let total = 0, count = 0;
        Object.keys(interview.evaluations || {}).forEach(key => {
            if (key.startsWith(stageKey) && !key.includes('followup')) {
                total += interview.evaluations[key].score || 0;
                count++;
            }
        });
        return count > 0 ? Math.round(total / count) : 0;
    }
}

// 2. 答案模板库
class AnswerTemplates {
    static templates = {
        '自我介绍': `您好，我是[姓名]，[学校][专业]毕业。在校期间/工作中，我主要专注于[技术方向]。

我做过的代表性项目有[项目名]，在其中我负责[职责]，使用了[技术栈]，最终实现了[成果]。

我的技术优势是[优势1、优势2]，我热爱学习新技术，希望能加入贵公司，在[岗位]上发挥所长。`,
        
        '项目介绍': `这个项目是[项目背景和目标]。

技术架构上，我们采用了[技术栈]，我主要负责[模块]的开发。

遇到的主要挑战是[问题]，我通过[解决方案]解决了，最终[成果和数据]。

通过这个项目，我学到了[收获]。`,
        
        '离职原因': `我在上一家公司工作期间，积累了[经验]，但随着个人成长，我希望能在[方向]上有更深入的发展。

贵公司在[领域]的技术实力和[优势]吸引了我，我认为这里更适合我的职业发展规划。`,
        
        '职业规划': `短期（1-2年）：我希望能够深入掌握[技术]，成为该领域的专家。

中期（3-5年）：在技术精进的同时，培养团队协作和项目管理能力，承担更大的责任。

长期：成为技术专家或技术管理者，为团队和公司创造更大价值。`
    };
    
    static getTemplate(keyword) {
        for (const [key, template] of Object.entries(this.templates)) {
            if (key.includes(keyword) || keyword.includes(key)) {
                return template;
            }
        }
        return null;
    }
    
    static getAllTemplates() {
        return this.templates;
    }
}

// 3. 面试提醒和倒计时
class InterviewReminder {
    static setReminder(interviewId, reminderTime) {
        const interview = storage.getInterviewById(interviewId);
        if (!interview) return false;
        
        const reminders = Utils.safeLocalStorage.get('reminders', []);
        reminders.push({
            interviewId,
            reminderTime: new Date(reminderTime).toISOString(),
            position: interview.position,
            company: interview.companyName
        });
        
        Utils.safeLocalStorage.set('reminders', reminders);
        return true;
    }
    
    static checkReminders() {
        const reminders = Utils.safeLocalStorage.get('reminders', []);
        const now = new Date();
        const activeReminders = [];
        
        reminders.forEach(reminder => {
            const reminderDate = new Date(reminder.reminderTime);
            const diff = reminderDate - now;
            
            // 提前15分钟提醒
            if (diff > 0 && diff < 15 * 60 * 1000) {
                activeReminders.push(reminder);
            }
        });
        
        return activeReminders;
    }
}

// 4. 高频问题收藏
class FavoriteQuestions {
    static add(question, answer, score) {
        const favorites = Utils.safeLocalStorage.get('favorite_questions', []);
        favorites.push({
            id: Utils.generateId(),
            question,
            answer,
            score,
            addedAt: new Date().toISOString()
        });
        Utils.safeLocalStorage.set('favorite_questions', favorites);
        notify.success('已添加到收藏');
    }
    
    static getAll() {
        return Utils.safeLocalStorage.get('favorite_questions', []);
    }
    
    static remove(id) {
        const favorites = this.getAll();
        const filtered = favorites.filter(f => f.id !== id);
        Utils.safeLocalStorage.set('favorite_questions', filtered);
    }
}

// 5. 学习笔记功能
class StudyNotes {
    static add(topic, content, tags = []) {
        const notes = Utils.safeLocalStorage.get('study_notes', []);
        notes.push({
            id: Utils.generateId(),
            topic,
            content,
            tags,
            createdAt: new Date().toISOString()
        });
        Utils.safeLocalStorage.set('study_notes', notes);
        return true;
    }
    
    static getAll() {
        return Utils.safeLocalStorage.get('study_notes', []);
    }
    
    static search(keyword) {
        const notes = this.getAll();
        return notes.filter(note => 
            note.topic.includes(keyword) || 
            note.content.includes(keyword) ||
            note.tags.some(tag => tag.includes(keyword))
        );
    }
}

// 6. 模拟真实压力测试模式
class StressTestMode {
    static config = {
        enableStrictTimer: true,      // 严格计时
        enableRandomInterrupts: true,  // 随机打断
        enableDifficultQuestions: true // 高难度问题
    };
    
    static async generateInterruptEvent() {
        const events = [
            '面试官突然追问了一个细节问题...',
            '请用更简洁的语言重新组织一下你的回答',
            '这个回答似乎没有体现你的深度思考',
            '能否给出一个更具体的例子？'
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        return randomEvent;
    }
}

// 7. 面试技巧提示系统
class InterviewTips {
    static tips = {
        '开场': [
            '微笑并保持眼神交流',
            '简洁有力地介绍自己',
            '展现自信和积极的态度'
        ],
        '回答技巧': [
            '使用STAR法则：情境、任务、行动、结果',
            '先总后分的结构化表达',
            '用数据和案例支撑观点',
            '避免模糊词汇，要具体明确'
        ],
        '项目描述': [
            '突出个人贡献和技术亮点',
            '说明项目的业务价值',
            '分享遇到的挑战和解决方案',
            '反思学到了什么'
        ],
        '压力应对': [
            '遇到不会的问题，诚实说明并展示思路',
            '被打断时保持冷静，重新组织语言',
            '适当停顿思考，不要急于作答',
            '展现学习能力和解决问题的态度'
        ]
    };
    
    static getRandomTip(category = null) {
        if (category && this.tips[category]) {
            const categoryTips = this.tips[category];
            return categoryTips[Math.floor(Math.random() * categoryTips.length)];
        }
        
        const allTips = Object.values(this.tips).flat();
        return allTips[Math.floor(Math.random() * allTips.length)];
    }
    
    static getAllTips() {
        return this.tips;
    }
}

// 8. 语音朗读问题功能（使用浏览器TTS）
class VoiceReader {
    static speak(text, lang = 'zh-CN') {
        if (!('speechSynthesis' in window)) {
            notify.warning('您的浏览器不支持语音功能');
            return false;
        }
        
        // 停止之前的朗读
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9; // 语速
        utterance.pitch = 1.0; // 音调
        utterance.volume = 1.0; // 音量
        
        window.speechSynthesis.speak(utterance);
        return true;
    }
    
    static stop() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }
}

// 9. 答案质量实时检测
class AnswerQualityChecker {
    static check(answer) {
        const feedback = {
            length: answer.length,
            wordCount: answer.split(/\s+/).length,
            hasNumbers: /\d/.test(answer),
            hasExamples: /例如|比如|举例|比方说/.test(answer),
            hasStructure: /首先|其次|最后|第一|第二/.test(answer),
            suggestions: []
        };
        
        if (feedback.length < 50) {
            feedback.suggestions.push('回答过于简短，建议至少100字');
        }
        
        if (!feedback.hasExamples) {
            feedback.suggestions.push('建议添加具体案例或实例');
        }
        
        if (!feedback.hasStructure) {
            feedback.suggestions.push('建议使用结构化表达（如：首先...其次...）');
        }
        
        if (!feedback.hasNumbers && feedback.wordCount > 20) {
            feedback.suggestions.push('如果有数据支撑会更有说服力');
        }
        
        feedback.quality = this.calculateQuality(feedback);
        
        return feedback;
    }
    
    static calculateQuality(feedback) {
        let score = 50;
        
        if (feedback.length > 100) score += 15;
        if (feedback.length > 200) score += 10;
        if (feedback.hasExamples) score += 10;
        if (feedback.hasStructure) score += 10;
        if (feedback.hasNumbers) score += 5;
        
        return Math.min(100, score);
    }
}

// 10. 模拟面试官反应系统
class InterviewerReactions {
    static reactions = {
        excellent: [
            '很好，回答得很全面',
            '这个例子很有说服力',
            '看得出你对这个问题理解很深',
            '不错，继续'
        ],
        good: [
            '嗯，还可以',
            '有一定理解',
            '可以再深入一些吗？'
        ],
        poor: [
            '这个回答还不够具体',
            '能否举个实际的例子？',
            '你真的理解这个概念吗？'
        ]
    };
    
    static getReaction(score) {
        if (score >= 80) {
            return this.reactions.excellent[Math.floor(Math.random() * this.reactions.excellent.length)];
        } else if (score >= 60) {
            return this.reactions.good[Math.floor(Math.random() * this.reactions.good.length)];
        } else {
            return this.reactions.poor[Math.floor(Math.random() * this.reactions.poor.length)];
        }
    }
}

// 11. 面试准备清单
class InterviewChecklist {
    static getChecklist(position) {
        const common = [
            { item: '简历准备（纸质版）', checked: false },
            { item: '作品集/项目演示', checked: false },
            { item: '公司背景调研', checked: false },
            { item: '常见问题准备', checked: false },
            { item: '着装准备', checked: false },
            { item: '路线规划/会议链接确认', checked: false }
        ];
        
        const technical = [
            { item: '技术基础复习（八股文）', checked: false },
            { item: '算法题练习', checked: false },
            { item: '项目经历梳理', checked: false },
            { item: '技术栈深度准备', checked: false }
        ];
        
        return position.includes('工程师') ? [...common, ...technical] : common;
    }
    
    static saveProgress(position, checkedItems) {
        const key = `checklist_${position}`;
        Utils.safeLocalStorage.set(key, checkedItems);
    }
}

// 12. 面试成功率预测
class SuccessPrediction {
    static predict(interview, resume) {
        let confidence = 50; // 基础分
        
        // 简历质量加分
        if (resume?.analysis) {
            if (resume.analysis.projects?.length >= 3) confidence += 10;
            if (resume.analysis.work_experience?.length >= 2) confidence += 10;
            if (resume.analysis.skills?.programming_languages?.length >= 3) confidence += 5;
        }
        
        // 准备充分度加分
        if (interview.companyInfo) confidence += 10;
        if (interview.jdAnalysis) confidence += 10;
        if (interview.jobRequirements?.length > 100) confidence += 5;
        
        // 历史表现加分
        const allInterviews = storage.getInterviews();
        const completed = allInterviews.filter(i => i.status === 'completed' && i.score);
        if (completed.length > 0) {
            const avgScore = completed.reduce((sum, i) => sum + i.score, 0) / completed.length;
            if (avgScore >= 80) confidence += 15;
            else if (avgScore >= 70) confidence += 10;
            else if (avgScore >= 60) confidence += 5;
        }
        
        return {
            confidence: Math.min(95, confidence),
            level: confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low',
            suggestions: this.getSuggestions(confidence)
        };
    }
    
    static getSuggestions(confidence) {
        if (confidence >= 80) {
            return ['保持自信', '注意细节', '展现亮点'];
        } else if (confidence >= 60) {
            return ['加强项目准备', '多做模拟练习', '补充技术深度'];
        } else {
            return ['系统复习基础', '积累项目经验', '多轮模拟面试'];
        }
    }
}

// 13. 快捷键系统
class KeyboardShortcuts {
    static init() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: 快速搜索
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('.search-input:visible');
                if (searchInput) searchInput.focus();
            }
            
            // Ctrl/Cmd + N: 创建新面试
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                if (typeof showInterviewSetup === 'function') {
                    showInterviewSetup();
                }
            }
            
            // Ctrl/Cmd + H: 帮助
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                if (typeof toggleHelp === 'function') {
                    toggleHelp();
                }
            }
            
            // ESC: 关闭模态框
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    activeModal.classList.remove('active');
                }
            }
        });
    }
    
    static showShortcuts() {
        return [
            { key: 'Ctrl + K', action: '快速搜索' },
            { key: 'Ctrl + N', action: '创建新面试' },
            { key: 'Ctrl + H', action: '打开帮助' },
            { key: 'ESC', action: '关闭弹窗' }
        ];
    }
}

// 14. 答题进度自动保存
class AutoSave {
    static saveInterval = null;
    
    static start(interviewId) {
        this.stop(); // 停止之前的自动保存
        
        this.saveInterval = setInterval(() => {
            const answerInput = document.getElementById('answerInput');
            if (answerInput && answerInput.value.trim()) {
                const draft = {
                    interviewId,
                    content: answerInput.value,
                    timestamp: new Date().toISOString()
                };
                Utils.safeLocalStorage.set('answer_draft', draft);
                console.log('答案已自动保存');
            }
        }, 10000); // 每10秒保存一次
    }
    
    static stop() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }
    
    static getDraft() {
        return Utils.safeLocalStorage.get('answer_draft', null);
    }
    
    static clearDraft() {
        Utils.safeLocalStorage.remove('answer_draft');
    }
}

// 导出
window.InterviewComparison = InterviewComparison;
window.AnswerTemplates = AnswerTemplates;
window.InterviewReminder = InterviewReminder;
window.FavoriteQuestions = FavoriteQuestions;
window.StudyNotes = StudyNotes;
window.StressTestMode = StressTestMode;
window.InterviewTips = InterviewTips;
window.VoiceReader = VoiceReader;
window.AnswerQualityChecker = AnswerQualityChecker;
window.KeyboardShortcuts = KeyboardShortcuts;
window.AutoSave = AutoSave;

