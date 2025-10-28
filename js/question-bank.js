// 题库管理系统

class QuestionBank {
    constructor() {
        this.storageKey = 'question_bank';
    }
    
    // 获取题库
    getQuestions() {
        return Utils.safeLocalStorage.get(this.storageKey, []);
    }
    
    // 添加问题到题库
    addQuestion(question) {
        const questions = this.getQuestions();
        question.id = Utils.generateId();
        question.createdAt = new Date().toISOString();
        questions.push(question);
        Utils.safeLocalStorage.set(this.storageKey, questions);
        return question;
    }
    
    // 按类别获取问题
    getQuestionsByCategory(category) {
        const questions = this.getQuestions();
        return questions.filter(q => q.category === category);
    }
    
    // 按难度获取问题
    getQuestionsByDifficulty(difficulty) {
        const questions = this.getQuestions();
        return questions.filter(q => q.difficulty === difficulty);
    }
    
    // 搜索问题
    searchQuestions(keyword) {
        const questions = this.getQuestions();
        return questions.filter(q => 
            q.question.includes(keyword) || 
            q.tags?.some(tag => tag.includes(keyword))
        );
    }
    
    // 删除问题
    deleteQuestion(id) {
        const questions = this.getQuestions();
        const filtered = questions.filter(q => q.id !== id);
        Utils.safeLocalStorage.set(this.storageKey, filtered);
    }
    
    // 预设题库
    static getDefaultQuestions() {
        return [
            {
                category: '基础知识',
                difficulty: 'medium',
                question: '请解释JavaScript中的闭包是什么？它有什么应用场景？',
                tags: ['JavaScript', '闭包', '基础'],
                standardAnswer: '闭包是指函数能够访问其词法作用域外的变量。应用场景包括：数据私有化、函数柯里化、模块化开发等。',
                keyPoints: ['定义准确', '举例说明', '实际应用']
            },
            {
                category: '基础知识',
                difficulty: 'easy',
                question: 'HTTP和HTTPS的区别是什么？',
                tags: ['网络', 'HTTP', '安全'],
                standardAnswer: 'HTTPS是HTTP的安全版本，使用SSL/TLS加密传输数据，默认端口443，而HTTP使用明文传输，默认端口80。',
                keyPoints: ['加密', '端口', '证书']
            },
            {
                category: '项目经历',
                difficulty: 'medium',
                question: '请介绍一个你做过的最有挑战性的项目，遇到了什么困难？如何解决的？',
                tags: ['项目', '解决问题', '经验'],
                standardAnswer: '应包含：项目背景、遇到的技术难点、解决方案、最终效果、个人收获。',
                keyPoints: ['问题描述清晰', '解决方案合理', '有数据支撑', '反思总结']
            },
            {
                category: '算法',
                difficulty: 'medium',
                question: '如何判断一个链表是否有环？请说明算法思路和时间复杂度。',
                tags: ['算法', '链表', '快慢指针'],
                standardAnswer: '使用快慢指针，快指针每次走两步，慢指针每次走一步，如果有环，快慢指针最终会相遇。时间复杂度O(n)，空间复杂度O(1)。',
                keyPoints: ['算法思路', '复杂度分析', '边界情况']
            }
        ];
    }
    
    // 初始化题库
    static initializeDefaultBank() {
        const questionBank = new QuestionBank();
        const existing = questionBank.getQuestions();
        
        if (existing.length === 0) {
            const defaultQuestions = this.getDefaultQuestions();
            defaultQuestions.forEach(q => questionBank.addQuestion(q));
            return true;
        }
        
        return false;
    }
}

// 导出
window.QuestionBank = QuestionBank;

