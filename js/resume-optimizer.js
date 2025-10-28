// 简历优化建议模块

class ResumeOptimizer {
    // 生成简历优化建议（结合岗位和公司）
    static async generateOptimizationSuggestions(resumeId, position, companyName = null) {
        const resume = storage.getResumeById(resumeId);
        if (!resume || !resume.analysis) {
            throw new Error('简历数据不存在');
        }
        
        // 获取公司信息（如果有）
        let companyInfo = null;
        if (companyName) {
            companyInfo = await webInfoCollector.getCompanyInfo(companyName);
        }
        
        const prompt = `请作为资深HR和简历优化专家，为以下候选人的简历提供优化建议：

【候选人简历分析】
${JSON.stringify(resume.analysis, null, 2).substring(0, 3000)}

【目标岗位】
${position}

${companyName ? `【目标公司】
${companyName}
${companyInfo ? `
公司简介：${companyInfo.description}
企业文化：${companyInfo.culture?.join('、')}
面试风格：${companyInfo.interviewStyle}
` : ''}` : ''}

请从以下维度提供具体、可操作的优化建议：

1. **整体定位**：简历是否匹配目标岗位
2. **内容优化**：
   - 项目经历的描述是否突出
   - 技术栈是否匹配岗位要求
   - 是否有量化成果
3. **针对性调整**：
   - 如何突出与目标公司文化匹配的特质
   - 哪些经历应该重点强调
   - 哪些内容可以删减
4. **关键词优化**：应该增加哪些关键词
5. **格式建议**：布局、排版的改进

返回JSON格式：
{
  "matchScore": 75,
  "matchLevel": "较匹配/基本匹配/需要调整",
  "overallSuggestion": "总体建议（100字）",
  "contentOptimization": [
    {
      "section": "项目经历",
      "issue": "问题描述",
      "suggestion": "具体建议",
      "priority": "high/medium/low",
      "example": "优化示例"
    }
  ],
  "keywordsToAdd": ["关键词1", "关键词2"],
  "keywordsToRemove": ["关键词1", "关键词2"],
  "highlightPoints": ["应该重点突出的亮点1", "亮点2"],
  "cultureMatch": {
    "matchedTraits": ["匹配的特质1", "特质2"],
    "suggestedTraits": ["建议补充的特质1", "特质2"]
  },
  "actionItems": [
    "具体行动项1",
    "具体行动项2",
    "具体行动项3"
  ]
}

只返回JSON。`;

        try {
            const response = await deepseekAPI.chatCompletion([
                { role: 'system', content: '你是资深HR和简历优化专家。返回纯JSON格式。' },
                { role: 'user', content: prompt }
            ], 0.3, 2500);
            
            const cleanResponse = deepseekAPI.cleanJsonResponse(response);
            const suggestions = JSON.parse(cleanResponse);
            
            return suggestions;
        } catch (error) {
            console.error('生成优化建议失败:', error);
            throw error;
        }
    }
    
    // 生成简历优化报告HTML
    static generateOptimizationReport(suggestions, position, companyName) {
        const matchColors = {
            '高度匹配': '#059669',
            '较匹配': '#3b82f6',
            '基本匹配': '#d97706',
            '需要调整': '#dc2626'
        };
        
        const matchColor = matchColors[suggestions.matchLevel] || '#6b7280';
        
        let html = `
            <div class="optimization-report">
                <div class="report-header">
                    <h2>简历优化建议</h2>
                    <p class="report-target">目标岗位：${position}${companyName ? ` @ ${companyName}` : ''}</p>
                    <div class="match-score-wrapper">
                        <div class="match-score" style="color: ${matchColor}">
                            <span class="score-number">${suggestions.matchScore}</span>
                            <span class="score-label">匹配度</span>
                        </div>
                        <div class="match-level" style="color: ${matchColor}">${suggestions.matchLevel}</div>
                    </div>
                </div>
                
                <div class="optimization-section">
                    <h3>总体建议</h3>
                    <p class="overall-suggestion">${suggestions.overallSuggestion}</p>
                </div>
        `;
        
        // 内容优化建议
        if (suggestions.contentOptimization && suggestions.contentOptimization.length > 0) {
            html += `
                <div class="optimization-section">
                    <h3>内容优化</h3>
                    ${suggestions.contentOptimization.map(item => `
                        <div class="optimization-item priority-${item.priority}">
                            <div class="item-header">
                                <span class="item-section">${item.section}</span>
                                <span class="item-priority ${item.priority}">${item.priority === 'high' ? '高优先级' : item.priority === 'medium' ? '中优先级' : '低优先级'}</span>
                            </div>
                            <div class="item-content">
                                <p><strong>问题：</strong>${item.issue}</p>
                                <p><strong>建议：</strong>${item.suggestion}</p>
                                ${item.example ? `<div class="item-example">
                                    <strong>示例：</strong>
                                    <pre>${item.example}</pre>
                                </div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // 关键词优化
        if ((suggestions.keywordsToAdd && suggestions.keywordsToAdd.length > 0) || 
            (suggestions.keywordsToRemove && suggestions.keywordsToRemove.length > 0)) {
            html += `
                <div class="optimization-section">
                    <h3>关键词优化</h3>
                    ${suggestions.keywordsToAdd && suggestions.keywordsToAdd.length > 0 ? `
                        <div class="keywords-box">
                            <strong>建议添加：</strong>
                            ${suggestions.keywordsToAdd.map(k => `<span class="keyword-tag add">${k}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${suggestions.keywordsToRemove && suggestions.keywordsToRemove.length > 0 ? `
                        <div class="keywords-box">
                            <strong>建议删减：</strong>
                            ${suggestions.keywordsToRemove.map(k => `<span class="keyword-tag remove">${k}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        // 亮点突出
        if (suggestions.highlightPoints && suggestions.highlightPoints.length > 0) {
            html += `
                <div class="optimization-section">
                    <h3>应重点突出</h3>
                    <ul class="highlight-list">
                        ${suggestions.highlightPoints.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        // 文化匹配
        if (suggestions.cultureMatch) {
            html += `
                <div class="optimization-section">
                    <h3>企业文化匹配</h3>
                    ${suggestions.cultureMatch.matchedTraits && suggestions.cultureMatch.matchedTraits.length > 0 ? `
                        <div class="culture-box">
                            <strong>已匹配特质：</strong>
                            ${suggestions.cultureMatch.matchedTraits.map(t => `<span class="culture-tag matched">${t}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${suggestions.cultureMatch.suggestedTraits && suggestions.cultureMatch.suggestedTraits.length > 0 ? `
                        <div class="culture-box">
                            <strong>建议补充：</strong>
                            ${suggestions.cultureMatch.suggestedTraits.map(t => `<span class="culture-tag suggested">${t}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        // 行动清单
        if (suggestions.actionItems && suggestions.actionItems.length > 0) {
            html += `
                <div class="optimization-section action-section">
                    <h3>立即行动清单</h3>
                    <div class="action-items">
                        ${suggestions.actionItems.map((action, index) => `
                            <div class="action-item">
                                <input type="checkbox" id="action${index}">
                                <label for="action${index}">${action}</label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        html += `
                <div class="report-actions">
                    <button class="btn btn-primary" onclick="exportOptimizationReport(${suggestions})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        导出优化建议
                    </button>
                    <button class="btn btn-secondary" onclick="closeModal('resultModal')">关闭</button>
                </div>
            </div>
        `;
        
        return html;
    }
}

// 导出
window.ResumeOptimizer = ResumeOptimizer;

