// DeepSeek API 调用

class DeepSeekAPI {
    constructor() {
        this.model = 'deepseek-chat';
    }

    getHeaders() {
        const apiKey = storage.getApiKey();
        if (!apiKey) {
            throw new Error('请先配置API Key');
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };
    }

    getBaseUrl() {
        return storage.getApiBaseUrl();
    }

    async chatCompletion(messages, temperature = 0.7, maxTokens = 2000, retries = 3) {
        const url = `${this.getBaseUrl()}/chat/completions`;
        
        // 检查缓存
        const cacheKey = JSON.stringify({ messages, temperature, maxTokens });
        if (window.cacheManager) {
            const cached = window.cacheManager.get(cacheKey);
            if (cached) {
                console.log('使用缓存结果');
                return cached;
            }
        }
        
        let lastError;
        
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), APP_CONFIG.api.timeout);
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        model: this.model,
                        messages: messages,
                        temperature: temperature,
                        max_tokens: maxTokens
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeout);

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'API调用失败');
                }

                const data = await response.json();
                const result = data.choices[0].message.content;
                
                // 缓存结果
                if (window.cacheManager) {
                    window.cacheManager.set(cacheKey, result);
                }
                
                return result;
            } catch (error) {
                lastError = error;
                console.error(`API调用失败 (尝试 ${attempt + 1}/${retries}):`, error);
                
                if (attempt < retries - 1) {
                    // 指数退避策略
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError || new Error('API调用失败');
    }

    // 测试API连接
    async testConnection() {
        try {
            const response = await this.chatCompletion([
                { role: 'user', content: '你好' }
            ], 0.7, 50);
            return { success: true, message: 'API连接成功！' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // 分析简历
    async analyzeResume(resumeContent) {
        const prompt = `请作为资深HR，深度分析以下简历，提取所有关键信息。

简历内容：
${resumeContent.substring(0, 4000)}

请返回详细的JSON分析结果：
{
  "summary": "候选人的整体评价和背景概述（100-150字）",
  "name": "姓名",
  "contact": {
    "phone": "电话",
    "email": "邮箱",
    "location": "所在地"
  },
  "education": [
    {
      "school": "学校名称",
      "degree": "学位（本科/硕士/博士）",
      "major": "专业",
      "duration": "时间段",
      "gpa": "GPA（如有）"
    }
  ],
  "work_experience": [
    {
      "company": "公司名称",
      "position": "职位",
      "duration": "时间段",
      "responsibilities": ["职责1", "职责2"],
      "achievements": ["成就1", "成就2"]
    }
  ],
  "projects": [
    {
      "name": "项目名称",
      "role": "担任角色",
      "duration": "时间段",
      "description": "项目描述",
      "tech_stack": "使用的技术栈",
      "achievements": "项目成果"
    }
  ],
  "skills": {
    "programming_languages": ["编程语言"],
    "frameworks": ["框架和库"],
    "databases": ["数据库"],
    "tools": ["开发工具"],
    "other": ["其他技能"]
  },
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["待改进1", "待改进2"]
}

要求：
1. 仔细阅读简历，提取所有关键信息
2. 项目和工作经历要详细，包含技术栈和成就
3. 技能要分类整理
4. 优势和劣势要客观分析
5. 如果某项信息缺失，可以标记为"未提供"或空列表
6. 只返回纯JSON，不要markdown标记`;

        const messages = [
            { role: 'system', content: '你是一个专业的HR助手，擅长分析简历。请只返回JSON格式的数据，不要添加任何其他文字。' },
            { role: 'user', content: prompt }
        ];

        try {
            const response = await this.chatCompletion(messages, 0.3, 2500);
            const cleanResponse = this.cleanJsonResponse(response);
            const analysis = JSON.parse(cleanResponse);
            
            // 确保基本字段存在
            if (!analysis.summary) analysis.summary = '简历分析完成';
            if (!analysis.projects) analysis.projects = [];
            if (!analysis.skills) analysis.skills = {};
            
            return analysis;
        } catch (error) {
            console.error('简历分析失败:', error);
            return {
                summary: '简历内容已读取，但AI解析格式有误',
                education: [],
                work_experience: [],
                projects: [],
                skills: { other: ['待手动分析'] },
                strengths: ['简历已上传'],
                weaknesses: ['需要人工审核'],
                error: error.message
            };
        }
    }

    // 生成单个面试问题
    async generateQuestion(interview, stage, questionIndex, previousQA = []) {
        const stageNames = {
            1: '基础知识（八股文）',
            2: '项目经历和实习经验',
            3: interview.isTechnical ? '算法题' : '综合能力'
        };

        const stageTypes = {
            1: 'basic',
            2: 'project',
            3: interview.isTechnical ? 'algorithm' : 'other'
        };

        const resume = storage.getResumeById(interview.resumeId);
        const resumeAnalysis = resume?.analysis || { summary: '待分析', projects: [] };

        let context = `岗位：${interview.position}
公司：${interview.companyName || '未知'}
候选人技能：${interview.skills?.join(', ') || '待评估'}
简历摘要：${resumeAnalysis.summary}`;

        // 添加公司信息
        if (interview.companyInfo) {
            context += `\n公司简介：${interview.companyInfo.description || ''}`;
            if (interview.companyInfo.culture && interview.companyInfo.culture.length > 0) {
                context += `\n企业文化：${interview.companyInfo.culture.join('、')}`;
            }
            if (interview.companyInfo.interviewStyle) {
                context += `\n面试风格：${interview.companyInfo.interviewStyle}`;
            }
        }

        // 添加JD分析结果
        if (interview.jdAnalysis) {
            if (interview.jdAnalysis.keyRequirements && interview.jdAnalysis.keyRequirements.length > 0) {
                context += `\n岗位核心要求：${interview.jdAnalysis.keyRequirements.join('、')}`;
            }
            if (interview.jdAnalysis.focusAreas && interview.jdAnalysis.focusAreas.length > 0) {
                context += `\n面试重点：${interview.jdAnalysis.focusAreas.join('、')}`;
            }
        }

        if (interview.jobRequirements) {
            context += `\n招聘要求：${interview.jobRequirements.substring(0, 200)}`;
        }

        if (stage === 2 && resumeAnalysis.projects?.length > 0) {
            context += '\n\n候选人的项目/实习经历：';
            resumeAnalysis.projects.slice(0, 3).forEach((proj, i) => {
                if (typeof proj === 'object') {
                    context += `\n${i + 1}. ${proj.name || '项目'}: ${proj.description?.substring(0, 100) || ''}`;
                }
            });
        }

        if (previousQA.length > 0) {
            context += '\n\n之前的问答记录：';
            previousQA.forEach((qa, i) => {
                context += `\n问题${i + 1}: ${qa.question}`;
                context += `\n回答: ${qa.answer.substring(0, 100)}...`;
            });
        }

        // 构建增强的提示词
        let additionalRequirements = '';
        if (interview.companyInfo?.interviewStyle) {
            additionalRequirements += `\n- 面试风格：${interview.companyInfo.interviewStyle}`;
        }
        if (interview.jdAnalysis?.focusAreas) {
            additionalRequirements += `\n- 重点考察：${interview.jdAnalysis.focusAreas.join('、')}`;
        }

        const prompt = `你现在是${interview.companyName || '公司'}的资深${interview.position}面试官，请为候选人生成第${questionIndex + 1}个${stageNames[stage]}问题。

${context}${additionalRequirements}

要求：
1. 这是第${questionIndex + 1}个问题，请从不同角度考察
2. 难度适中，既能考察基础又能深入
3. 结合公司实际业务场景和技术栈
4. 问题要具有针对性和区分度
5. 避免与之前的问题重复
6. 问题长度控制在100字以内

返回JSON格式：
{
  "question": "具体的问题内容",
  "type": "${stageTypes[stage]}",
  "difficulty": "medium",
  "time_limit": 300,
  "key_points": ["考察点1", "考察点2"]
}

只返回JSON，不要其他文字。`;

        const messages = [
            { role: 'system', content: '你是资深面试官。返回纯JSON格式，不要markdown标记。' },
            { role: 'user', content: prompt }
        ];

        try {
            const response = await this.chatCompletion(messages, 0.8, 800);
            const cleanResponse = this.cleanJsonResponse(response);
            const question = JSON.parse(cleanResponse);
            
            if (!question.question) {
                throw new Error('问题格式无效');
            }
            
            return question;
        } catch (error) {
            console.error('生成问题失败:', error);
            throw error;
        }
    }

    // 评估答案
    async evaluateAnswer(question, answer, keyPoints = []) {
        const keyPointsStr = keyPoints.length > 0 ? keyPoints.join(', ') : '综合能力';

        const prompt = `请评估以下面试回答：

问题：${question}
考察要点：${keyPointsStr}
候选人回答：${answer}

请返回JSON格式的评估结果：
{
  "score": 85,
  "feedback": "简洁明了的总体评价（50字以内）",
  "strengths": ["优点1", "优点2"],
  "improvements": ["改进建议1", "改进建议2"]
}

要求：
1. score: 0-100的整数
2. feedback: 一段话总结，50字以内
3. strengths: 数组，2-3个优点
4. improvements: 数组，2-3个改进建议

只返回JSON，不要其他文字。`;

        const messages = [
            { role: 'system', content: '你是公正的面试评委。返回纯JSON格式，不要markdown标记。' },
            { role: 'user', content: prompt }
        ];

        try {
            const response = await this.chatCompletion(messages, 0.3, 800);
            const cleanResponse = this.cleanJsonResponse(response);
            const evaluation = JSON.parse(cleanResponse);
            
            // 验证格式
            if (!Array.isArray(evaluation.strengths)) evaluation.strengths = [];
            if (!Array.isArray(evaluation.improvements)) evaluation.improvements = [];
            if (typeof evaluation.score !== 'number') evaluation.score = 60;
            
            return evaluation;
        } catch (error) {
            console.error('评估失败:', error);
            // 简单评分降级方案
            const answerLength = answer.length;
            let score = 60;
            if (answerLength < 30) score = 35;
            else if (answerLength < 80) score = 50;
            else if (answerLength < 150) score = 65;
            else if (answerLength < 300) score = 75;
            else score = 80;

            return {
                score: score,
                feedback: '回答基本合理，但需要更详细的展开。',
                strengths: ['有一定理解'],
                improvements: ['可以更深入', '增加实例说明']
            };
        }
    }

    // 清理JSON响应（移除markdown标记）
    cleanJsonResponse(response) {
        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith('```')) {
            cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        return cleaned.trim();
    }
}

const deepseekAPI = new DeepSeekAPI();

