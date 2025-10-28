// 简历管理功能

// 初始化简历上传
function initResumeUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('resumeFile');

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--thinking-orange)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-color)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    // 文件选择上传
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // 搜索功能
    const searchInput = document.getElementById('resumeSearch');
    if (searchInput) {
        searchInput.addEventListener('input', Utils.debounce((e) => {
            filterResumeList();
        }, 300));
    }
    
    // 状态筛选
    const filterSelect = document.getElementById('resumeFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            filterResumeList();
        });
    }
}

// 筛选简历列表
function filterResumeList() {
    const searchTerm = document.getElementById('resumeSearch')?.value.toLowerCase() || '';
    const filterStatus = document.getElementById('resumeFilter')?.value || 'all';
    
    let resumes = storage.getResumes();
    
    // 状态筛选
    if (filterStatus === 'analyzed') {
        resumes = resumes.filter(r => r.analysis);
    } else if (filterStatus === 'pending') {
        resumes = resumes.filter(r => !r.analysis);
    }
    
    // 搜索筛选
    if (searchTerm) {
        resumes = resumes.filter(r => 
            r.filename.toLowerCase().includes(searchTerm) ||
            r.analysis?.summary?.toLowerCase().includes(searchTerm) ||
            r.analysis?.name?.toLowerCase().includes(searchTerm)
        );
    }
    
    renderResumeList(resumes);
}

// 渲染简历列表
function renderResumeList(resumes) {
    const container = document.getElementById('resumeList');
    
    // 更新计数
    const resumeCount = document.getElementById('resumeCount');
    if (resumeCount) {
        const allResumes = storage.getResumes();
        resumeCount.textContent = `${allResumes.length} 份简历`;
    }
    
    if (resumes.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:3rem;">暂无匹配的简历</p>';
        return;
    }
    
    container.innerHTML = resumes.map(resume => `
        <div class="resume-card glass-card">
            <div class="resume-main">
                <div class="resume-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                </div>
                <div class="resume-info">
                    <h4 class="resume-filename">${resume.filename}</h4>
                    <div class="resume-meta">
                        <span class="meta-item">
                            ${new Date(resume.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                        <span class="meta-item">
                            ${resume.analysis ? '<span class="status-badge status-success">已分析</span>' : '<span class="status-badge status-pending">待分析</span>'}
                        </span>
                        ${resume.optimizations && resume.optimizations.length > 0 ? `
                            <span class="meta-item">
                                <span class="status-badge badge-primary">${resume.optimizations.length}个优化建议</span>
                            </span>
                        ` : ''}
                        ${resume.size ? `<span class="meta-item">
                            ${formatFileSize(resume.size)}
                        </span>` : ''}
                    </div>
                    ${resume.analysis?.summary ? `
                        <p class="resume-summary">${Utils.truncate(resume.analysis.summary, 120)}</p>
                    ` : ''}
                </div>
            </div>
            <div class="resume-actions">
                <button class="btn btn-primary btn-small" onclick="viewResumeAnalysis(${resume.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span class="btn-text">查看</span>
                </button>
                <button class="btn btn-secondary btn-small" onclick="optimizeResume(${resume.id})" title="生成针对性的简历优化建议">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span class="btn-text">${resume.optimizations && resume.optimizations.length > 0 ? '查看建议' : '优化建议'}</span>
                </button>
                <button class="btn btn-secondary btn-small" onclick="reanalyzeResume(${resume.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    <span class="btn-text">重新分析</span>
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteResume(${resume.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span class="btn-text">删除</span>
                </button>
            </div>
        </div>
    `).join('');
}

// 批量分析简历
async function batchAnalyzeResumes() {
    const resumes = storage.getResumes();
    const pendingResumes = resumes.filter(r => !r.analysis);
    
    if (pendingResumes.length === 0) {
        notify.info('所有简历都已分析完成');
        return;
    }
    
    notify.confirm(
        `发现 ${pendingResumes.length} 份待分析简历，是否批量分析？`,
        async () => {
            const loader = notify.loading(`正在分析简历 0/${pendingResumes.length}...`);
            let successCount = 0;
            let failCount = 0;
            
            for (let i = 0; i < pendingResumes.length; i++) {
                const resume = pendingResumes[i];
                loader.update(`正在分析简历 ${i + 1}/${pendingResumes.length}...`);
                
                try {
                    const analysis = await deepseekAPI.analyzeResume(resume.content);
                    storage.updateResume(resume.id, { analysis: analysis });
                    successCount++;
                } catch (error) {
                    console.error(`分析简历 ${resume.filename} 失败:`, error);
                    failCount++;
                }
                
                // 延迟，避免API频率限制
                if (i < pendingResumes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            loader.close();
            
            if (failCount === 0) {
                notify.success(`批量分析完成！成功分析 ${successCount} 份简历`);
            } else {
                notify.warning(`批量分析完成：成功 ${successCount} 份，失败 ${failCount} 份`);
            }
            
            loadResumeList();
            
            if (typeof updateHomeStats === 'function') {
                updateHomeStats();
            }
        }
    );
}

// 处理文件上传
async function handleFileUpload(file) {
    // 验证文件类型
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
        notify.error('仅支持 PDF, DOC, DOCX, TXT 格式的文件');
        return;
    }

    // 验证文件大小（最大5MB）
    const maxSize = APP_CONFIG.upload.maxSize;
    if (file.size > maxSize) {
        notify.error(`文件大小不能超过 ${Utils.formatFileSize(maxSize)}`);
        return;
    }

    const loader = notify.loading('正在读取简历...');

    try {
        // 读取文件内容
        const content = await readFileContent(file);
        
        if (!content || content.trim().length < 50) {
            loader.close();
            notify.error('简历内容过短或无法读取，请检查文件');
            return;
        }

        loader.update('正在AI分析简历...');

        // 调用AI分析
        const analysis = await deepseekAPI.analyzeResume(content);

        // 保存简历
        const resume = {
            filename: file.name,
            content: content,
            analysis: analysis,
            size: file.size
        };

        storage.saveResume(resume);
        
        loader.close();
        notify.success('简历上传成功！AI已完成分析');
        
        // 刷新简历列表
        loadResumeList();
        
        // 刷新首页统计
        if (typeof updateHomeStats === 'function') {
            updateHomeStats();
        }
        
    } catch (error) {
        loader.close();
        console.error('简历上传失败:', error);
        const errorMsg = Utils.handleError(error, '简历上传');
        notify.error(errorMsg);
    }
}

// 读取文件内容
async function readFileContent(file) {
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    // TXT文件直接读取
    if (fileExt === 'txt' || file.type.includes('text')) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file, 'UTF-8');
        });
    }
    
    // PDF文件使用pdf.js解析
    if (fileExt === 'pdf') {
        return await parsePDF(file);
    }
    
    // DOC/DOCX文件提示手动输入
    if (fileExt === 'doc' || fileExt === 'docx') {
        return new Promise((resolve, reject) => {
            const useTextInput = confirm(
                'DOC/DOCX文件需要手动处理。\n\n' +
                '建议：\n' +
                '1. 点击"确定"手动输入简历内容\n' +
                '2. 点击"取消"，将简历转换为TXT或PDF格式后重新上传'
            );
            
            if (useTextInput) {
                const manualContent = prompt('请粘贴您的简历内容：', '');
                if (manualContent && manualContent.trim().length > 50) {
                    resolve(manualContent);
                } else {
                    reject(new Error('简历内容不能为空'));
                }
            } else {
                reject(new Error('已取消上传'));
            }
        });
    }
    
    throw new Error('不支持的文件格式');
}

// 解析PDF文件
async function parsePDF(file) {
    try {
        // 配置pdf.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        } else {
            throw new Error('PDF.js库未加载');
        }
        
        // 读取文件为ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // 加载PDF文档
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        
        // 遍历所有页面
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // 提取文本
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            
            fullText += pageText + '\n\n';
        }
        
        // 清理文本
        fullText = fullText
            .replace(/\s+/g, ' ')  // 多个空格替换为单个
            .replace(/\n\s*\n/g, '\n')  // 多个换行替换为单个
            .trim();
        
        if (fullText.length < 50) {
            throw new Error('PDF内容过短或解析失败');
        }
        
        console.log(`✓ PDF解析成功，共${pdf.numPages}页，提取${fullText.length}字符`);
        return fullText;
        
    } catch (error) {
        console.error('PDF解析失败:', error);
        
        // 降级方案：提示手动输入
        const useManual = confirm(
            `PDF自动解析失败: ${error.message}\n\n` +
            '是否手动输入简历内容？\n' +
            '（建议：可以先用PDF阅读器复制文本）'
        );
        
        if (useManual) {
            const manualContent = prompt('请粘贴您的简历内容：', '');
            if (manualContent && manualContent.trim().length > 50) {
                return manualContent;
            } else {
                throw new Error('简历内容不能为空');
            }
        } else {
            throw new Error('PDF解析失败，已取消上传');
        }
    }
}

// 加载简历列表（主入口）
function loadResumeList() {
    // 触发筛选逻辑，会调用renderResumeList
    filterResumeList();
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 查看简历分析
function viewResumeAnalysis(resumeId) {
    const resume = storage.getResumeById(resumeId);
    if (!resume || !resume.analysis) {
        notify.warning('简历分析数据不存在');
        return;
    }
    
    const analysis = resume.analysis;
    
    let html = `
        <div style="max-height:60vh;overflow-y:auto;padding:1rem;">
            <h3 style="color:#2563eb;margin-bottom:1.5rem;font-size:1.5rem;">${resume.filename}</h3>
            
            <div style="margin-bottom:1.5rem;padding:1rem;background:var(--bg-secondary,#f9fafb);border-radius:8px;">
                <h4 style="font-size:1rem;margin-bottom:0.75rem;color:var(--text-primary,#111827);">整体评价</h4>
                <p style="color:var(--text-secondary,#6b7280);line-height:1.6;">${analysis.summary || '暂无'}</p>
            </div>
    `;
    
    if (analysis.education && analysis.education.length > 0) {
        html += `
            <div style="margin-bottom:1.5rem;padding:1rem;background:var(--bg-secondary,#f9fafb);border-radius:8px;">
                <h4 style="font-size:1rem;margin-bottom:0.75rem;color:var(--text-primary,#111827);">教育背景</h4>
                ${analysis.education.map(edu => `
                    <p style="margin-bottom:0.5rem;"><strong>${edu.school || '未知'}</strong> - ${edu.major || ''} (${edu.degree || ''})</p>
                    <p style="color:#6b7280;font-size:0.875rem;margin-bottom:0.75rem;">${edu.duration || ''}</p>
                `).join('')}
            </div>
        `;
    }
    
    if (analysis.work_experience && analysis.work_experience.length > 0) {
        html += `
            <div style="margin-bottom:1.5rem;padding:1rem;background:var(--bg-secondary,#f9fafb);border-radius:8px;">
                <h4 style="font-size:1rem;margin-bottom:0.75rem;color:var(--text-primary,#111827);">工作经历</h4>
                ${analysis.work_experience.map(work => `
                    <p style="margin-bottom:0.5rem;"><strong>${work.company || '未知'}</strong> - ${work.position || ''}</p>
                    <p style="color:#6b7280;font-size:0.875rem;margin-bottom:0.5rem;">${work.duration || ''}</p>
                    ${work.achievements ? `<ul style="margin-left:1.5rem;color:#6b7280;">${work.achievements.map(a => `<li style="margin-bottom:0.25rem;">${a}</li>`).join('')}</ul>` : ''}
                `).join('')}
            </div>
        `;
    }
    
    if (analysis.projects && analysis.projects.length > 0) {
        html += `
            <div style="margin-bottom:1.5rem;">
                <h4>🚀 项目经历</h4>
                ${analysis.projects.map(proj => `
                    <p><strong>${proj.name || '项目'}</strong> ${proj.role ? `- ${proj.role}` : ''}</p>
                    <p style="color:var(--text-secondary);font-size:0.9rem;">${proj.description || ''}</p>
                    ${proj.tech_stack ? `<p style="font-size:0.9rem;">技术栈：${proj.tech_stack}</p>` : ''}
                `).join('')}
            </div>
        `;
    }
    
    if (analysis.skills) {
        html += `
            <div style="margin-bottom:1.5rem;">
                <h4>🛠️ 技能清单</h4>
        `;
        
        if (analysis.skills.programming_languages?.length > 0) {
            html += `<p><strong>编程语言：</strong>${analysis.skills.programming_languages.join(', ')}</p>`;
        }
        if (analysis.skills.frameworks?.length > 0) {
            html += `<p><strong>框架/库：</strong>${analysis.skills.frameworks.join(', ')}</p>`;
        }
        if (analysis.skills.databases?.length > 0) {
            html += `<p><strong>数据库：</strong>${analysis.skills.databases.join(', ')}</p>`;
        }
        if (analysis.skills.tools?.length > 0) {
            html += `<p><strong>工具：</strong>${analysis.skills.tools.join(', ')}</p>`;
        }
        
        html += `</div>`;
    }
    
    if (analysis.strengths && analysis.strengths.length > 0) {
        html += `
            <div style="margin-bottom:1.5rem;">
                <h4>✨ 优势</h4>
                <ul style="margin-left:1.5rem;">
                    ${analysis.strengths.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (analysis.weaknesses && analysis.weaknesses.length > 0) {
        html += `
            <div style="margin-bottom:1.5rem;">
                <h4>📈 待改进</h4>
                <ul style="margin-left:1.5rem;">
                    ${analysis.weaknesses.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    html += `</div>`;
    
    showModal('resultModal', html);
}

// 重新分析简历
async function reanalyzeResume(resumeId) {
    const resume = storage.getResumeById(resumeId);
    if (!resume) {
        notify.error('简历不存在');
        return;
    }
    
    notify.confirm('确定要重新分析这份简历吗？', async () => {
        const loader = notify.loading('正在重新分析简历...');
        
        try {
            const analysis = await deepseekAPI.analyzeResume(resume.content);
            storage.updateResume(resumeId, { analysis: analysis });
            
            loader.close();
            notify.success('简历重新分析完成！');
            loadResumeList();
            
            if (typeof updateHomeStats === 'function') {
                updateHomeStats();
            }
        } catch (error) {
            loader.close();
            const errorMsg = Utils.handleError(error, '简历分析');
            notify.error(errorMsg);
        }
    });
}

// 简历优化建议
async function optimizeResume(resumeId) {
    const resume = storage.getResumeById(resumeId);
    if (!resume || !resume.analysis) {
        notify.warning('请先完成简历分析');
        return;
    }
    
    // 如果已有优化建议，显示选择界面
    if (resume.optimizations && resume.optimizations.length > 0) {
        showOptimizationHistory(resumeId);
        return;
    }
    
    // 弹出对话框让用户输入目标岗位和公司
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>简历优化配置</h3>
                <span class="close" onclick="this.closest('.modal').remove()">×</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>目标岗位 *</label>
                    <input type="text" id="optimizePosition" class="form-control" placeholder="如：前端工程师">
                </div>
                <div class="form-group">
                    <label>目标公司（可选）</label>
                    <input type="text" id="optimizeCompany" class="form-control" placeholder="如：阿里巴巴">
                    <p class="input-hint">填写公司名称可获得更针对性的建议</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                <button class="btn btn-primary" onclick="generateOptimization(${resumeId})">生成建议</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 显示优化建议历史
function showOptimizationHistory(resumeId) {
    const resume = storage.getResumeById(resumeId);
    if (!resume.optimizations || resume.optimizations.length === 0) {
        optimizeResume(resumeId);
        return;
    }
    
    let html = `
        <div class="optimization-history">
            <h3>简历优化记录</h3>
            <p style="color:var(--text-secondary,#6b7280);margin-bottom:1.5rem;">
                已为此简历生成 ${resume.optimizations.length} 次优化建议
            </p>
    `;
    
    resume.optimizations.forEach((opt, index) => {
        html += `
            <div class="optimization-record" onclick="viewOptimizationDetail(${resumeId}, ${index})">
                <div class="record-header">
                    <span class="record-title">${opt.position}${opt.companyName ? ` @ ${opt.companyName}` : ''}</span>
                    <span class="record-score">匹配度 ${opt.suggestions.matchScore}%</span>
                </div>
                <div class="record-date">${Utils.formatRelativeTime(opt.createdAt)}</div>
            </div>
        `;
    });
    
    html += `
            <div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border-color);">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove();optimizeResume(${resumeId});">
                    生成新的优化建议
                </button>
            </div>
        </div>
    `;
    
    showModal('resultModal', html);
}

// 查看优化建议详情
function viewOptimizationDetail(resumeId, index) {
    const resume = storage.getResumeById(resumeId);
    if (!resume.optimizations || !resume.optimizations[index]) {
        notify.error('优化建议不存在');
        return;
    }
    
    const opt = resume.optimizations[index];
    const reportHtml = ResumeOptimizer.generateOptimizationReport(
        opt.suggestions,
        opt.position,
        opt.companyName
    );
    
    showModal('resultModal', reportHtml);
}

// 生成优化建议
async function generateOptimization(resumeId) {
    const position = document.getElementById('optimizePosition')?.value.trim();
    const companyName = document.getElementById('optimizeCompany')?.value.trim();
    
    if (!position) {
        notify.warning('请输入目标岗位');
        return;
    }
    
    // 关闭配置弹窗
    document.querySelectorAll('.modal').forEach(m => m.remove());
    
    const loader = notify.loading('AI正在分析简历并生成优化建议，请稍候...');
    
    try {
        const suggestions = await ResumeOptimizer.generateOptimizationSuggestions(
            resumeId,
            position,
            companyName
        );
        
        // 保存优化建议到简历数据
        const optimizationRecord = {
            position,
            companyName,
            suggestions,
            createdAt: new Date().toISOString()
        };
        
        const resume = storage.getResumeById(resumeId);
        if (!resume.optimizations) {
            resume.optimizations = [];
        }
        resume.optimizations.push(optimizationRecord);
        
        storage.updateResume(resumeId, { optimizations: resume.optimizations });
        
        loader.close();
        
        notify.success('优化建议已生成并保存');
        
        // 刷新简历列表显示
        loadResumeList();
        
        // 显示优化报告
        const reportHtml = ResumeOptimizer.generateOptimizationReport(
            suggestions,
            position,
            companyName
        );
        
        showModal('resultModal', reportHtml);
        
    } catch (error) {
        loader.close();
        const errorMsg = Utils.handleError(error, '简历优化');
        notify.error(errorMsg);
    }
}

// 删除简历
function deleteResume(resumeId) {
    notify.confirm('确定要删除这份简历吗？此操作不可恢复！', () => {
        storage.deleteResume(resumeId);
        notify.success('简历已删除');
        loadResumeList();
        
        if (typeof updateHomeStats === 'function') {
            updateHomeStats();
        }
    });
}

