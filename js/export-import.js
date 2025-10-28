// 数据导入导出模块

class DataExportImport {
    // 导出所有数据
    static exportAllData() {
        const data = {
            version: APP_CONFIG.version,
            exportTime: new Date().toISOString(),
            resumes: storage.getResumes(),
            interviews: storage.getInterviews(),
            settings: {
                apiKey: storage.getApiKey() ? '***已保存***' : null, // 不导出真实API Key
                apiBaseUrl: storage.getApiBaseUrl()
            }
        };
        
        const jsonStr = JSON.stringify(data, null, 2);
        const filename = `AI面试系统数据备份_${Utils.formatDate(new Date(), 'YYYYMMDD_HHmmss')}.json`;
        
        Utils.downloadFile(jsonStr, filename, 'application/json');
        notify.success('数据已导出为JSON文件');
    }
    
    // 导入数据
    static importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // 验证数据格式
                    if (!data.version || !data.resumes || !data.interviews) {
                        throw new Error('数据格式不正确');
                    }
                    
                    notify.confirm(
                        `即将导入 ${data.resumes.length} 份简历和 ${data.interviews.length} 条面试记录。是否继续？`,
                        () => {
                            try {
                                // 合并数据（不覆盖现有数据）
                                const existingResumes = storage.getResumes();
                                const existingInterviews = storage.getInterviews();
                                
                                // 简历去重（根据文件名和创建时间）
                                data.resumes.forEach(resume => {
                                    const exists = existingResumes.some(r => 
                                        r.filename === resume.filename && 
                                        r.createdAt === resume.createdAt
                                    );
                                    if (!exists) {
                                        storage.saveResume(resume);
                                    }
                                });
                                
                                // 面试记录去重
                                data.interviews.forEach(interview => {
                                    const exists = existingInterviews.some(i => 
                                        i.createdAt === interview.createdAt &&
                                        i.position === interview.position
                                    );
                                    if (!exists) {
                                        storage.saveInterview(interview);
                                    }
                                });
                                
                                notify.success('数据导入成功！');
                                
                                // 刷新界面
                                if (typeof loadResumeList === 'function') loadResumeList();
                                if (typeof loadInterviewList === 'function') loadInterviewList();
                                if (typeof updateHomeStats === 'function') updateHomeStats();
                                
                                resolve(true);
                            } catch (error) {
                                notify.error('数据导入失败：' + error.message);
                                reject(error);
                            }
                        },
                        () => reject(new Error('用户取消导入'))
                    );
                    
                } catch (error) {
                    notify.error('文件解析失败：' + error.message);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                notify.error('文件读取失败');
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsText(file);
        });
    }
    
    // 导出单个面试报告（PDF格式 - 使用HTML转换）
    static exportInterviewPDF(interviewId) {
        const interview = storage.getInterviewById(interviewId);
        if (!interview) {
            notify.error('面试不存在');
            return;
        }
        
        // 创建打印友好的HTML
        const printWindow = window.open('', '_blank');
        const content = this.generatePrintableReport(interview);
        
        printWindow.document.write(content);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
    
    // 生成可打印的报告HTML
    static generatePrintableReport(interview) {
        const scoreLevel = Utils.getScoreLevel(interview.score || 0);
        
        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>面试报告 - ${interview.position}</title>
    <style>
        body { font-family: 'Microsoft YaHei', sans-serif; padding: 2cm; }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 2rem; }
        .header { text-align: center; margin-bottom: 2rem; }
        .score { font-size: 3rem; color: #2563eb; font-weight: bold; }
        .meta { color: #6b7280; margin: 1rem 0; }
        .section { margin: 2rem 0; page-break-inside: avoid; }
        .question { background: #f3f4f6; padding: 1rem; margin: 1rem 0; border-radius: 8px; }
        .answer { background: #fff; padding: 1rem; margin: 0.5rem 0; border-left: 3px solid #2563eb; }
        .eval { background: #eff6ff; padding: 1rem; margin: 0.5rem 0; }
        ul { margin-left: 2rem; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI面试系统 - 面试报告</h1>
        <div class="meta">
            <p>岗位：${interview.position}</p>
            ${interview.companyName ? `<p>公司：${interview.companyName}</p>` : ''}
            <p>时间：${Utils.formatDate(interview.createdAt)}</p>
        </div>
        <div class="score">${interview.score || 0}分</div>
        <p>评级：${scoreLevel.text}</p>
    </div>
`;
        
        // 各阶段详情
        for (let stage = 1; stage <= 3; stage++) {
            const stageKey = `stage_${stage}`;
            const questions = interview.questions?.[stageKey] || [];
            
            if (questions.length === 0) continue;
            
            html += `<div class="section"><h2>阶段${stage}</h2>`;
            
            questions.forEach((q, index) => {
                const answerKey = `${stageKey}_${index}`;
                const answer = interview.answers?.[answerKey] || '未回答';
                const evaluation = interview.evaluations?.[answerKey];
                
                html += `
                    <div class="question">
                        <strong>问题${index + 1}：</strong>${q.question}
                    </div>
                    <div class="answer">
                        <strong>回答：</strong>${answer}
                    </div>
                `;
                
                if (evaluation) {
                    html += `
                        <div class="eval">
                            <p><strong>得分：</strong>${evaluation.score}/100</p>
                            <p><strong>评价：</strong>${evaluation.feedback}</p>
                        </div>
                    `;
                }
            });
            
            html += `</div>`;
        }
        
        html += `
    <div class="no-print" style="margin-top: 2rem; text-align: center;">
        <button onclick="window.print()" style="padding: 0.75rem 2rem; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">打印报告</button>
        <button onclick="window.close()" style="padding: 0.75rem 2rem; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; margin-left: 1rem; font-size: 1rem;">关闭</button>
    </div>
</body>
</html>
`;
        
        return html;
    }
    
    // 生成CSV格式的面试记录
    static exportInterviewsCSV(interviews) {
        let csv = 'ID,岗位,公司,状态,分数,创建时间,完成时间\n';
        
        interviews.forEach(interview => {
            csv += `${interview.id},`;
            csv += `${interview.position},`;
            csv += `${interview.companyName || ''},`;
            csv += `${interview.status},`;
            csv += `${interview.score || ''},`;
            csv += `${Utils.formatDate(interview.createdAt)},`;
            csv += `${interview.completedAt ? Utils.formatDate(interview.completedAt) : ''}\n`;
        });
        
        const filename = `面试记录_${Utils.formatDate(new Date(), 'YYYYMMDD')}.csv`;
        Utils.downloadFile(csv, filename, 'text/csv;charset=utf-8');
        notify.success('面试记录已导出为CSV');
    }
}

// 导出
window.DataExportImport = DataExportImport;

