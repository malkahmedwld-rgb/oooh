const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const scoreDisplay = document.getElementById('score');
const pitchStatus = document.getElementById('pitch-status');

canvas.width = document.getElementById('game-container').clientWidth;
canvas.height = window.innerHeight;

let audioCtx, analyser, dataArray;
let isPlaying = false;
let score = 0;
let frame = 0;
let speed = 3;
let obstacles = [];

const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 150,
    w: 50,
    h: 50,
    targetW: 50,
    targetH: 50,
    color: '#00ffcc'
};

async function initAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        startGame();
    } catch (err) {
        alert('يجب السماح باستخدام الميكروفون للعب.');
    }
}

function detectPitch() {
    analyser.getByteFrequencyData(dataArray);
    let maxVal = -Infinity;
    let maxIndex = -1;
    
    for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > maxVal) {
            maxVal = dataArray[i];
            maxIndex = i;
        }
    }

    if (maxVal < 60) {
        player.targetW = 50;
        player.targetH = 50;
        pitchStatus.innerText = 'صامت';
    } else if (maxIndex > 12) { 
        player.targetW = 20;
        player.targetH = 120;
        pitchStatus.innerText = 'إييييي (رفيع)';
    } else {
        player.targetW = 120;
        player.targetH = 20;
        pitchStatus.innerText = 'أوووو (غليظ)';
    }

    player.w += (player.targetW - player.w) * 0.15;
    player.h += (player.targetH - player.h) * 0.15;
    player.x = (canvas.width / 2) - (player.w / 2);
    player.y = canvas.height - 150 - (player.h / 2) + 25;
}

function spawnObstacle() {
    if (frame % 100 === 0) {
        const type = Math.random() > 0.5 ? 'tall' : 'wide';
        obstacles.push({ y: -50, type: type, passed: false });
    }
}

function drawObstacles() {
    ctx.fillStyle = '#e94560';
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.y += speed;

        if (obs.type === 'tall') {
            ctx.fillRect(0, obs.y, canvas.width / 2 - 20, 30);
            ctx.fillRect(canvas.width / 2 + 20, obs.y, canvas.width / 2 - 20, 30);
        } else {
            ctx.fillRect(0, obs.y, canvas.width / 2 - 70, 30);
            ctx.fillRect(canvas.width / 2 + 70, obs.y, canvas.width / 2 - 70, 30);
            ctx.fillRect(canvas.width / 2 - 70, obs.y - 60, 140, 30);
        }

        if (obs.y + 30 > player.y && obs.y < player.y + player.h && !obs.passed) {
            let hit = false;
            if (obs.type === 'tall' && player.w > 40) hit = true;
            if (obs.type === 'wide' && player.h > 40) hit = true;

            if (hit) {
                gameOver();
                return;
            } else if (obs.y > player.y + player.h / 2) {
                obs.passed = true;
                score += 10;
                scoreDisplay.innerText = score;
                speed += 0.2;
            }
        }

        if (obs.y > canvas.height) obstacles.splice(i, 1);
    }
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 10);
    ctx.fill();
}

function gameLoop() {
    if (!isPlaying) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    detectPitch();
    spawnObstacle();
    drawObstacles();
    if (isPlaying) drawPlayer();
    
    frame++;
    requestAnimationFrame(gameLoop);
}

function startGame() {
    startScreen.classList.add('hidden');
    isPlaying = true;
    score = 0;
    frame = 0;
    speed = 4;
    obstacles = [];
    scoreDisplay.innerText = score;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    gameLoop();
}

function gameOver() {
    isPlaying = false;
    startScreen.classList.remove('hidden');
    document.querySelector('#start-screen h1').innerText = 'اصطدمت! جرب مرة أخرى';
    document.getElementById('start-btn').innerText = 'إعادة اللعب';
}

startBtn.addEventListener('click', () => {
    if (!audioCtx) initAudio();
    else startGame();
});

window.addEventListener('resize', () => {
    canvas.width = document.getElementById('game-container').clientWidth;
    canvas.height = window.innerHeight;
});
