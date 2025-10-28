// 网络信息采集模块

class WebInfoCollector {
    constructor() {
        this.cache = new Map();
    }
    
    // 通过AI生成公司和岗位相关信息
    async getCompanyInfo(companyName) {
        if (!companyName) return null;
        
        // 检查缓存
        const cacheKey = `company_${companyName}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const prompt = `请作为HR专家，提供关于"${companyName}"公司的面试相关信息：

1. 公司简介（100字以内）
2. 企业文化特点（3-5个关键词）
3. 面试风格和特点
4. 常见面试问题类型（3-5个）
5. 面试注意事项（2-3条）

请以JSON格式返回：
{
  "name": "${companyName}",
  "description": "公司简介",
  "culture": ["文化关键词1", "文化关键词2", "文化关键词3"],
  "interviewStyle": "面试风格描述",
  "commonQuestions": ["常见问题1", "常见问题2", "常见问题3"],
  "tips": ["注意事项1", "注意事项2"]
}

只返回JSON，不要其他内容。`;

        try {
            const response = await deepseekAPI.chatCompletion([
                { role: 'system', content: '你是资深HR专家，熟悉各大公司的面试流程。返回纯JSON格式。' },
                { role: 'user', content: prompt }
            ], 0.3, 1000);
            
            const cleanResponse = deepseekAPI.cleanJsonResponse(response);
            const companyInfo = JSON.parse(cleanResponse);
            
            // 缓存结果
            this.cache.set(cacheKey, companyInfo);
            
            return companyInfo;
        } catch (error) {
            console.error('获取公司信息失败:', error);
            return {
                name: companyName,
                description: '暂无相关信息',
                culture: [],
                interviewStyle: '常规面试',
                commonQuestions: [],
                tips: []
            };
        }
    }
    
    // 分析岗位JD，提取关键信息
    async analyzeJobDescription(jd, position) {
        if (!jd || jd.length < 50) {
            return this.generateDefaultJDAnalysis(position);
        }
        
        const prompt = `请分析以下招聘JD，提取面试重点：

岗位：${position}
JD内容：
${jd.substring(0, 2000)}

请返回JSON格式：
{
  "keyRequirements": ["核心要求1", "核心要求2", "核心要求3"],
  "technicalSkills": ["技术栈1", "技术栈2"],
  "softSkills": ["软技能1", "软技能2"],
  "experienceLevel": "初级/中级/高级",
  "focusAreas": ["面试重点1", "面试重点2", "面试重点3"],
  "salaryRange": "薪资范围（如有）",
  "highlights": ["岗位亮点1", "岗位亮点2"]
}

只返回JSON。`;

        try {
            const response = await deepseekAPI.chatCompletion([
                { role: 'system', content: '你是招聘专家，擅长分析JD。返回纯JSON格式。' },
                { role: 'user', content: prompt }
            ], 0.3, 1200);
            
            const cleanResponse = deepseekAPI.cleanJsonResponse(response);
            const analysis = JSON.parse(cleanResponse);
            
            return analysis;
        } catch (error) {
            console.error('JD分析失败:', error);
            return this.generateDefaultJDAnalysis(position);
        }
    }
    
    // 生成默认JD分析
    generateDefaultJDAnalysis(position) {
        const positionMap = {
            '前端工程师': {
                keyRequirements: ['扎实的JavaScript基础', '熟悉React/Vue框架', '良好的UI实现能力'],
                technicalSkills: ['HTML/CSS/JavaScript', 'React/Vue', 'Webpack', 'Git'],
                softSkills: ['团队协作', '沟通能力', '学习能力'],
                experienceLevel: '中级',
                focusAreas: ['框架原理', '性能优化', '工程化'],
                highlights: ['技术氛围好', '成长空间大']
            },
            '后端工程师': {
                keyRequirements: ['熟悉Java/Python/Go', '数据库设计', '微服务架构'],
                technicalSkills: ['Java/Python/Go', 'MySQL/Redis', 'Spring/Django', 'Docker'],
                softSkills: ['系统设计', '问题排查', '代码规范'],
                experienceLevel: '中级',
                focusAreas: ['数据库优化', '高并发', '分布式'],
                highlights: ['业务复杂', '技术挑战']
            },
            '算法工程师': {
                keyRequirements: ['扎实的算法基础', '机器学习经验', '数学功底'],
                technicalSkills: ['Python', 'TensorFlow/PyTorch', '算法', '数学'],
                softSkills: ['研究能力', '论文阅读', '创新思维'],
                experienceLevel: '高级',
                focusAreas: ['算法优化', '模型训练', '论文复现'],
                highlights: ['前沿技术', '研发导向']
            }
        };
        
        return positionMap[position] || {
            keyRequirements: ['相关专业背景', '工作经验', '学习能力'],
            technicalSkills: ['待确定'],
            softSkills: ['沟通能力', '团队协作'],
            experienceLevel: '不限',
            focusAreas: ['基础能力', '项目经验'],
            highlights: []
        };
    }
    
    // 搜索面经（使用AI模拟）
    async searchInterviewExperience(companyName, position) {
        const prompt = `请总结"${companyName}"公司"${position}"岗位的面试经验：

1. 面试流程（几轮面试）
2. 每轮面试重点
3. 常见问题示例（5-8个）
4. 面试官风格
5. 录取建议

返回JSON格式：
{
  "rounds": ["一面：技术基础", "二面：项目深挖", "三面：综合评估"],
  "focusPoints": {
    "round1": ["JavaScript基础", "CSS布局"],
    "round2": ["项目难点", "技术选型"],
    "round3": ["职业规划", "团队协作"]
  },
  "commonQuestions": [
    "问题1",
    "问题2",
    "问题3"
  ],
  "interviewerStyle": "面试官风格描述",
  "tips": ["建议1", "建议2", "建议3"]
}

只返回JSON。`;

        try {
            const response = await deepseekAPI.chatCompletion([
                { role: 'system', content: '你是求职顾问，熟悉各大公司面试流程。返回纯JSON。' },
                { role: 'user', content: prompt }
            ], 0.5, 1500);
            
            const cleanResponse = deepseekAPI.cleanJsonResponse(response);
            return JSON.parse(cleanResponse);
        } catch (error) {
            console.error('搜索面经失败:', error);
            return null;
        }
    }
    
    // 生成个性化面试场景
    async generateInterviewScenario(config) {
        const { position, companyName, jobRequirements, companyInfo, jdAnalysis } = config;
        
        const prompt = `基于以下信息，生成真实的面试场景描述：

岗位：${position}
公司：${companyName || '某互联网公司'}
${companyInfo ? `公司文化：${companyInfo.culture?.join('、')}` : ''}
${jdAnalysis ? `核心要求：${jdAnalysis.keyRequirements?.join('、')}` : ''}
${jobRequirements ? `JD描述：${jobRequirements.substring(0, 200)}` : ''}

请生成一个简短的面试场景描述（100字左右），包含：
- 面试官背景
- 面试环境
- 考察重点
- 氛围描述

只返回文字描述，不要JSON格式。`;

        try {
            const response = await deepseekAPI.chatCompletion([
                { role: 'system', content: '你是场景描写专家。' },
                { role: 'user', content: prompt }
            ], 0.7, 300);
            
            return response.trim();
        } catch (error) {
            console.error('生成场景失败:', error);
            return `您将面试${companyName || '公司'}的${position}岗位。面试官将从技术能力、项目经验和综合素质等方面进行考察。`;
        }
    }
}

// 导出
window.WebInfoCollector = WebInfoCollector;
window.webInfoCollector = new WebInfoCollector();

