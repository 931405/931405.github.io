// 量子初始化加载动画

class QuantumLoader {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.stage = 1;
        this.progress = 0;
    }

    // 创建加载界面
    createLoader() {
        const loaderHTML = `
            <div id="quantum-loader" class="quantum-loader">
                <canvas id="particle-canvas"></canvas>
                <div class="loader-content">
                    <div class="logo-particles" id="logoParticles"></div>
                    <div class="loader-text" id="loaderText">正在连接AI面试官神经网络...</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                        <div class="progress-glow"></div>
                    </div>
                    <div class="stage-info" id="stageInfo">量子初始化</div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', loaderHTML);
        
        // 初始化canvas
        this.canvas = document.getElementById('particle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 创建粒子
        this.createParticles();
        
        // 开始动画
        this.animate();
        
        // 模拟加载进度
        this.simulateLoading();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // 创建粒子系统
    createParticles() {
        const particleCount = 150;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: Math.random() * 3 + 1,
                opacity: Math.random(),
                color: this.getParticleColor()
            });
        }
    }

    getParticleColor() {
        const colors = [
            'rgba(255, 107, 53, ',  // 思维橙
            'rgba(74, 47, 189, ',   // 宇宙紫
            'rgba(232, 238, 242, '  // 量子银
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 绘制粒子
    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制连接线
        this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(255, 107, 53, ${0.2 * (1 - distance / 100)})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            });
        });
        
        // 绘制粒子
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color + particle.opacity + ')';
            this.ctx.fill();
            
            // 发光效果
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.radius * 3
            );
            gradient.addColorStop(0, particle.color + particle.opacity + ')');
            gradient.addColorStop(1, particle.color + '0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        });
    }

    // 更新粒子位置
    updateParticles() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.particles.forEach(particle => {
            // 根据阶段改变粒子行为
            if (this.stage === 1) {
                // 阶段1：随机运动
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // 边界反弹
                if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            } else if (this.stage === 2) {
                // 阶段2：向中心聚集
                const dx = centerX - particle.x;
                const dy = centerY - particle.y;
                particle.x += dx * 0.02;
                particle.y += dy * 0.02;
            } else if (this.stage === 3) {
                // 阶段3：螺旋运动
                const angle = Math.atan2(particle.y - centerY, particle.x - centerX);
                const distance = Math.sqrt(
                    Math.pow(particle.x - centerX, 2) + 
                    Math.pow(particle.y - centerY, 2)
                );
                particle.x = centerX + Math.cos(angle + 0.05) * distance * 0.98;
                particle.y = centerY + Math.sin(angle + 0.05) * distance * 0.98;
            }
            
            // 透明度脉动
            particle.opacity = 0.3 + Math.sin(Date.now() * 0.001 + particle.x) * 0.3;
        });
    }

    // 动画循环
    animate() {
        this.updateParticles();
        this.drawParticles();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // 模拟加载进度
    simulateLoading() {
        const stages = [
            { text: '正在连接AI面试官神经网络...', info: '量子初始化', duration: 1500 },
            { text: '语义解析引擎启动中...', info: '能力矩阵构建', duration: 1500 },
            { text: '情绪识别模块加载...', info: '能力矩阵构建', duration: 1000 },
            { text: '回答评估算法校准...', info: '能力矩阵构建', duration: 1000 },
            { text: 'AI面试官已就位，祝您交流愉快', info: '全息就位', duration: 1000 }
        ];
        
        let currentStage = 0;
        const totalDuration = stages.reduce((sum, s) => sum + s.duration, 0);
        let elapsed = 0;
        
        const updateStage = () => {
            if (currentStage < stages.length) {
                const stage = stages[currentStage];
                document.getElementById('loaderText').textContent = stage.text;
                document.getElementById('stageInfo').textContent = stage.info;
                
                // 更新阶段
                this.stage = Math.floor(currentStage / 2) + 1;
                
                elapsed += stage.duration;
                this.progress = (elapsed / totalDuration) * 100;
                document.getElementById('progressFill').style.width = this.progress + '%';
                
                currentStage++;
                
                if (currentStage < stages.length) {
                    setTimeout(updateStage, stage.duration);
                } else {
                    setTimeout(() => this.complete(), 500);
                }
            }
        };
        
        updateStage();
    }

    // 完成加载
    complete() {
        const loader = document.getElementById('quantum-loader');
        loader.style.animation = 'loaderFadeOut 0.8s ease-out forwards';
        
        setTimeout(() => {
            cancelAnimationFrame(this.animationId);
            loader.remove();
        }, 800);
    }
}

// 在页面加载时自动启动
window.addEventListener('load', () => {
    // 检查是否是首次加载
    const hasLoaded = sessionStorage.getItem('quantumLoaderShown');
    
    if (!hasLoaded) {
        const loader = new QuantumLoader();
        loader.createLoader();
        sessionStorage.setItem('quantumLoaderShown', 'true');
    }
});

// 添加加载器样式
const loaderStyles = `
<style>
.quantum-loader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0F1B33 0%, #1A2B4D 50%, #4A2FBD 100%);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
}

#particle-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.loader-content {
    position: relative;
    z-index: 10001;
    text-align: center;
    max-width: 600px;
    padding: 2rem;
}

.logo-particles {
    width: 150px;
    height: 150px;
    margin: 0 auto 2rem;
    background: radial-gradient(circle, rgba(255, 107, 53, 0.3), transparent);
    border-radius: 50%;
    animation: logoFloat 3s ease-in-out infinite;
    position: relative;
}

.logo-particles::before {
    content: '🎯';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 4rem;
    animation: logoRotate 4s linear infinite;
}

@keyframes logoFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
}

@keyframes logoRotate {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
}

.loader-text {
    font-size: 1.5rem;
    color: #FFFFFF;
    margin-bottom: 2rem;
    text-shadow: 0 0 20px rgba(255, 107, 53, 0.8);
    animation: textPulse 2s ease-in-out infinite;
}

@keyframes textPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

.progress-bar {
    width: 100%;
    height: 6px;
    background: rgba(232, 238, 242, 0.1);
    border-radius: 10px;
    overflow: hidden;
    position: relative;
    margin-bottom: 1rem;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #FF6B35, #4A2FBD);
    border-radius: 10px;
    transition: width 0.5s ease-out;
    position: relative;
}

.progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: progressShine 1.5s ease-in-out infinite;
}

@keyframes progressShine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

.progress-glow {
    position: absolute;
    top: -10px;
    left: 0;
    right: 0;
    bottom: -10px;
    background: radial-gradient(ellipse, rgba(255, 107, 53, 0.5), transparent);
    filter: blur(15px);
    animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
}

.stage-info {
    font-size: 1rem;
    color: #B0B8C5;
    text-transform: uppercase;
    letter-spacing: 2px;
}

@keyframes loaderFadeOut {
    to {
        opacity: 0;
        transform: scale(1.1);
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', loaderStyles);

