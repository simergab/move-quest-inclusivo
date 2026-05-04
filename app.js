const video = document.querySelector("#camera");
const poseCanvas = document.querySelector("#poseCanvas");
const poseCtx = poseCanvas.getContext("2d");
const avatarCanvas = document.querySelector("#avatarCanvas");
const avatarCtx = avatarCanvas.getContext("2d");
const modeTabs = document.querySelector("#modeTabs");
const startButton = document.querySelector("#startButton");
const nextButton = document.querySelector("#nextButton");
const audioButton = document.querySelector("#audioButton");
const exerciseName = document.querySelector("#exerciseName");
const exerciseHint = document.querySelector("#exerciseHint");
const movementIcon = document.querySelector("#movementIcon");
const scoreEl = document.querySelector("#score");
const coinsEl = document.querySelector("#coins");
const accuracyEl = document.querySelector("#accuracy");
const repsEl = document.querySelector("#reps");
const timerText = document.querySelector("#timerText");
const timerRing = document.querySelector("#timerRing");
const cameraBadge = document.querySelector("#cameraBadge");
const positiveFeedback = document.querySelector("#positiveFeedback");
const modeDescription = document.querySelector("#modeDescription");
const avatarLevel = document.querySelector("#avatarLevel");
const weeklyRank = document.querySelector("#weeklyRank");
const levelFill = document.querySelector("#levelFill");
const shopList = document.querySelector("#shopList");
const skinStrip = document.querySelector("#skinStrip");
const rankingList = document.querySelector("#rankingList");
const toastHost = document.querySelector("#toastHost");

const ROUND_SECONDS = 60;
const COOLDOWN_MS = 1100;
const ringLength = 2 * Math.PI * 52;

const modes = [
  {
    id: "run",
    name: "Corrida virtual",
    description: "Competicao em tempo real simulada pela marcha e corrida no lugar.",
    exercises: ["march", "jump", "arms"],
    scoreMultiplier: 1.2,
  },
  {
    id: "dance",
    name: "Jogo de danca",
    description: "A camera avalia ritmo, direcao e precisao dos gestos.",
    exercises: ["dance", "arms", "jack"],
    scoreMultiplier: 1.35,
  },
  {
    id: "friends",
    name: "Desafios",
    description: "Rodadas curtas contra amigos com ranking semanal e mensal.",
    exercises: ["squat", "march", "dance"],
    scoreMultiplier: 1.45,
  },
  {
    id: "inclusive",
    name: "Adaptado",
    description: "Movimentos simples, ritmo mais lento, audio e feedback positivo constante.",
    exercises: ["march", "arms", "dance"],
    scoreMultiplier: 1,
  },
];

const exerciseLibrary = {
  march: {
    icon: "1",
    name: "Marcha leve",
    hint: "Levante um joelho por vez, sem pressa.",
    spoken: "Marcha leve. Levante um joelho por vez. Voce pode ir devagar.",
    detect: detectMarch,
  },
  jump: {
    icon: "2",
    name: "Pulo pequeno",
    hint: "Dobre um pouco os joelhos e pule baixo.",
    spoken: "Pulo pequeno. Pule baixo e volte com calma.",
    detect: detectJump,
  },
  jack: {
    icon: "3",
    name: "Polichinelo adaptado",
    hint: "Abra bracos e pernas. Se preferir, abra so os bracos.",
    spoken: "Polichinelo adaptado. Abra bracos e pernas, ou apenas os bracos.",
    detect: detectJumpingJack,
  },
  squat: {
    icon: "4",
    name: "Agachamento simples",
    hint: "Sente no ar um pouquinho e suba de novo.",
    spoken: "Agachamento simples. Baixe um pouco o corpo e suba de novo.",
    detect: detectSquat,
  },
  dance: {
    icon: "5",
    name: "Danca lateral",
    hint: "Balance o corpo para um lado e depois para o outro.",
    spoken: "Danca lateral. Balance para um lado e depois para o outro.",
    detect: detectDance,
  },
  arms: {
    icon: "6",
    name: "Bracos para cima",
    hint: "Levante as duas maos acima da cabeca.",
    spoken: "Bracos para cima. Levante as duas maos acima da cabeca.",
    detect: detectArmsUp,
  },
};

const rewards = [
  { id: "starter", type: "Roupa", name: "Treino", color: "#5fe0b8", price: 0, owned: true },
  { id: "sun", type: "Roupa", name: "Energia solar", color: "#ffd35a", price: 40, owned: false },
  { id: "beat", type: "Roupa", name: "Danca pop", color: "#ff7d73", price: 70, owned: false },
  { id: "focus", type: "Habilidade", name: "Ritmo lento", color: "#8eb6ff", price: 95, owned: false },
  { id: "team", type: "Desafio", name: "Duelo amigo", color: "#b8f060", price: 130, owned: false },
  { id: "star", type: "Roupa", name: "Campeao", color: "#d9a7ff", price: 170, owned: false },
];

const baseRanking = [
  { name: "Ana", score: 1240 },
  { name: "Leo", score: 980 },
  { name: "Mila", score: 760 },
  { name: "Voce", score: 0 },
  { name: "Rafa", score: 420 },
];

const goodFeedback = [
  "Muito bem. Continue no seu ritmo.",
  "Excelente movimento. Seu avatar ficou mais forte.",
  "Boa tentativa. Cada movimento conta.",
  "Mandou bem. Vamos para o proximo passo com calma.",
  "Otimo. Seu corpo foi reconhecido pela camera.",
];

let pose;
let camera;
let selectedMode = modes[3];
let currentExerciseIndex = 0;
let score = 0;
let coins = 0;
let reps = 0;
let attempts = 0;
let lastRepAt = 0;
let roundStartedAt = 0;
let history = [];
let gameRunning = false;
let selectedReward = rewards[0];
let phase = {};

timerRing.style.strokeDasharray = `${ringLength}`;
timerRing.style.strokeDashoffset = "0";

function resizeCanvas() {
  const rect = poseCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  poseCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
  poseCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  poseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function setupPose() {
  pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.55,
    minTrackingConfidence: 0.55,
  });
  pose.onResults(onPoseResults);
}

async function startCamera() {
  startButton.disabled = true;
  startButton.textContent = "Carregando...";

  if (!pose) setupPose();

  camera = new Camera(video, {
    onFrame: async () => {
      await pose.send({ image: video });
    },
    width: 960,
    height: 720,
  });

  await camera.start();
  gameRunning = true;
  roundStartedAt = performance.now();
  startButton.textContent = "Camera ligada";
  cameraBadge.classList.add("hidden");
  speakCurrentExercise();
  showToast("Camera ligada. Vamos com calma e no seu ritmo.");
}

function onPoseResults(results) {
  resizeCanvas();
  const width = poseCanvas.clientWidth;
  const height = poseCanvas.clientHeight;
  poseCtx.save();
  poseCtx.clearRect(0, 0, width, height);
  poseCtx.drawImage(results.image, 0, 0, width, height);

  if (results.poseLandmarks) {
    drawConnectors(poseCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#5fe0b8", lineWidth: 4 });
    drawLandmarks(poseCtx, results.poseLandmarks, { color: "#ffd35a", lineWidth: 2, radius: 3 });
    pushHistory(results.poseLandmarks);
    if (gameRunning) evaluateMove(results.poseLandmarks);
  }
  poseCtx.restore();
}

function pushHistory(landmarks) {
  const now = performance.now();
  const snapshot = {
    t: now,
    noseY: landmarks[0].y,
    leftWristY: landmarks[15].y,
    rightWristY: landmarks[16].y,
    leftKneeY: landmarks[25].y,
    rightKneeY: landmarks[26].y,
    shoulderY: avg(landmarks[11].y, landmarks[12].y),
    hipY: avg(landmarks[23].y, landmarks[24].y),
    centerX: avg(landmarks[11].x, landmarks[12].x, landmarks[23].x, landmarks[24].x),
  };
  history.push(snapshot);
  history = history.filter((item) => now - item.t < 1800);
}

function evaluateMove(landmarks) {
  const now = performance.now();
  updateTimer(now);
  attempts += 1;

  if (now - lastRepAt < COOLDOWN_MS) {
    updateHud();
    return;
  }

  const exercise = currentExercise();
  if (exercise.detect(landmarks, history)) {
    lastRepAt = now;
    reps += 1;
    const precision = Math.min(100, Math.round(62 + reps * 3 + selectedMode.scoreMultiplier * 8));
    const gained = Math.round((12 + precision / 10) * selectedMode.scoreMultiplier);
    score += gained;
    coins += Math.max(2, Math.ceil(gained / 5));
    phase = { ...phase, hitAt: now };
    positiveFeedback.textContent = goodFeedback[reps % goodFeedback.length];
    updateHud();
    showToast(`+${gained} pontos. ${positiveFeedback.textContent}`);
  }
}

function updateTimer(now) {
  const elapsed = (now - roundStartedAt) / 1000;
  const left = Math.max(0, ROUND_SECONDS - elapsed);
  timerText.textContent = Math.ceil(left);
  timerRing.style.strokeDashoffset = `${ringLength * (1 - left / ROUND_SECONDS)}`;

  if (left <= 0) {
    nextExercise();
  }
}

function currentExercise() {
  const ids = selectedMode.exercises;
  return exerciseLibrary[ids[currentExerciseIndex % ids.length]];
}

function nextExercise() {
  currentExerciseIndex += 1;
  roundStartedAt = performance.now();
  lastRepAt = 0;
  phase = {};
  renderCurrentExercise();
  speakCurrentExercise();
  updateHud();
}

function selectMode(modeId) {
  selectedMode = modes.find((mode) => mode.id === modeId) || modes[3];
  currentExerciseIndex = 0;
  phase = {};
  roundStartedAt = performance.now();
  modeDescription.textContent = selectedMode.description;
  positiveFeedback.textContent = selectedMode.id === "inclusive"
    ? "Voce consegue. Vamos devagar."
    : "Prepare-se para a rodada.";
  renderModes();
  renderCurrentExercise();
  updateHud();
}

function renderModes() {
  modeTabs.innerHTML = "";
  modes.forEach((mode) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mode-tab${mode.id === selectedMode.id ? " active" : ""}`;
    button.textContent = mode.name;
    button.addEventListener("click", () => selectMode(mode.id));
    modeTabs.append(button);
  });
}

function renderCurrentExercise() {
  const exercise = currentExercise();
  movementIcon.textContent = exercise.icon;
  exerciseName.textContent = exercise.name;
  exerciseHint.textContent = exercise.hint;
}

function speakCurrentExercise() {
  const synth = window.speechSynthesis;
  if (!synth) {
    showToast("Audio indisponivel neste navegador.");
    return;
  }

  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(currentExercise().spoken);
  utterance.lang = "pt-BR";
  utterance.rate = selectedMode.id === "inclusive" ? 0.82 : 0.95;
  synth.speak(utterance);
}

function detectMarch(_landmarks, frames) {
  if (frames.length < 10) return false;
  const knees = frames.map((frame) => Math.abs(frame.leftKneeY - frame.rightKneeY));
  const kneeLift = Math.max(...knees) - Math.min(...knees);
  const recent = knees[knees.length - 1];
  if (kneeLift > 0.035 && recent > 0.035 && !phase.marchStep) {
    phase.marchStep = true;
    return true;
  }
  if (recent < 0.018) phase.marchStep = false;
  return false;
}

function detectJump(_landmarks, frames) {
  if (frames.length < 8) return false;
  const highest = Math.min(...frames.map((frame) => frame.hipY));
  const lowest = Math.max(...frames.map((frame) => frame.hipY));
  const lifted = lowest - highest > 0.04;
  if (lifted && frames[frames.length - 1].hipY < highest + 0.018 && !phase.jumpUp) {
    phase.jumpUp = true;
    return true;
  }
  if (frames[frames.length - 1].hipY > lowest - 0.015) phase.jumpUp = false;
  return false;
}

function detectJumpingJack(landmarks) {
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const handsHigh = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
  const handsWide = Math.abs(leftWrist.x - rightWrist.x) > 0.34;
  const legsWide = Math.abs(leftAnkle.x - rightAnkle.x) > 0.22;
  const adaptedOpen = handsHigh && handsWide;
  const fullOpen = adaptedOpen && legsWide;

  if ((adaptedOpen || fullOpen) && !phase.jackOpen) {
    phase.jackOpen = true;
    return true;
  }
  if (!adaptedOpen && phase.jackOpen) phase.jackOpen = false;
  return false;
}

function detectSquat(landmarks) {
  const hipY = avg(landmarks[23].y, landmarks[24].y);
  const kneeY = avg(landmarks[25].y, landmarks[26].y);
  const ankleY = avg(landmarks[27].y, landmarks[28].y);
  const squatDepth = (hipY - kneeY) / Math.max(0.05, ankleY - kneeY);
  const down = squatDepth > 0.28;
  if (down && !phase.squatDown) {
    phase.squatDown = true;
    return true;
  }
  if (!down && phase.squatDown) phase.squatDown = false;
  return false;
}

function detectDance(_landmarks, frames) {
  if (frames.length < 12) return false;
  const xs = frames.map((frame) => frame.centerX);
  const sway = Math.max(...xs) - Math.min(...xs);
  const latest = xs[xs.length - 1];
  const direction = latest > xs[Math.max(0, xs.length - 6)] ? "direita" : "esquerda";
  if (sway > 0.045 && phase.lastDanceDirection && phase.lastDanceDirection !== direction) {
    phase.lastDanceDirection = direction;
    return true;
  }
  phase.lastDanceDirection = direction;
  return false;
}

function detectArmsUp(landmarks) {
  const nose = landmarks[0];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const up = leftWrist.y < nose.y && rightWrist.y < nose.y;
  if (up && !phase.armsUp) {
    phase.armsUp = true;
    return true;
  }
  if (!up && phase.armsUp) phase.armsUp = false;
  return false;
}

function updateHud() {
  const level = Math.floor(score / 180) + 1;
  const levelProgress = Math.min(100, Math.round((score % 180) / 180 * 100));
  const accuracy = attempts ? Math.min(100, Math.round((reps / Math.max(1, attempts / 26)) * 100)) : 0;

  scoreEl.textContent = score;
  coinsEl.textContent = coins;
  accuracyEl.textContent = `${accuracy}%`;
  repsEl.textContent = reps;
  avatarLevel.textContent = `Nivel ${level} - ${levelTitle(level)}`;
  levelFill.style.width = `${levelProgress}%`;
  renderRanking();
  renderShop();
  renderSkins();
}

function levelTitle(level) {
  if (level >= 8) return "Campeao ativo";
  if (level >= 5) return "Explorador em movimento";
  if (level >= 3) return "Corpo acordado";
  return "Comecando";
}

function renderRanking() {
  const ranking = baseRanking
    .map((player) => player.name === "Voce" ? { ...player, score } : player)
    .sort((a, b) => b.score - a.score);
  const userPosition = ranking.findIndex((player) => player.name === "Voce") + 1;
  weeklyRank.textContent = `Semana: ${userPosition}o`;
  rankingList.innerHTML = "";

  ranking.slice(0, 5).forEach((player, index) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <div class="ranking-pos">${index + 1}</div>
      <div><strong>${player.name}</strong><span>${player.name === "Voce" ? "Seu desafio atual" : "Amigo"}</span></div>
      <strong>${player.score}</strong>
    `;
    rankingList.append(item);
  });
}

function renderShop() {
  shopList.innerHTML = "";
  rewards.forEach((reward) => {
    const card = document.createElement("div");
    card.className = "shop-card";
    card.innerHTML = `
      <div class="shop-swatch" style="--skin:${reward.color}">${reward.type[0]}</div>
      <div><strong>${reward.name}</strong><span>${reward.owned ? reward.type + " desbloqueada" : `${reward.price} moedas - ${reward.type}`}</span></div>
    `;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = reward.owned ? (selectedReward.id === reward.id ? "Usando" : "Usar") : "Comprar";
    button.disabled = selectedReward.id === reward.id || (!reward.owned && coins < reward.price);
    button.addEventListener("click", () => buyOrUseReward(reward));
    card.append(button);
    shopList.append(card);
  });
}

function renderSkins() {
  skinStrip.innerHTML = "";
  rewards.filter((reward) => reward.owned && reward.type === "Roupa").forEach((reward) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `skin-chip${selectedReward.id === reward.id ? " active" : ""}`;
    chip.style.setProperty("--skin", reward.color);
    chip.title = reward.name;
    chip.addEventListener("click", () => {
      selectedReward = reward;
      updateHud();
    });
    skinStrip.append(chip);
  });
}

function buyOrUseReward(reward) {
  if (!reward.owned) {
    if (coins < reward.price) return;
    coins -= reward.price;
    reward.owned = true;
    showToast(`${reward.name} desbloqueado.`);
  }

  if (reward.type === "Habilidade" && reward.id === "focus") {
    positiveFeedback.textContent = "Ritmo lento ativado. Voce pode fazer cada gesto com mais tempo.";
  }
  selectedReward = reward.type === "Roupa" ? reward : selectedReward;
  updateHud();
}

function drawAvatar() {
  const w = avatarCanvas.width;
  const h = avatarCanvas.height;
  avatarCtx.clearRect(0, 0, w, h);
  avatarCtx.fillStyle = "#141812";
  avatarCtx.fillRect(0, 0, w, h);

  const t = performance.now() / 1000;
  const hitPulse = phase.hitAt ? Math.max(0, 1 - (performance.now() - phase.hitAt) / 420) : 0;
  const level = Math.floor(score / 180) + 1;
  const bounce = Math.sin(t * 3.2) * 3 - hitPulse * 10;
  const skin = selectedReward.color;
  const x = w / 2;
  const y = h * 0.5 + bounce;
  const power = Math.min(18, level * 1.8);

  avatarCtx.fillStyle = "rgba(95, 224, 184, 0.1)";
  avatarCtx.beginPath();
  avatarCtx.ellipse(x, h - 42, 86 + power * 2, 18, 0, 0, Math.PI * 2);
  avatarCtx.fill();

  avatarCtx.lineCap = "round";
  avatarCtx.lineJoin = "round";
  avatarCtx.strokeStyle = skin;
  avatarCtx.lineWidth = 18 + Math.min(6, level);

  line(x, y - 72, x, y + 58);
  line(x - 8, y - 22, x - 78, y + Math.sin(t * 2.4) * 18 - hitPulse * 12);
  line(x + 8, y - 22, x + 78, y + Math.cos(t * 2.4) * 18 - hitPulse * 12);
  line(x - 8, y + 54, x - 60, y + 142);
  line(x + 8, y + 54, x + 60, y + 142);

  avatarCtx.fillStyle = skin;
  avatarCtx.beginPath();
  avatarCtx.arc(x, y - 114, 39 + hitPulse * 4, 0, Math.PI * 2);
  avatarCtx.fill();

  avatarCtx.fillStyle = "#10140f";
  avatarCtx.beginPath();
  avatarCtx.arc(x - 13, y - 120, 4, 0, Math.PI * 2);
  avatarCtx.arc(x + 13, y - 120, 4, 0, Math.PI * 2);
  avatarCtx.fill();

  avatarCtx.strokeStyle = "#fffaf0";
  avatarCtx.lineWidth = 5;
  avatarCtx.beginPath();
  avatarCtx.arc(x, y - 108, 14, 0.15, Math.PI - 0.15);
  avatarCtx.stroke();

  avatarCtx.fillStyle = "#ffd35a";
  avatarCtx.font = "900 22px Inter, sans-serif";
  avatarCtx.textAlign = "center";
  avatarCtx.fillText(`NV ${level}`, x, 34);

  requestAnimationFrame(drawAvatar);
}

function line(x1, y1, x2, y2) {
  avatarCtx.beginPath();
  avatarCtx.moveTo(x1, y1);
  avatarCtx.lineTo(x2, y2);
  avatarCtx.stroke();
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastHost.append(toast);
  setTimeout(() => toast.remove(), 3000);
}

function avg(...values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

startButton.addEventListener("click", () => {
  startCamera().catch((error) => {
    startButton.disabled = false;
    startButton.textContent = "Iniciar camera";
    showToast("Nao consegui acessar a camera. Confira a permissao do navegador.");
    console.error(error);
  });
});

nextButton.addEventListener("click", nextExercise);
audioButton.addEventListener("click", speakCurrentExercise);
window.addEventListener("resize", resizeCanvas);

renderModes();
renderCurrentExercise();
selectMode("inclusive");
updateHud();
drawAvatar();
