// 图表绘制模块（轻量级Canvas实现）

class SimpleChart {
    // 绘制雷达图
    static drawRadarChart(canvas, data) {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) / 2 - 40;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        const categories = Object.keys(data);
        const values = Object.values(data);
        const angleStep = (Math.PI * 2) / categories.length;
        
        // 绘制背景网格
        ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--border-color').trim() || '#e5e7eb';
        ctx.lineWidth = 1;
        
        for (let i = 1; i <= 5; i++) {
            const radius = (maxRadius / 5) * i;
            ctx.beginPath();
            
            for (let j = 0; j <= categories.length; j++) {
                const angle = angleStep * j - Math.PI / 2;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.closePath();
            ctx.stroke();
        }
        
        // 绘制轴线
        ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--border-color').trim() || '#e5e7eb';
        
        for (let i = 0; i < categories.length; i++) {
            const angle = angleStep * i - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * maxRadius,
                centerY + Math.sin(angle) * maxRadius
            );
            ctx.stroke();
        }
        
        // 绘制数据区域
        ctx.fillStyle = 'rgba(37, 99, 235, 0.2)';
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        
        for (let i = 0; i <= categories.length; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const value = values[i % categories.length];
            const radius = (value / 100) * maxRadius;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 绘制数据点
        ctx.fillStyle = '#2563eb';
        
        for (let i = 0; i < categories.length; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const value = values[i];
            const radius = (value / 100) * maxRadius;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制标签
        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-primary').trim() || '#111827';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let i = 0; i < categories.length; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const labelRadius = maxRadius + 25;
            const x = centerX + Math.cos(angle) * labelRadius;
            const y = centerY + Math.sin(angle) * labelRadius;
            
            ctx.fillText(categories[i], x, y);
            
            // 绘制分数
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = '#2563eb';
            ctx.fillText(values[i], x, y + 15);
            ctx.font = '12px sans-serif';
            ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-primary').trim() || '#111827';
        }
    }
    
    // 更新雷达图
    static updateRadarChart(interviews) {
        const canvas = document.getElementById('radarCanvas');
        if (!canvas) return;
        
        const completedInterviews = interviews.filter(i => i.status === 'completed');
        
        if (completedInterviews.length === 0) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-secondary').trim();
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // 使用最近一次完成的面试数据
        const latestInterview = completedInterviews[completedInterviews.length - 1];
        const radarData = Analytics.generateSkillRadarData(latestInterview);
        
        this.drawRadarChart(canvas, radarData);
        
        // 更新弱点分析
        this.updateWeaknessAnalysis(interviews);
    }
    
    // 更新弱点分析
    static updateWeaknessAnalysis(interviews) {
        const container = document.getElementById('weaknessAnalysis');
        if (!container) return;
        
        const weaknesses = Analytics.identifyWeaknesses(interviews);
        
        if (weaknesses.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:1rem;">暂无明显弱点，继续保持！</p>';
            return;
        }
        
        container.innerHTML = `
            <div style="margin-top:1rem;">
                <h4 style="font-size:0.9375rem;font-weight:600;color:var(--text-primary);margin-bottom:0.75rem;">需要加强的方面</h4>
                ${weaknesses.map(w => `
                    <div class="weakness-item">
                        <div>
                            <div class="weakness-name">${w.area}</div>
                            <div class="weakness-suggestion">${w.suggestion}</div>
                        </div>
                        <span class="weakness-score ${w.score < 60 ? 'low' : 'medium'}">${w.score}分</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// 导出
window.SimpleChart = SimpleChart;

