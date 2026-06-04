const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#bestScore");
const livesEl = document.querySelector("#lives");
const overlay = document.querySelector("#overlay");
const overlayText = document.querySelector("#overlayText");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const startPosition = { x: 8, y: 14 };
const tickMs = 105;
const movingPoopMoveEvery = 7;

let snake;
let food;
let movingPoop;
let movingPoopDirection;
let movingPoopTicks;
let direction;
let nextDirection;
let score;
let lives;
let bestScore = Number(localStorage.getItem("pinkSnakeBest") || 0);
let timerId = null;
let status = "ready";

function resetGame() {
  snake = [
    { ...startPosition },
    { x: startPosition.x - 1, y: startPosition.y },
    { x: startPosition.x - 2, y: startPosition.y },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  lives = 3;
  food = createFood();
  movingPoop = createFood([food]);
  movingPoopDirection = randomDirection();
  movingPoopTicks = 0;
  status = "ready";
  stopLoop();
  updateHud();
  draw();
  showOverlay("Spausk rodyklę arba mygtuką Start.", "Start");
}

function startGame() {
  if (status === "gameover") {
    resetGame();
  }

  status = "playing";
  hideOverlay();
  stopLoop();
  timerId = window.setInterval(step, tickMs);
}

function pauseGame() {
  if (status === "playing") {
    status = "paused";
    stopLoop();
    showOverlay("Pauzė", "Tęsti");
    return;
  }

  if (status === "paused") {
    startGame();
  }
}

function stopLoop() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function step() {
  direction = nextDirection;
  moveMovingPoop();

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (hitsWall(head) || hitsSelf(head)) {
    loseLife();
    return;
  }

  snake.unshift(head);

  const ateFood = sameCell(head, food);
  const ateMovingPoop = sameCell(head, movingPoop);

  if (ateFood || ateMovingPoop) {
    score += ateMovingPoop ? 30 : 10;
    food = ateFood ? createFood([movingPoop]) : food;
    movingPoop = ateMovingPoop ? createFood([food]) : movingPoop;
    movingPoopDirection = ateMovingPoop ? randomDirection() : movingPoopDirection;
    movingPoopTicks = ateMovingPoop ? 0 : movingPoopTicks;
    bestScore = Math.max(bestScore, score);
    localStorage.setItem("pinkSnakeBest", String(bestScore));
  } else {
    snake.pop();
  }

  updateHud();
  draw();
}

function loseLife() {
  lives -= 1;
  updateHud();

  if (lives <= 0) {
    status = "gameover";
    stopLoop();
    draw();
    showOverlay(`Žaidimas baigtas. Surinkai ${score} taškų.`, "Žaisti vėl");
    return;
  }

  snake = [
    { ...startPosition },
    { x: startPosition.x - 1, y: startPosition.y },
    { x: startPosition.x - 2, y: startPosition.y },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  food = createFood();
  movingPoop = createFood([food]);
  movingPoopDirection = randomDirection();
  movingPoopTicks = 0;
  draw();
}

function createFood(blockedCells = []) {
  let candidate;

  do {
    candidate = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (
    snake?.some((part) => sameCell(part, candidate)) ||
    blockedCells.some((cell) => sameCell(cell, candidate))
  );

  return candidate;
}

function moveMovingPoop() {
  movingPoopTicks += 1;

  if (movingPoopTicks < movingPoopMoveEvery) {
    return;
  }

  movingPoopTicks = 0;

  const possibleDirections = shuffleDirections([
    movingPoopDirection,
    randomDirection(),
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ]);

  const nextSpot = possibleDirections
    .map((move) => ({
      x: movingPoop.x + move.x,
      y: movingPoop.y + move.y,
      direction: move,
    }))
    .find(
      (spot) =>
        !hitsWall(spot) &&
        !sameCell(spot, food) &&
        !snake.some((part) => sameCell(part, spot)),
    );

  if (nextSpot) {
    movingPoop = { x: nextSpot.x, y: nextSpot.y };
    movingPoopDirection = nextSpot.direction;
  } else {
    movingPoopDirection = randomDirection();
  }
}

function randomDirection() {
  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  return directions[Math.floor(Math.random() * directions.length)];
}

function shuffleDirections(directions) {
  return [...directions].sort(() => Math.random() - 0.5);
}

function sameCell(a, b) {
  return a?.x === b?.x && a?.y === b?.y;
}

function hitsWall(point) {
  return point.x < 0 || point.y < 0 || point.x >= tileCount || point.y >= tileCount;
}

function hitsSelf(point) {
  return snake.some((part) => part.x === point.x && part.y === point.y);
}

function setDirection(newDirection) {
  const reversing =
    newDirection.x + direction.x === 0 && newDirection.y + direction.y === 0;

  if (!reversing) {
    nextDirection = newDirection;
  }
}

function updateHud() {
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
  livesEl.textContent = "♥ ".repeat(lives).trim();
}

function showOverlay(text, buttonText) {
  overlayText.textContent = text;
  startButton.textContent = buttonText;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function draw() {
  ctx.fillStyle = "#151518";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawFood();
  drawMovingPoop();
  drawSnake();
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= tileCount; i += 1) {
    const pos = i * gridSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((part, index) => {
    const x = part.x * gridSize;
    const y = part.y * gridSize;
    const isHead = index === 0;

    ctx.fillStyle = isHead ? "#ff8ccc" : "#ff5fb7";
    roundedRect(x + 2, y + 2, gridSize - 4, gridSize - 4, isHead ? 7 : 5);
    ctx.fill();

    if (isHead) {
      drawBanana(x, y);
    }
  });
}

function drawBanana(x, y) {
  ctx.save();
  ctx.translate(x + 10, y + 10);
  ctx.rotate(-0.5);
  ctx.lineCap = "round";

  ctx.strokeStyle = "#ffd36a";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-5, 3);
  ctx.quadraticCurveTo(0, -6, 7, -4);
  ctx.stroke();

  ctx.strokeStyle = "#fff08a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, 2);
  ctx.quadraticCurveTo(0, -4, 6, -3);
  ctx.stroke();

  ctx.fillStyle = "#5a3a18";
  ctx.beginPath();
  ctx.arc(-5, 3, 1.6, 0, Math.PI * 2);
  ctx.arc(7, -4, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFood() {
  const centerX = food.x * gridSize + gridSize / 2;
  const centerY = food.y * gridSize + gridSize / 2;

  drawPoop(centerX, centerY, {
    base: "#7a4424",
    highlight: "#a46838",
    eyes: "#fff8fb",
  });
}

function drawMovingPoop() {
  const centerX = movingPoop.x * gridSize + gridSize / 2;
  const centerY = movingPoop.y * gridSize + gridSize / 2;

  drawPoop(centerX, centerY, {
    base: "#d79a2b",
    highlight: "#ffd36a",
    eyes: "#2a1020",
  });

  ctx.strokeStyle = "rgba(255, 211, 106, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 9, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPoop(centerX, centerY, colors) {
  ctx.fillStyle = colors.base;
  ctx.beginPath();
  ctx.arc(centerX - 4, centerY + 4, 5.5, 0, Math.PI * 2);
  ctx.arc(centerX + 4, centerY + 4, 5.5, 0, Math.PI * 2);
  ctx.arc(centerX, centerY, 6.2, 0, Math.PI * 2);
  ctx.arc(centerX + 1, centerY - 6, 4.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.highlight;
  ctx.beginPath();
  ctx.arc(centerX + 2, centerY - 8, 1.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.eyes;
  ctx.fillRect(centerX - 4.2, centerY - 0.5, 2, 2);
  ctx.fillRect(centerX + 2.2, centerY - 0.5, 2, 2);
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

window.addEventListener("keydown", (event) => {
  const directions = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };

  if (directions[event.key]) {
    event.preventDefault();
    setDirection(directions[event.key]);

    if (status === "ready") {
      startGame();
    }
  }

  if (event.key === " ") {
    event.preventDefault();
    pauseGame();
  }
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", pauseGame);
restartButton.addEventListener("click", resetGame);

resetGame();
