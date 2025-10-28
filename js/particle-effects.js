// 交互粒子特效系统

class ParticleEffects {
    constructor() {
        this.particles = [];
        this.init();
    }

    init() {
        // 监听点击事件 - 涟漪扩散
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn') || 
                e.target.classList.contains('nav-btn') ||
                e.target.closest('.glass-card')) {
                this.createRipple(e.clientX, e.clientY);
            }
        });

        // 监听按钮悬停 - 粒子飞溅
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('btn-primary') || 
                e.target.classList.contains('btn-secondary')) {
                this.createHoverParticles(e.target);
            }
        });
    }

    // 创建涟漪效果
    createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        document.body.appendChild(ripple);

        setTimeout(() => ripple.remove(), 1000);
    }

    // 创建悬停粒子
    createHoverParticles(element) {
        const rect = element.getBoundingClientRect();
        const particleCount = 5;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'hover-particle';
            
            const x = rect.left + Math.random() * rect.width;
            const y = rect.top + Math.random() * rect.height;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            document.body.appendChild(particle);

            setTimeout(() => particle.remove(), 1000);
        }
    }

    // 创建成功特效
    static createSuccessEffect(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'success-particle';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            
            const angle = (Math.PI * 2 * i) / 20;
            const velocity = 100 + Math.random() * 50;
            
            particle.style.setProperty('--tx', Math.cos(angle) * velocity + 'px');
            particle.style.setProperty('--ty', Math.sin(angle) * velocity + 'px');
            
            document.body.appendChild(particle);

            setTimeout(() => particle.remove(), 1000);
        }
    }

    // 创建错误抖动效果
    static createErrorShake(element) {
        element.style.animation = 'errorShake 0.5s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }
}

// 初始化粒子系统
const particleEffects = new ParticleEffects();

// 添加特效样式
const effectStyles = `
<style>
/* 涟漪效果 */
.ripple-effect {
    position: fixed;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 107, 53, 0.6), transparent);
    pointer-events: none;
    transform: translate(-50%, -50%);
    animation: rippleExpand 1s ease-out forwards;
    z-index: 9999;
}

@keyframes rippleExpand {
    0% {
        width: 20px;
        height: 20px;
        opacity: 1;
    }
    100% {
        width: 200px;
        height: 200px;
        opacity: 0;
    }
}

/* 悬停粒子 */
.hover-particle {
    position: fixed;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 107, 53, 0.8), rgba(74, 47, 189, 0.4));
    pointer-events: none;
    animation: particleFly 1s ease-out forwards;
    z-index: 9999;
    box-shadow: 0 0 10px rgba(255, 107, 53, 0.8);
}

@keyframes particleFly {
    0% {
        transform: translate(0, 0) scale(1);
        opacity: 1;
    }
    100% {
        transform: translate(
            calc((var(--random-x, 0.5) - 0.5) * 100px),
            calc((var(--random-y, 0.5) - 0.5) * 100px - 50px)
        ) scale(0);
        opacity: 0;
    }
}

/* 成功粒子 */
.success-particle {
    position: fixed;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(16, 185, 129, 1), rgba(52, 211, 153, 0.5));
    pointer-events: none;
    animation: successBurst 1s ease-out forwards;
    z-index: 9999;
    box-shadow: 0 0 15px rgba(16, 185, 129, 1);
}

@keyframes successBurst {
    0% {
        transform: translate(0, 0) scale(1);
        opacity: 1;
    }
    100% {
        transform: translate(var(--tx, 0), var(--ty, 0)) scale(0);
        opacity: 0;
    }
}

/* 错误抖动 */
@keyframes errorShake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
}

/* 光标扫描效果 */
body {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="%23FF6B35" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="%23FF6B35"/></svg>'), auto;
}

.btn, .nav-btn, a {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="%234A2FBD" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="%234A2FBD"/></svg>'), pointer;
}

/* 文字高亮波纹 */
.text-highlight {
    position: relative;
    display: inline-block;
}

.text-highlight::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.8), transparent);
    animation: highlightWave 2s ease-in-out infinite;
}

@keyframes highlightWave {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
}

/* 数据流动效果 */
@keyframes dataFlow {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}

.data-flow {
    background: linear-gradient(
        90deg,
        rgba(255, 107, 53, 0.1) 0%,
        rgba(74, 47, 189, 0.2) 25%,
        rgba(255, 107, 53, 0.1) 50%,
        rgba(74, 47, 189, 0.2) 75%,
        rgba(255, 107, 53, 0.1) 100%
    );
    background-size: 200% 100%;
    animation: dataFlow 3s linear infinite;
}

/* 脉冲光晕 */
.pulse-glow {
    animation: pulseGlow 2s ease-in-out infinite;
}

@keyframes pulseGlow {
    0%, 100% {
        box-shadow: 0 0 20px rgba(255, 107, 53, 0.5);
    }
    50% {
        box-shadow: 0 0 40px rgba(74, 47, 189, 0.8);
    }
}

/* 故障艺术效果 */
.glitch {
    position: relative;
}

.glitch::before,
.glitch::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.glitch::before {
    left: 2px;
    text-shadow: -2px 0 #FF6B35;
    clip: rect(24px, 550px, 90px, 0);
    animation: glitch-anim 3s infinite linear alternate-reverse;
}

.glitch::after {
    left: -2px;
    text-shadow: -2px 0 #4A2FBD;
    clip: rect(85px, 550px, 140px, 0);
    animation: glitch-anim 2s infinite linear alternate-reverse;
}

@keyframes glitch-anim {
    0% { clip: rect(random(100) + px, 9999px, random(100) + px, 0); }
    5% { clip: rect(random(100) + px, 9999px, random(100) + px, 0); }
    10% { clip: rect(random(100) + px, 9999px, random(100) + px, 0); }
    15% { clip: rect(random(100) + px, 9999px, random(100) + px, 0); }
    20% { clip: rect(random(100) + px, 9999px, random(100) + px, 0); }
    100% { clip: rect(random(100) + px, 9999px, random(100) + px, 0); }
}

/* 呼吸光效 */
.breath-light {
    animation: breathLight 3s ease-in-out infinite;
}

@keyframes breathLight {
    0%, 100% {
        opacity: 0.6;
        filter: brightness(1);
    }
    50% {
        opacity: 1;
        filter: brightness(1.3);
    }
}

/* 磁吸效果增强 */
.btn:hover {
    animation: magneticPull 0.3s ease-out;
}

@keyframes magneticPull {
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1.05); }
}

/* 3D翻转卡片 */
.flip-card {
    perspective: 1000px;
}

.flip-card-inner {
    transition: transform 0.6s;
    transform-style: preserve-3d;
}

.flip-card:hover .flip-card-inner {
    transform: rotateY(180deg);
}

/* 能量条充能效果 */
@keyframes energyCharge {
    0% {
        background-position: 0% 50%;
        box-shadow: 0 0 10px rgba(255, 107, 53, 0.5);
    }
    50% {
        background-position: 100% 50%;
        box-shadow: 0 0 30px rgba(74, 47, 189, 0.8);
    }
    100% {
        background-position: 0% 50%;
        box-shadow: 0 0 10px rgba(255, 107, 53, 0.5);
    }
}

.energy-bar {
    background: linear-gradient(
        90deg,
        #FF6B35 0%,
        #4A2FBD 50%,
        #FF6B35 100%
    );
    background-size: 200% 100%;
    animation: energyCharge 2s linear infinite;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', effectStyles);

// 导出工具函数
window.ParticleEffects = ParticleEffects;

