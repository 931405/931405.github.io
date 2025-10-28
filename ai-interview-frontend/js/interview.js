// 面试管理功能

let currentInterview = null;
let currentQuestionIndex = 0;
let timerInterval = null;
let timeRemaining = 300; // 5分钟

// 加载面试列表
function loadInterviewList() {
    const interviews = storage.getInterviews();
    // 使用app.js中的renderInterviewList函数
    if (typeof renderInterviewList === 'function') {
        renderInterviewList(interviews);
    }
}

// 显示面试设置对话框
function showInterviewSetup() {
    const resumes = storage.getResumes();
    
    if (resumes.length === 0) {
        notify.warning('请先上传简历');
        setTimeout(() => navigateTo('resume'), 1500);
        return;
    }
    
    // 填充简历选择下拉框
    const selectResume = document.getElementById('selectResume');
    selectResume.innerHTML = resumes.map(r => 
        `<option value="${r.id}">${r.filename}</option>`
    ).join('');
    
    // 显示模态框
    document.getElementById('interviewSetupModal').classList.add('active');
}

// 搜索公司信息
async function searchCompanyInfo() {
    const companyName = document.getElementById('companyName').value.trim();
    
    if (!companyName) {
        notify.warning('请先输入公司名称');
        return;
    }
    
    const loader = notify.loading('正在搜索公司信息...');
    
    try {
        const companyInfo = await webInfoCollector.getCompanyInfo(companyName);
        
        loader.close();
        
        if (companyInfo) {
            const preview = document.getElementById('companyInfoPreview');
            preview.innerHTML = `
                <h5>${companyInfo.name}</h5>
                <p>${companyInfo.description}</p>
                ${companyInfo.culture && companyInfo.culture.length > 0 ? `
                    <p><strong>企业文化：</strong>${companyInfo.culture.map(c => `<span class="info-tag">${c}</span>`).join('')}</p>
                ` : ''}
                ${companyInfo.interviewStyle ? `
                    <p><strong>面试风格：</strong>${companyInfo.interviewStyle}</p>
                ` : ''}
                ${companyInfo.tips && companyInfo.tips.length > 0 ? `
                    <p><strong>注意事项：</strong></p>
                    <ul>${companyInfo.tips.map(t => `<li>${t}</li>`).join('')}</ul>
                ` : ''}
            `;
            preview.style.display = 'block';
            
            // 保存到全局变量供创建面试时使用
            window.currentCompanyInfo = companyInfo;
            
            notify.success('公司信息已加载');
        }
    } catch (error) {
        loader.close();
        notify.error('搜索公司信息失败：' + error.message);
    }
}

// 分析JD
async function analyzeJD() {
    const jd = document.getElementById('jobRequirements').value.trim();
    const position = document.getElementById('position').value.trim();
    
    if (!jd) {
        notify.warning('请先输入岗位要求');
        return;
    }
    
    if (!position) {
        notify.warning('请先输入应聘岗位');
        return;
    }
    
    const loader = notify.loading('正在分析JD...');
    
    try {
        const analysis = await webInfoCollector.analyzeJobDescription(jd, position);
        
        loader.close();
        
        if (analysis) {
            const preview = document.getElementById('jdAnalysisPreview');
            preview.innerHTML = `
                <h5>JD分析结果</h5>
                ${analysis.keyRequirements && analysis.keyRequirements.length > 0 ? `
                    <p><strong>核心要求：</strong></p>
                    <ul>${analysis.keyRequirements.map(r => `<li>${r}</li>`).join('')}</ul>
                ` : ''}
                ${analysis.technicalSkills && analysis.technicalSkills.length > 0 ? `
                    <p><strong>技术栈：</strong>${analysis.technicalSkills.map(s => `<span class="info-tag">${s}</span>`).join('')}</p>
                ` : ''}
                ${analysis.focusAreas && analysis.focusAreas.length > 0 ? `
                    <p><strong>面试重点：</strong>${analysis.focusAreas.join('、')}</p>
                ` : ''}
            `;
            preview.style.display = 'block';
            
            // 保存到全局变量
            window.currentJDAnalysis = analysis;
            
            // 生成面试场景
            await generateScenario();
            
            notify.success('JD分析完成');
        }
    } catch (error) {
        loader.close();
        notify.error('分析JD失败：' + error.message);
    }
}

// 生成面试场景
async function generateScenario() {
    const position = document.getElementById('position').value.trim();
    const companyName = document.getElementById('companyName').value.trim();
    const jobRequirements = document.getElementById('jobRequirements').value.trim();
    
    if (!position) return;
    
    try {
        const scenario = await webInfoCollector.generateInterviewScenario({
            position,
            companyName,
            jobRequirements,
            companyInfo: window.currentCompanyInfo,
            jdAnalysis: window.currentJDAnalysis
        });
        
        const scenarioDiv = document.getElementById('interviewScenario');
        const scenarioContent = document.getElementById('scenarioContent');
        
        scenarioContent.textContent = scenario;
        scenarioDiv.style.display = 'block';
    } catch (error) {
        console.error('生成场景失败:', error);
    }
}

// 创建面试
async function createInterview() {
    const resumeId = parseInt(document.getElementById('selectResume').value);
    const position = document.getElementById('position').value.trim();
    const companyName = document.getElementById('companyName').value.trim();
    const jobRequirements = document.getElementById('jobRequirements').value.trim();
    const isTechnical = document.getElementById('isTechnical').checked;
    
    if (!position) {
        notify.warning('请输入应聘岗位');
        return;
    }
    
    const resume = storage.getResumeById(resumeId);
    if (!resume) {
        notify.error('简历不存在');
        return;
    }
    
    // 提取技能列表
    let skills = [];
    if (resume.analysis?.skills) {
        const skillsObj = resume.analysis.skills;
        skills = [
            ...(skillsObj.programming_languages || []),
            ...(skillsObj.frameworks || []),
            ...(skillsObj.databases || [])
        ].slice(0, 10); // 最多10个技能
    }
    
    const interview = {
        resumeId: resumeId,
        position: position,
        companyName: companyName,
        jobRequirements: jobRequirements,
        isTechnical: isTechnical,
        skills: skills,
        companyInfo: window.currentCompanyInfo || null,
        jdAnalysis: window.currentJDAnalysis || null
    };
    
    const savedInterview = storage.saveInterview(interview);
    
    closeModal('interviewSetupModal');
    
    // 清除全局变量
    window.currentCompanyInfo = null;
    window.currentJDAnalysis = null;
    
    notify.success('面试创建成功！');
    
    // 刷新列表
    loadInterviewList();
    
    // 刷新首页统计
    if (typeof updateHomeStats === 'function') {
        updateHomeStats();
    }
    
    // 直接开始面试
    setTimeout(() => continueInterview(savedInterview.id), 500);
}

// 继续面试
function continueInterview(interviewId) {
    const interview = storage.getInterviewById(interviewId);
    if (!interview) {
        notify.error('面试不存在');
        return;
    }
    
    currentInterview = interview;
    currentQuestionIndex = 0;
    
    // 更新状态为进行中
    if (interview.status === 'pending') {
        storage.updateInterview(interviewId, { status: 'in_progress' });
    }
    
    // 显示面试模态框
    document.getElementById('interviewModal').classList.add('active');
    
    // 更新进度显示
    updateInterviewProgress();
    
    // 启动自动保存
    if (typeof AutoSave !== 'undefined') {
        AutoSave.start(interviewId);
    }
    
    // 加载当前阶段的问题
    loadCurrentQuestion();
}

// 更新面试进度显示
function updateInterviewProgress() {
    const stages = document.querySelectorAll('.stage');
    stages.forEach((stage, index) => {
        const stageNum = index + 1;
        if (stageNum < currentInterview.currentStage) {
            stage.classList.add('completed');
            stage.classList.remove('active');
        } else if (stageNum === currentInterview.currentStage) {
            stage.classList.add('active');
            stage.classList.remove('completed');
        } else {
            stage.classList.remove('active', 'completed');
        }
    });
    
    document.getElementById('currentQuestion').textContent = 
        `问题 ${currentQuestionIndex + 1}/3`;
}

// 加载当前问题
async function loadCurrentQuestion() {
    const stageKey = `stage_${currentInterview.currentStage}`;
    const questions = currentInterview.questions[stageKey] || [];
    
    // 清空答案输入框
    document.getElementById('answerInput').value = '';
    document.getElementById('evaluationResult').style.display = 'none';
    
    // 如果问题已存在，直接显示
    if (currentQuestionIndex < questions.length) {
        displayQuestion(questions[currentQuestionIndex]);
        return;
    }
    
    // 否则生成新问题
    showQuestionLoading();
    
    try {
        // 获取之前的问答记录
        const previousQA = [];
        for (let i = 0; i < currentQuestionIndex; i++) {
            if (i < questions.length) {
                const q = questions[i];
                const answerKey = `${stageKey}_${i}`;
                const answer = currentInterview.answers[answerKey] || '未回答';
                previousQA.push({
                    question: q.question,
                    answer: answer
                });
            }
        }
        
        const question = await deepseekAPI.generateQuestion(
            currentInterview,
            currentInterview.currentStage,
            currentQuestionIndex,
            previousQA
        );
        
        // 保存问题
        if (!currentInterview.questions[stageKey]) {
            currentInterview.questions[stageKey] = [];
        }
        currentInterview.questions[stageKey].push(question);
        storage.updateInterview(currentInterview.id, {
            questions: currentInterview.questions
        });
        
        displayQuestion(question);
        
    } catch (error) {
        console.error('生成问题失败:', error);
        document.getElementById('questionContent').innerHTML = 
            `<p style="color:var(--danger-color);">问题生成失败: ${error.message}</p>
             <button class="btn btn-primary" onclick="loadCurrentQuestion()">重试</button>`;
    }
}

// 显示问题加载状态
function showQuestionLoading() {
    document.getElementById('questionContent').innerHTML = 
        '<div class="spinner"></div><p class="loading">AI正在生成问题，请稍候...</p>';
}

// 显示问题
function displayQuestion(question) {
    const stageNames = {
        1: '基础知识',
        2: '项目经历',
        3: currentInterview.isTechnical ? '算法题' : '综合问题'
    };
    
    document.getElementById('questionType').textContent = 
        stageNames[currentInterview.currentStage];
    
    document.getElementById('questionContent').innerHTML = 
        `<p>${question.question}</p>`;
    
    // 启动计时器
    timeRemaining = question.time_limit || 300;
    startTimer();
}

// 启动计时器
function startTimer() {
    // 清除旧的计时器
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            notify.warning('时间到！请提交答案');
        }
    }, 1000);
}

// 更新计时器显示
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerEl = document.getElementById('timer');
    timerEl.textContent = display;
    
    // 根据剩余时间改变颜色
    if (timeRemaining <= 30) {
        timerEl.className = 'timer danger';
    } else if (timeRemaining <= 60) {
        timerEl.className = 'timer warning';
    } else {
        timerEl.className = 'timer';
    }
}

// 提交答案
async function submitAnswer() {
    const answer = document.getElementById('answerInput').value.trim();
    
    if (!answer) {
        notify.warning('请输入答案');
        return;
    }
    
    if (answer.length < APP_CONFIG.interview.minAnswerLength) {
        notify.warning(`答案至少需要${APP_CONFIG.interview.minAnswerLength}个字符`);
        return;
    }
    
    // 停止计时器
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    const stageKey = `stage_${currentInterview.currentStage}`;
    const question = currentInterview.questions[stageKey][currentQuestionIndex];
    
    const loader = notify.loading('AI正在评分，请稍候...');
    
    try {
        // 调用AI评分
        const evaluation = await deepseekAPI.evaluateAnswer(
            question.question,
            answer,
            question.key_points || []
        );
        
        // 保存答案和评分
        const answerKey = `${stageKey}_${currentQuestionIndex}`;
        currentInterview.answers[answerKey] = answer;
        currentInterview.evaluations[answerKey] = evaluation;
        
        storage.updateInterview(currentInterview.id, {
            answers: currentInterview.answers,
            evaluations: currentInterview.evaluations
        });
        
        loader.close();
        
        // 根据分数显示不同提示
        const scoreLevel = Utils.getScoreLevel(evaluation.score);
        notify.success(`得分：${evaluation.score}分 (${scoreLevel.text})`, 3000);
        
        // 判断是否需要追问
        const followupQuestion = await checkAndGenerateFollowup(question.question, answer, evaluation.score, evaluation.feedback);
        
        // 显示评分结果（包含追问）
        displayEvaluation(evaluation, followupQuestion);
        
    } catch (error) {
        loader.close();
        const errorMsg = Utils.handleError(error, '答案评分');
        notify.error(errorMsg);
    }
}

// 检查并生成追问
async function checkAndGenerateFollowup(originalQuestion, userAnswer, score, feedback) {
    // 追问策略：
    // 1. 40-70分：引导性追问，帮助完善答案
    // 2. 80分以上：深挖性追问，考察深度
    // 3. 低于40分或高于90分：不追问
    
    if (score < 40 || score > 90) {
        return null;
    }
    
    const followupType = score >= 80 ? 'deep_dive' : 'hint';
    
    try {
        const followup = await generateFollowupQuestion(originalQuestion, userAnswer, score, feedback, followupType);
        return followup;
    } catch (error) {
        console.error('生成追问失败:', error);
        return null;
    }
}

// 生成追问问题
async function generateFollowupQuestion(originalQuestion, userAnswer, score, feedback, followupType) {
    let prompt = '';
    
    if (followupType === 'hint') {
        prompt = `用户回答得分${score}分（满分100），说明回答有一定基础但不够完善。

原始问题：${originalQuestion}
用户回答：${userAnswer}
评价反馈：${feedback}

请生成一个**引导性的追问**，帮助用户完善答案：
1. 指出用户回答中缺失或不足的关键点
2. 提供适当的提示或方向
3. 鼓励用户补充更多细节
4. 问题应该是开放性的，引导而不是直接告诉答案

返回JSON格式：
{
  "followup_question": "追问的问题内容",
  "hint": "简短的提示（1-2句话）",
  "type": "hint"
}

只返回JSON。`;
    } else {
        prompt = `用户回答得分${score}分（满分100），说明回答质量很高。

原始问题：${originalQuestion}
用户回答：${userAnswer}

请生成一个**深挖性的追问**，进一步考察用户的深度理解：
1. 基于用户的优秀回答，提出更深层次的问题
2. 可以询问实现细节、性能优化、边界情况等
3. 或者提出一个相关的高级场景/变体问题
4. 问题要有挑战性，但与原问题相关

返回JSON格式：
{
  "followup_question": "追问的问题内容",
  "hint": "追问的方向说明（1句话）",
  "type": "deep_dive"
}

只返回JSON。`;
    }
    
    try {
        const response = await deepseekAPI.chatCompletion([
            { role: 'system', content: '你是专业面试官。返回纯JSON格式。' },
            { role: 'user', content: prompt }
        ], 0.7, 500);
        
        const cleanResponse = deepseekAPI.cleanJsonResponse(response);
        const followup = JSON.parse(cleanResponse);
        
        return followup;
    } catch (error) {
        console.error('生成追问失败:', error);
        return null;
    }
}

// 显示评分结果
function displayEvaluation(evaluation, followupQuestion = null) {
    const resultDiv = document.getElementById('evaluationResult');
    
    let html = `
        <div class="score-display">得分: ${evaluation.score}/100</div>
        <div class="feedback">
            <h4>评价</h4>
            <p>${evaluation.feedback}</p>
        </div>
    `;
    
    if (evaluation.strengths && evaluation.strengths.length > 0) {
        html += `
            <div class="feedback">
                <h4>优点</h4>
                <ul>
                    ${evaluation.strengths.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (evaluation.improvements && evaluation.improvements.length > 0) {
        html += `
            <div class="feedback">
                <h4>改进建议</h4>
                <ul>
                    ${evaluation.improvements.map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // 显示追问
    if (followupQuestion) {
        const followupTypeText = followupQuestion.type === 'hint' ? '引导性追问' : '深度追问';
        const followupColor = followupQuestion.type === 'hint' ? '#d97706' : '#2563eb';
        
        html += `
            <div class="followup-section">
                <div class="followup-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${followupColor}" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span class="followup-title" style="color: ${followupColor}">面试官追问</span>
                    <span class="followup-badge" style="background: ${followupColor}20; color: ${followupColor}">${followupTypeText}</span>
                </div>
                <div class="followup-content">
                    <p class="followup-question">${followupQuestion.followup_question}</p>
                    ${followupQuestion.hint ? `<p class="followup-hint">提示：${followupQuestion.hint}</p>` : ''}
                </div>
                <div class="followup-actions">
                    <textarea id="followupAnswer" class="answer-input" placeholder="请回答追问..." rows="4"></textarea>
                    <div class="answer-actions">
                        <button class="btn btn-primary btn-small" onclick="submitFollowupAnswer()">提交追问答案</button>
                        <button class="btn btn-secondary btn-small" onclick="skipFollowup()">跳过追问</button>
                    </div>
                </div>
            </div>
        `;
        
        // 保存追问信息
        window.currentFollowup = followupQuestion;
    } else {
        // 没有追问，显示下一步按钮
        const hasMore = currentQuestionIndex < 2;
        const hasNextStage = currentInterview.currentStage < 3;
        
        if (hasMore) {
            html += `
                <div style="margin-top:1rem;">
                    <button class="btn btn-primary" onclick="nextQuestion()">下一题</button>
                </div>
            `;
        } else if (hasNextStage) {
            html += `
                <div style="margin-top:1rem;">
                    <button class="btn btn-primary" onclick="nextStage()">进入下一阶段</button>
                </div>
            `;
        } else {
            html += `
                <div style="margin-top:1rem;">
                    <button class="btn btn-primary" onclick="completeInterview()">完成面试</button>
                </div>
            `;
        }
    }
    
    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
}

// 提交追问答案
async function submitFollowupAnswer() {
    const followupAnswer = document.getElementById('followupAnswer')?.value.trim();
    
    if (!followupAnswer) {
        notify.warning('请输入追问答案');
        return;
    }
    
    if (!window.currentFollowup) {
        notify.error('追问信息丢失');
        return;
    }
    
    const loader = notify.loading('AI正在评分追问答案...');
    
    try {
        // 评分追问答案
        const evaluation = await deepseekAPI.evaluateAnswer(
            window.currentFollowup.followup_question,
            followupAnswer,
            []
        );
        
        // 计算追问奖励分
        let bonusScore = 0;
        if (window.currentFollowup.type === 'hint') {
            // 引导性追问：回答好可得最多+15分
            bonusScore = Math.round(evaluation.score * 0.15);
        } else {
            // 深挖性追问：回答好可得最多+20分
            bonusScore = Math.round(evaluation.score * 0.2);
        }
        
        // 保存追问答案和奖励分
        const stageKey = `stage_${currentInterview.currentStage}`;
        const answerKey = `${stageKey}_${currentQuestionIndex}`;
        const followupKey = `${answerKey}_followup`;
        
        if (!currentInterview.answers) currentInterview.answers = {};
        if (!currentInterview.evaluations) currentInterview.evaluations = {};
        
        currentInterview.answers[followupKey] = followupAnswer;
        currentInterview.evaluations[followupKey] = {
            ...evaluation,
            bonusScore: bonusScore,
            type: window.currentFollowup.type
        };
        
        // 更新原问题的总分
        if (currentInterview.evaluations[answerKey]) {
            const originalScore = currentInterview.evaluations[answerKey].score || 0;
            currentInterview.evaluations[answerKey].totalScore = Math.min(100, originalScore + bonusScore);
            currentInterview.evaluations[answerKey].bonusScore = bonusScore;
        }
        
        storage.updateInterview(currentInterview.id, {
            answers: currentInterview.answers,
            evaluations: currentInterview.evaluations
        });
        
        loader.close();
        
        notify.success(`追问答案得分：${evaluation.score}分，奖励分：+${bonusScore}分`, 3000);
        
        // 清除追问
        window.currentFollowup = null;
        
        // 显示继续按钮
        showNextStepButtons();
        
    } catch (error) {
        loader.close();
        notify.error('追问评分失败：' + error.message);
    }
}

// 跳过追问
function skipFollowup() {
    window.currentFollowup = null;
    showNextStepButtons();
}

// 显示下一步按钮
function showNextStepButtons() {
    const resultDiv = document.getElementById('evaluationResult');
    const hasMore = currentQuestionIndex < 2;
    const hasNextStage = currentInterview.currentStage < 3;
    
    let buttonsHtml = '';
    
    if (hasMore) {
        buttonsHtml = `
            <div style="margin-top:1.5rem; padding-top:1.5rem; border-top: 1px solid var(--border-color);">
                <button class="btn btn-primary" onclick="nextQuestion()">下一题</button>
            </div>
        `;
    } else if (hasNextStage) {
        buttonsHtml = `
            <div style="margin-top:1.5rem; padding-top:1.5rem; border-top: 1px solid var(--border-color);">
                <button class="btn btn-primary" onclick="nextStage()">进入下一阶段</button>
            </div>
        `;
    } else {
        buttonsHtml = `
            <div style="margin-top:1.5rem; padding-top:1.5rem; border-top: 1px solid var(--border-color);">
                <button class="btn btn-primary" onclick="completeInterview()">完成面试</button>
            </div>
        `;
    }
    
    // 移除追问区域，添加下一步按钮
    const followupSection = resultDiv.querySelector('.followup-section');
    if (followupSection) {
        followupSection.remove();
    }
    
    resultDiv.insertAdjacentHTML('beforeend', buttonsHtml);
}

// 下一题
function nextQuestion() {
    currentQuestionIndex++;
    updateInterviewProgress();
    
    // 清空答案框
    const answerInput = document.getElementById('answerInput');
    if (answerInput) answerInput.value = '';
    
    loadCurrentQuestion();
}

// 跳过问题
function skipQuestion() {
    notify.confirm('确定要跳过这道题吗？', () => {
        handleSkipQuestion();
    });
}

function handleSkipQuestion() {
    
    // 停止计时器
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // 保存空答案
    const stageKey = `stage_${currentInterview.currentStage}`;
    const answerKey = `${stageKey}_${currentQuestionIndex}`;
    currentInterview.answers[answerKey] = '（已跳过）';
    currentInterview.evaluations[answerKey] = {
        score: 0,
        feedback: '未作答',
        strengths: [],
        improvements: ['建议完整回答问题']
    };
    
    storage.updateInterview(currentInterview.id, {
        answers: currentInterview.answers,
        evaluations: currentInterview.evaluations
    });
    
    // 判断是否还有下一题
    if (currentQuestionIndex < 2) {
        nextQuestion();
    } else if (currentInterview.currentStage < 3) {
        notify.confirm('当前阶段已完成，是否进入下一阶段？', () => {
            nextStage();
        });
    } else {
        notify.confirm('所有问题已完成，是否结束面试？', () => {
            completeInterview();
        });
    }
}

// 下一阶段
function nextStage() {
    currentInterview.currentStage++;
    currentQuestionIndex = 0;
    
    storage.updateInterview(currentInterview.id, {
        currentStage: currentInterview.currentStage
    });
    
    updateInterviewProgress();
    loadCurrentQuestion();
}

// 完成面试
function completeInterview() {
    // 计算总分
    let totalScore = 0;
    let count = 0;
    
    Object.keys(currentInterview.evaluations).forEach(key => {
        if (!key.includes('followup')) {
            totalScore += currentInterview.evaluations[key].score;
            count++;
        }
    });
    
    const finalScore = count > 0 ? Math.round(totalScore / count) : 0;
    
    // 更新面试状态
    storage.updateInterview(currentInterview.id, {
        status: 'completed',
        score: finalScore,
        completedAt: new Date().toISOString()
    });
    
    // 停止计时器
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // 关闭面试窗口
    closeModal('interviewModal');
    
    // 显示结果
    const scoreLevel = Utils.getScoreLevel(finalScore);
    notify.success(`面试完成！总分：${finalScore}分 (${scoreLevel.text})`, 4000);
    
    // 刷新列表
    loadInterviewList();
    
    // 刷新首页统计
    if (typeof updateHomeStats === 'function') {
        updateHomeStats();
    }
    
    // 延迟显示详细结果
    setTimeout(() => viewInterviewResult(currentInterview.id), 1000);
}

// 退出面试
function exitInterview() {
    if (currentInterview && currentInterview.status === 'in_progress') {
        notify.confirm('面试尚未完成，确定要退出吗？进度将被保存。', () => {
            handleExitInterview();
        });
    } else {
        handleExitInterview();
    }
}

function handleExitInterview() {
    
    // 停止计时器
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // 停止自动保存
    if (typeof AutoSave !== 'undefined') {
        AutoSave.stop();
    }
    
    closeModal('interviewModal');
    currentInterview = null;
}

// 查看面试结果
function viewInterviewResult(interviewId) {
    const interview = storage.getInterviewById(interviewId);
    if (!interview) {
        notify.error('面试不存在');
        return;
    }
    
    const scoreLevel = Utils.getScoreLevel(interview.score || 0);
    
    let html = `
        <div class="interview-report">
            <div class="report-header">
                <div class="report-badge">${scoreLevel.text}</div>
                <h2 class="report-title">${interview.position}</h2>
                ${interview.companyName ? `<p class="report-company">${interview.companyName}</p>` : ''}
                <div class="report-score-circle">
                    <svg width="150" height="150" class="score-ring">
                        <circle cx="75" cy="75" r="65" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="10"/>
                        <circle cx="75" cy="75" r="65" fill="none" stroke="url(#scoreGradient)" stroke-width="10"
                            stroke-dasharray="408" stroke-dashoffset="${408 - (408 * (interview.score || 0) / 100)}"
                            transform="rotate(-90 75 75)" stroke-linecap="round"/>
                        <defs>
                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#FF6B35"/>
                                <stop offset="100%" style="stop-color:#4A2FBD"/>
                            </linearGradient>
                        </defs>
                    </svg>
                    <div class="score-text">
                        <span class="score-number">${interview.score || 0}</span>
                        <span class="score-suffix">/100</span>
                    </div>
                </div>
                <div class="report-meta">
                    <span class="meta-item">${Utils.formatDate(interview.createdAt, 'YYYY-MM-DD HH:mm')}</span>
                    <span class="meta-item">耗时：${calculateInterviewDuration(interview)}</span>
                </div>
            </div>
            
            <div class="report-summary">
                <h3>整体评价</h3>
                <p>${generateOverallFeedback(interview)}</p>
            </div>
    `;
    
    // 显示各阶段详情
    const stageScores = {};
    for (let stage = 1; stage <= 3; stage++) {
        const stageKey = `stage_${stage}`;
        const questions = interview.questions[stageKey] || [];
        
        if (questions.length === 0) continue;
        
        const stageNames = {
            1: '基础知识',
            2: '项目经历',
            3: interview.isTechnical ? '算法题' : '综合问题'
        };
        
        // 计算阶段平均分
        let stageTotal = 0;
        let stageCount = 0;
        questions.forEach((q, index) => {
            const answerKey = `${stageKey}_${index}`;
            const evaluation = interview.evaluations[answerKey];
            if (evaluation && evaluation.score) {
                stageTotal += evaluation.score;
                stageCount++;
            }
        });
        const stageAvg = stageCount > 0 ? Math.round(stageTotal / stageCount) : 0;
        stageScores[stage] = stageAvg;
        
        const stageLevelInfo = Utils.getScoreLevel(stageAvg);
        
        html += `
            <div class="report-stage">
                <div class="stage-header">
                    <h3>${stageNames[stage]}</h3>
                    <span class="stage-score" style="color:${stageLevelInfo.color}">${stageAvg}分</span>
                </div>
        `;
        
        questions.forEach((q, index) => {
            const answerKey = `${stageKey}_${index}`;
            const answer = interview.answers[answerKey] || '未回答';
            const evaluation = interview.evaluations[answerKey];
            
            html += `
                <div class="question-detail">
                    <div class="question-header">
                        <span class="question-number">Q${index + 1}</span>
                        <p class="question-text">${q.question}</p>
                    </div>
                    <div class="answer-text">
                        <strong>我的回答：</strong>
                        <p>${answer}</p>
                    </div>
                    ${evaluation ? `
                        <div class="evaluation-detail">
                            <div class="eval-score">
                                <span class="score-label">得分</span>
                                <span class="score-value" style="color:${Utils.getScoreLevel(evaluation.score).color}">${evaluation.score}/100</span>
                            </div>
                            <div class="eval-feedback">
                                <p>${evaluation.feedback}</p>
                            </div>
                            ${evaluation.strengths && evaluation.strengths.length > 0 ? `
                                <div class="eval-points">
                                    <strong>优点：</strong>
                                    <ul>${evaluation.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
                                </div>
                            ` : ''}
                            ${evaluation.improvements && evaluation.improvements.length > 0 ? `
                                <div class="eval-points">
                                    <strong>改进建议：</strong>
                                    <ul>${evaluation.improvements.map(i => `<li>${i}</li>`).join('')}</ul>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    html += `
            <div class="report-actions">
                <button class="btn btn-secondary" onclick="exportInterviewReport(${interviewId})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span class="btn-text">导出报告</span>
                </button>
                <button class="btn btn-primary" onclick="closeModal('resultModal')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span class="btn-text">关闭</span>
                </button>
            </div>
        </div>
    `;
    
    showModal('resultModal', html);
}

// 计算面试耗时
function calculateInterviewDuration(interview) {
    if (!interview.completedAt) return '进行中';
    
    const start = new Date(interview.createdAt);
    const end = new Date(interview.completedAt);
    const diff = end - start;
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
        return `${minutes}分${seconds}秒`;
    }
    return `${seconds}秒`;
}

// 生成整体反馈
function generateOverallFeedback(interview) {
    const score = interview.score || 0;
    const scoreLevel = Utils.getScoreLevel(score);
    
    const feedbackTemplates = {
        excellent: '恭喜！您的表现非常出色，对问题的理解深入，回答全面且有条理。继续保持这样的水平，相信您一定能在真实面试中脱颖而出！',
        good: '表现良好！您对大部分问题都有不错的理解和回答。建议在回答时更加注重细节和实例，进一步提升表达的专业性。',
        fair: '总体表现中等。建议加强对基础知识的掌握，多积累项目经验，并在回答时更加深入和全面。',
        pass: '基本达到及格线。需要在基础知识、项目经验等方面继续努力，多练习和总结，提升面试技巧。',
        fail: '本次表现有待提高。建议系统性地复习相关知识，多做模拟练习，提升回答的完整性和专业性。'
    };
    
    return feedbackTemplates[scoreLevel.level] || '感谢您的参与！';
}

// 导出面试报告
function exportInterviewReport(interviewId) {
    const interview = storage.getInterviewById(interviewId);
    if (!interview) return;
    
    let report = `AI面试系统 - 面试报告\n`;
    report += `==========================================\n\n`;
    report += `岗位：${interview.position}\n`;
    report += `公司：${interview.companyName || '未填写'}\n`;
    report += `时间：${Utils.formatDate(interview.createdAt)}\n`;
    report += `总分：${interview.score || 0}分\n`;
    report += `评级：${Utils.getScoreLevel(interview.score || 0).text}\n\n`;
    
    report += `==========================================\n\n`;
    
    for (let stage = 1; stage <= 3; stage++) {
        const stageKey = `stage_${stage}`;
        const questions = interview.questions[stageKey] || [];
        
        if (questions.length === 0) continue;
        
        const stageNames = {
            1: '基础知识',
            2: '项目经历',
            3: interview.isTechnical ? '算法题' : '综合问题'
        };
        
        report += `【${stageNames[stage]}】\n\n`;
        
        questions.forEach((q, index) => {
            const answerKey = `${stageKey}_${index}`;
            const answer = interview.answers[answerKey] || '未回答';
            const evaluation = interview.evaluations[answerKey];
            
            report += `问题${index + 1}：${q.question}\n`;
            report += `我的回答：${answer}\n`;
            
            if (evaluation) {
                report += `得分：${evaluation.score}/100\n`;
                report += `评价：${evaluation.feedback}\n`;
                
                if (evaluation.strengths && evaluation.strengths.length > 0) {
                    report += `优点：${evaluation.strengths.join('；')}\n`;
                }
                
                if (evaluation.improvements && evaluation.improvements.length > 0) {
                    report += `改进建议：${evaluation.improvements.join('；')}\n`;
                }
            }
            
            report += `\n`;
        });
        
        report += `\n`;
    }
    
    Utils.downloadFile(
        report,
        `面试报告_${interview.position}_${Utils.formatDate(interview.createdAt, 'YYYYMMDD')}.txt`,
        'text/plain;charset=utf-8'
    );
    
    notify.success('报告已导出');
}

// 删除面试
function deleteInterview(interviewId) {
    notify.confirm('确定要删除这次面试记录吗？此操作不可恢复！', () => {
        storage.deleteInterview(interviewId);
        notify.success('面试记录已删除');
        loadInterviewList();
        
        if (typeof updateHomeStats === 'function') {
            updateHomeStats();
        }
    });
}

// 显示答案模板
function showAnswerTemplates() {
    const templates = AnswerTemplates.getAllTemplates();
    
    let html = '<div class="templates-list">';
    html += '<h3>常用答案模板</h3>';
    
    Object.keys(templates).forEach(key => {
        html += `
            <div class="template-item">
                <h4>${key}</h4>
                <pre class="template-content">${templates[key]}</pre>
                <button class="btn btn-secondary btn-small" onclick="useTemplate('${key}')">使用此模板</button>
            </div>
        `;
    });
    
    html += '</div>';
    
    showModal('resultModal', html);
}

// 使用模板
function useTemplate(templateKey) {
    const template = AnswerTemplates.getTemplate(templateKey);
    if (template) {
        document.getElementById('answerInput').value = template;
        closeModal('resultModal');
        notify.success('模板已应用，请根据实际情况修改');
    }
}

// 朗读问题
function readQuestionAloud() {
    const questionText = document.getElementById('questionContent')?.textContent;
    if (questionText && questionText.trim()) {
        const success = VoiceReader.speak(questionText);
        if (success) {
            notify.info('正在朗读问题...');
        }
    }
}

// 显示答题技巧
function showInterviewTips() {
    const tips = InterviewTips.getAllTips();
    
    let html = '<div class="tips-content">';
    html += '<h3>面试答题技巧</h3>';
    
    Object.keys(tips).forEach(category => {
        html += `
            <div class="tip-category">
                <h4>${category}</h4>
                <ul>
                    ${tips[category].map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        `;
    });
    
    html += '</div>';
    
    showModal('resultModal', html);
}

// 检查答案质量
function checkAnswerQuality() {
    const answer = document.getElementById('answerInput')?.value || '';
    const wordCount = document.getElementById('answerWordCount');
    const qualityDiv = document.getElementById('answerQuality');
    
    // 更新字数统计
    if (wordCount) {
        wordCount.textContent = `${answer.length} 字`;
    }
    
    // 实时质量检测
    if (answer.length > 20 && typeof AnswerQualityChecker !== 'undefined') {
        const quality = AnswerQualityChecker.check(answer);
        
        if (qualityDiv) {
            const qualityLevel = quality.quality >= 80 ? 'high' : quality.quality >= 60 ? 'medium' : 'low';
            const qualityColors = {
                high: '#059669',
                medium: '#d97706',
                low: '#dc2626'
            };
            
            qualityDiv.innerHTML = `
                <span style="color: ${qualityColors[qualityLevel]}; font-size: 0.875rem;">
                    质量: ${quality.quality}%
                </span>
            `;
        }
    } else if (qualityDiv) {
        qualityDiv.innerHTML = '';
    }
}

