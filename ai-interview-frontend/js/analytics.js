// 数据分析和可视化模块

class Analytics {
    // 生成能力雷达图数据
    static generateSkillRadarData(interview) {
        const categories = {
            '基础知识': 0,
            '项目经验': 0,
            '沟通表达': 0,
            '逻辑思维': 0,
            '专业深度': 0
        };
        
        if (!interview.evaluations) return categories;
        
        // 从评分中提取各维度数据
        Object.keys(interview.evaluations).forEach(key => {
            const evaluation = interview.evaluations[key];
            if (evaluation.score) {
                if (key.includes('stage_1')) {
                    categories['基础知识'] += evaluation.score;
                } else if (key.includes('stage_2')) {
                    categories['项目经验'] += evaluation.score;
                }
                categories['逻辑思维'] += evaluation.score * 0.3;
                categories['沟通表达'] += evaluation.score * 0.2;
                categories['专业深度'] += evaluation.score * 0.2;
            }
        });
        
        // 归一化到100分制
        Object.keys(categories).forEach(key => {
            categories[key] = Math.min(100, Math.round(categories[key] / 3));
        });
        
        return categories;
    }
    
    // 分析进步趋势
    static analyzeTrend(interviews) {
        const completedInterviews = interviews
            .filter(i => i.status === 'completed' && i.score)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        if (completedInterviews.length < 2) {
            return { trend: 'insufficient', message: '需要更多面试数据' };
        }
        
        const scores = completedInterviews.map(i => i.score);
        const recent = scores.slice(-3);
        const previous = scores.slice(-6, -3);
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const previousAvg = previous.length > 0 
            ? previous.reduce((a, b) => a + b, 0) / previous.length 
            : scores[0];
        
        const improvement = recentAvg - previousAvg;
        
        if (improvement > 5) {
            return { trend: 'up', message: '进步明显', value: improvement };
        } else if (improvement < -5) {
            return { trend: 'down', message: '需要加强', value: improvement };
        } else {
            return { trend: 'stable', message: '保持稳定', value: improvement };
        }
    }
    
    // 识别弱点
    static identifyWeaknesses(interviews) {
        const weaknesses = [];
        const stageTotals = { 1: [], 2: [], 3: [] };
        
        interviews.forEach(interview => {
            if (!interview.evaluations) return;
            
            for (let stage = 1; stage <= 3; stage++) {
                const stageKey = `stage_${stage}`;
                Object.keys(interview.evaluations).forEach(key => {
                    if (key.startsWith(stageKey) && !key.includes('followup')) {
                        const score = interview.evaluations[key].score;
                        if (score) stageTotals[stage].push(score);
                    }
                });
            }
        });
        
        const stageNames = {
            1: '基础知识',
            2: '项目经历',
            3: '综合能力'
        };
        
        Object.keys(stageTotals).forEach(stage => {
            const scores = stageTotals[stage];
            if (scores.length > 0) {
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                if (avg < 70) {
                    weaknesses.push({
                        area: stageNames[stage],
                        score: Math.round(avg),
                        suggestion: this.getSuggestionForArea(stageNames[stage], avg)
                    });
                }
            }
        });
        
        return weaknesses.sort((a, b) => a.score - b.score);
    }
    
    // 获取改进建议
    static getSuggestionForArea(area, score) {
        const suggestions = {
            '基础知识': '建议系统复习技术基础，多刷八股文题目',
            '项目经历': '需要积累更多项目经验，深入总结项目亮点',
            '综合能力': '加强算法训练，提升问题解决能力'
        };
        
        return suggestions[area] || '继续努力练习';
    }
    
    // 生成学习建议
    static generateLearningPath(weaknesses, interviews) {
        const suggestions = [];
        
        weaknesses.forEach(weakness => {
            suggestions.push({
                area: weakness.area,
                priority: weakness.score < 60 ? 'high' : 'medium',
                actions: [
                    `重点复习${weakness.area}相关知识`,
                    `每天练习3-5道相关题目`,
                    `总结常见问题和标准答案`,
                    `进行针对性模拟面试`
                ],
                resources: [
                    '推荐书籍/课程',
                    '在线题库链接',
                    '相关技术文档'
                ]
            });
        });
        
        return suggestions;
    }
    
    // 计算完成度
    static calculateCompleteness(interview) {
        const totalQuestions = 9; // 3阶段 * 3题
        let answeredCount = 0;
        
        if (interview.answers) {
            answeredCount = Object.keys(interview.answers).filter(key => 
                !key.includes('followup') && interview.answers[key] && interview.answers[key] !== '（已跳过）'
            ).length;
        }
        
        return Math.round((answeredCount / totalQuestions) * 100);
    }
    
    // 生成时间统计
    static generateTimeStats(interviews) {
        const stats = {
            totalTime: 0,
            avgTime: 0,
            fastest: null,
            slowest: null
        };
        
        const completedInterviews = interviews.filter(i => 
            i.status === 'completed' && i.completedAt
        );
        
        if (completedInterviews.length === 0) return stats;
        
        const durations = completedInterviews.map(i => {
            const start = new Date(i.createdAt);
            const end = new Date(i.completedAt);
            return end - start;
        });
        
        stats.totalTime = durations.reduce((a, b) => a + b, 0);
        stats.avgTime = Math.round(stats.totalTime / durations.length);
        stats.fastest = Math.min(...durations);
        stats.slowest = Math.max(...durations);
        
        return stats;
    }
}

// 导出
window.Analytics = Analytics;

