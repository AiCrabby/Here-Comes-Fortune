const GAME_CONFIG = {
    GAME_DURATION: 30,        // 游戏时长（秒）
    ITEM_SPAWN_INTERVAL: 300, // 物品生成间隔（毫秒）
    BOMB_SPAWN_INTERVAL: 5000,// 炸弹生成间隔（毫秒）
    ITEM_FALL_SPEED: 6,      // 物品下落速度增加一倍
    PLAYER_SPEED: 15,        // 玩家移动速度
    SCORE_PER_ITEM: 10,      // 每个物品的分数
    PLAYER_SIZE: 300,        // 玩家大小（像素变大）
    ITEM_SIZE: 100,          // 物品大小（像素变大）
    BOMB_SIZE: 120           // 炸弹大小（像素变大）
};

const imageCache = {};
const audioCache = {};
let canvas, ctx;
let playerX, playerY;
let items = [];
let bombs = [];
let currentScore = 0;
let gameTimer;
let isGameOver = false;

class Item {
    constructor(type) {
        this.type = type;
        this.x = Math.random() * (canvas.width - GAME_CONFIG.ITEM_SIZE);
        this.y = 0;
        this.speed = GAME_CONFIG.ITEM_FALL_SPEED;
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            imageCache[src] = img;
            resolve();
        };
        img.onerror = reject;
        img.src = src;
    });
}

function loadAudio(src) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(src);
        audio.onloadeddata = () => {
            audioCache[src] = audio;
            resolve();
        };
        audio.onerror = reject;
        audio.src = src;
    });
}

async function preloadResources() {
    const imagePromises = [
        loadImage('image/user.png'),
        loadImage('image/yuanbao.png'),
        loadImage('image/hongbao.png'),
        loadImage('image/fudai.png'),
        loadImage('image/jintiao.png'),
        loadImage('image/zhuanshi.png'),
        loadImage('image/zhihongbao.png'),
        loadImage('image/dahongbao.png'),
        loadImage('image/bomb.png'),
        loadImage('image/game_background.jpeg'),
        loadImage('image/welcome_background.jpeg')
    ];

    const audioPromises = [
        loadAudio('music/background_music.mp3'),
        loadAudio('music/button.mp3'),
        loadAudio('music/music1.mp3'),
        loadAudio('music/music2.mp3'),
        loadAudio('music/music3.mp3'),
        loadAudio('music/music4.mp3'),
        loadAudio('music/bomb.mp3')
    ];

    await Promise.all([...imagePromises, ...audioPromises]);
}

function resetGame() {
    currentScore = 0;
    items = [];
    bombs = [];
    isGameOver = false;
    playerX = (canvas.width - GAME_CONFIG.PLAYER_SIZE) / 2;
    playerY = canvas.height - GAME_CONFIG.PLAYER_SIZE;
    document.getElementById('score').textContent = currentScore;
    document.getElementById('timer').textContent = GAME_CONFIG.GAME_DURATION;
}

function startGame() {
    resetGame();
    gameTimer = setInterval(() => {
        const remainingTime = parseInt(document.getElementById('timer').textContent) - 1;
        document.getElementById('timer').textContent = remainingTime;
        if (remainingTime <= 0) {
            endGame();
        }
    }, 1000);

    startItemGeneration();
    audioCache['music/background_music.mp3'].loop = true;
    audioCache['music/background_music.mp3'].play();
}

function endGame() {
    clearInterval(gameTimer);
    audioCache['music/background_music.mp3'].pause();
    document.getElementById('final-score').textContent = currentScore;
    document.getElementById('result-modal').style.display = 'flex';
    isGameOver = true;
}

function startItemGeneration() {
    setInterval(() => {
        const itemTypes = ['yuanbao', 'hongbao', 'fudai', 'jintiao', 'zhuanshi', 'zhihongbao', 'dahongbao'];
        const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        items.push(new Item(randomType));
    }, GAME_CONFIG.ITEM_SPAWN_INTERVAL);

    setInterval(() => {
        bombs.push(new Item('bomb'));
    }, GAME_CONFIG.BOMB_SPAWN_INTERVAL);
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function updateGame() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 更新玩家位置
    ctx.drawImage(imageCache['image/user.png'], playerX, playerY, GAME_CONFIG.PLAYER_SIZE, GAME_CONFIG.PLAYER_SIZE);

    // 更新物品位置
    items = items.filter(item => {
        item.y += item.speed;
        ctx.drawImage(imageCache[`image/${item.type}.png`], item.x, item.y, GAME_CONFIG.ITEM_SIZE, GAME_CONFIG.ITEM_SIZE);
        if (checkCollision({ x: playerX, y: playerY, width: GAME_CONFIG.PLAYER_SIZE, height: GAME_CONFIG.PLAYER_SIZE }, { x: item.x, y: item.y, width: GAME_CONFIG.ITEM_SIZE, height: GAME_CONFIG.ITEM_SIZE })) {
            currentScore += GAME_CONFIG.SCORE_PER_ITEM;
            document.getElementById('score').textContent = currentScore;
            audioCache[`music/music${Math.floor(Math.random() * 4) + 1}.mp3`].play();
            return false;
        }
        return item.y < canvas.height;
    });

    // 更新炸弹位置
    bombs = bombs.filter(bomb => {
        bomb.y += bomb.speed;
        ctx.drawImage(imageCache['image/bomb.png'], bomb.x, bomb.y, GAME_CONFIG.BOMB_SIZE, GAME_CONFIG.BOMB_SIZE);
        if (checkCollision({ x: playerX, y: playerY, width: GAME_CONFIG.PLAYER_SIZE, height: GAME_CONFIG.PLAYER_SIZE }, { x: bomb.x, y: bomb.y, width: GAME_CONFIG.BOMB_SIZE, height: GAME_CONFIG.BOMB_SIZE })) {
            endGame();
            audioCache['music/bomb.mp3'].play();
            return false;
        }
        return bomb.y < canvas.height;
    });

    requestAnimationFrame(updateGame);
}

function handleKeyDown(event) {
    if (event.keyCode === 37) { // 左键
        playerX = Math.max(0, playerX - GAME_CONFIG.PLAYER_SPEED);
    } else if (event.keyCode === 39) { // 右键
        playerX = Math.min(canvas.width - GAME_CONFIG.PLAYER_SIZE, playerX + GAME_CONFIG.PLAYER_SPEED);
    }
}

function handleTouchStart(event) {
    event.preventDefault();
    touchStartX = event.touches[0].clientX;
}

function handleTouchMove(event) {
    event.preventDefault();
    const touchMoveX = event.touches[0].clientX;
    const deltaX = touchMoveX - touchStartX;
    playerX = Math.min(Math.max(0, playerX + deltaX), canvas.width - GAME_CONFIG.PLAYER_SIZE);
    touchStartX = touchMoveX;
}

document.addEventListener('DOMContentLoaded', async () => {
    await preloadResources();

    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    document.querySelector('.start-button').addEventListener('click', () => {
        document.querySelector('.welcome-page').style.display = 'none';
        document.querySelector('.game-page').style.display = 'block';
        startGame();
    });

    document.getElementById('retry-button').addEventListener('click', () => {
        document.getElementById('result-modal').style.display = 'none';
        document.querySelector('.game-page').style.display = 'block';
        startGame();
    });

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    updateGame();
});
