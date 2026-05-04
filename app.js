const homeScreen = document.querySelector("#homeScreen");
const gameScreen = document.querySelector("#gameScreen");
const joinForm = document.querySelector("#joinForm");
const createRoomButton = document.querySelector("#createRoomButton");
const playerNameInput = document.querySelector("#playerName");
const roomCodeInput = document.querySelector("#roomCodeInput");
const connectionNote = document.querySelector("#connectionNote");
const homeModeTabs = document.querySelector("#homeModeTabs");
const roomLabel = document.querySelector("#roomLabel");
const playerLabel = document.querySelector("#playerLabel");
const modeLabel = document.querySelector("#modeLabel");
const backHomeButton = document.querySelector("#backHomeButton");
const copyRoomButton = document.querySelector("#copyRoomButton");
const video = document.querySelector("#camera");
const poseCanvas = document.querySelector("#poseCanvas");
const poseCtx = poseCanvas.getContext("2d");
const avatarCanvas = document.querySelector("#avatarCanvas");
const avatarCtx = avatarCanvas.getContext("2d");
const homeAvatarCanvas = document.querySelector("#homeAvatarCanvas");
const homeAvatarCtx = homeAvatarCanvas.getContext("2d");
const startButton = document.querySelector("#startButton");
const nextButton = document.querySelector("#nextButton");
const audioButton = document.querySelector("#audioButton");
const calibrateButton = document.querySelector("#calibrateButton");
const exerciseName = document.querySelector("#exerciseName");
const exerciseHint = document.querySelector("#exerciseHint");
const movementIcon = document.querySelector("#movementIcon");
const guideMovementIcon = document.querySelector("#guideMovementIcon");
const guideExerciseName = document.querySelector("#guideExerciseName");
const guideExerciseHint = document.querySelector("#guideExerciseHint");
const guideScore = document.querySelector("#guideScore");
const guideCoins = document.querySelector("#guideCoins");
const guideReps = document.querySelector("#guideReps");
const guideConfidence = document.querySelector("#guideConfidence");
const movementSequence = document.querySelector("#movementSequence");
const lastAward = document.querySelector("#lastAward");
const scoreEl = document.querySelector("#score");
const coinsEl = document.querySelector("#coins");
const confidenceScoreEl = document.querySelector("#accuracy");
const repsEl = document.querySelector("#reps");
const timerText = document.querySelector("#timerText");
const timerRing = document.querySelector("#timerRing");
const sensorStatus = document.querySelector("#sensorStatus");
const confidenceText = document.querySelector("#confidenceText");
const confidenceFill = document.querySelector("#confidenceFill");
const positiveFeedback = document.querySelector("#positiveFeedback");
const modeDescription = document.querySelector("#modeDescription");
const avatarLevel = document.querySelector("#avatarLevel");
const weeklyRank = document.querySelector("#weeklyRank");
const levelFill = document.querySelector("#levelFill");
const shopList = document.querySelector("#shopList");
const skinStrip = document.querySelector("#skinStrip");
const rankingList = document.querySelector("#rankingList");
const onlineState = document.querySelector("#onlineState");
const toastHost = document.querySelector("#toastHost");

const ROUND_SECONDS = 60;
const COOLDOWN_MS = 900;
const CALIBRATION_MS = 2400;
const ringLength = 2 * Math.PI * 52;
const API_BASE = "";

const modes = [
  {
    id: "run",
    name: "Corrida virtual",
    description: "Marcha e corrida no lugar com ranking por sala.",
    exercises: ["march", "jump", "arms"],
    scoreMultiplier: 1.2,
  },
  {
    id: "dance",
    name: "Jogo de dança",
    description: "Ritmo lateral, braços e polichinelo adaptado.",
    exercises: ["dance", "arms", "jack"],
    scoreMultiplier: 1.3,
  },
  {
    id: "friends",
    name: "Desafios",
    description: "Rodadas curtas entre colegas com ranking ao vivo.",
    exercises: ["squat", "march", "dance"],
    scoreMultiplier: 1.35,
  },
  {
    id: "inclusive",
    name: "Adaptado",
    description: "Ritmo lento, instruções simples e movimentos de baixo impacto.",
    exercises: ["march", "arms", "dance"],
    scoreMultiplier: 1,
  },
];

const exerciseLibrary = {
  march: {
    icon: "1",
    name: "Marcha leve",
    hint: "Levante um joelho por vez. Conta apenas quando os joelhos alternam.",
    spoken: "Marcha leve. Levante um joelho por vez. Faça devagar.",
    detect: detectMarch,
  },
  jump: {
    icon: "2",
    name: "Pulo pequeno",
    hint: "Pule baixo. O quadril e os ombros precisam subir juntos.",
    spoken: "Pulo pequeno. Pule baixo. O corpo precisa subir junto.",
    detect: detectJump,
  },
  jack: {
    icon: "3",
    name: "Polichinelo adaptado",
    hint: "Abra os braços acima dos ombros. No modo dança, abrir as pernas melhora a pontuação.",
    spoken: "Polichinelo adaptado. Abra os braços acima dos ombros.",
    detect: detectJumpingJack,
  },
  squat: {
    icon: "4",
    name: "Agachamento simples",
    hint: "Baixe o quadril e volte. Conta quando o corpo realmente desce.",
    spoken: "Agachamento simples. Baixe o quadril e volte com calma.",
    detect: detectSquat,
  },
  dance: {
    icon: "5",
    name: "Dança lateral",
    hint: "Leve o tronco para um lado e depois para o outro.",
    spoken: "Dança lateral. Balance para um lado e depois para o outro.",
    detect: detectDance,
  },
  arms: {
    icon: "6",
    name: "Braços para cima",
    hint: "Levante as duas mãos acima da cabeça e depois abaixe.",
    spoken: "Braços para cima. Levante as duas mãos acima da cabeça.",
    detect: detectArmsUp,
  },
};

const rewards = [
  { id: "starter", type: "Roupa", name: "Treino", color: "#5fe0b8", price: 0, owned: true },
  { id: "sun", type: "Roupa", name: "Solar", color: "#ffd35a", price: 40, owned: false },
  { id: "beat", type: "Roupa", name: "Dança", color: "#ff7d73", price: 70, owned: false },
  { id: "focus", type: "Habilidade", name: "Ritmo lento", color: "#8eb6ff", price: 95, owned: false },
  { id: "star", type: "Roupa", name: "Campeao", color: "#d9a7ff", price: 160, owned: false },
];

let pose;
let camera;
let selectedMode = modes[3];
let currentExerciseIndex = 0;
let score = 0;
let coins = 0;
let reps = 0;
let lastRepAt = 0;
let roundStartedAt = 0;
let history = [];
let gameRunning = false;
let selectedReward = rewards[0];
let phase = {};
let baseline = null;
let calibration = { active: false, startedAt: 0, samples: [] };
let lastPoseQuality = { valid: false, confidence: 0, reason: "Aguardando câmera" };
let portugueseVoice = null;
let players = [];
let session = {
  playerId: "",
  playerName: "",
  roomCode: "",
  online: false,
  eventSource: null,
};
let syncTimer = 0;

timerRing.style.strokeDasharray = `${ringLength}`;
timerRing.style.strokeDashoffset = "0";
loadPortugueseVoice();
if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener("voiceschanged", loadPortugueseVoice);
}

function loadPortugueseVoice() {
  if (!("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  portugueseVoice =
    voices.find((voice) => voice.lang.toLowerCase() === "pt-br") ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("pt")) ||
    null;
}

function renderModeTabs() {
  homeModeTabs.innerHTML = "";
  modes.forEach((mode) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mode-tab${mode.id === selectedMode.id ? " active" : ""}`;
    button.innerHTML = `<strong>${mode.name}</strong><br><span>${mode.description}</span>`;
    button.addEventListener("click", () => {
      selectedMode = mode;
      renderModeTabs();
      renderCurrentExercise();
    });
    homeModeTabs.append(button);
  });
}

async function enterGame(createNewRoom) {
  const playerName = cleanName(playerNameInput.value);
  if (!playerName) {
    showToast("Digite seu nome para entrar.");
    playerNameInput.focus();
    return;
  }

  const requestedRoom = createNewRoom ? "" : cleanRoom(roomCodeInput.value);
  session.playerName = playerName;
  session.roomCode = requestedRoom || createRoomCode();
  session.playerId = getOrCreatePlayerId();

  await joinOnlineRoom(requestedRoom, playerName);
  showGameScreen();
  syncScoreNow();
}

async function joinOnlineRoom(requestedRoom, playerName) {
  try {
    const response = await fetch(`${API_BASE}/api/room/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomCode: requestedRoom,
        playerId: session.playerId,
        name: playerName,
        mode: selectedMode.name,
      }),
    });
    if (!response.ok) throw new Error("room join failed");
    const data = await response.json();
    session.roomCode = data.roomCode;
    session.playerId = data.playerId;
    session.online = true;
    players = data.players || [];
    connectRoomEvents();
  } catch (_error) {
    session.online = false;
    players = [{ id: session.playerId, name: playerName, score: 0, reps: 0, mode: selectedMode.name }];
    connectionNote.textContent = "Sem backend online nesta origem. O ranking fica local até publicar no Render.";
  }
}

function showGameScreen() {
  homeScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  roomLabel.textContent = session.roomCode;
  playerLabel.textContent = session.playerName;
  modeLabel.textContent = selectedMode.name;
  onlineState.textContent = session.online ? "online" : "local";
  onlineState.classList.toggle("online", session.online);
  currentExerciseIndex = 0;
  roundStartedAt = performance.now();
  renderCurrentExercise();
  updateHud();
  resizeCanvas();
}

function connectRoomEvents() {
  if (session.eventSource) session.eventSource.close();
  session.eventSource = new EventSource(`${API_BASE}/api/room/${session.roomCode}/events?playerId=${session.playerId}`);
  session.eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    players = data.players || [];
    renderRanking();
  };
  session.eventSource.onerror = () => {
    onlineState.textContent = "reconectando";
    onlineState.classList.remove("online");
  };
}

function syncScoreSoon() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncScoreNow, 450);
}

async function syncScoreNow() {
  const ownPlayer = {
    id: session.playerId,
    name: session.playerName || "Você",
    score,
    reps,
    mode: selectedMode.name,
  };

  players = upsertPlayer(players, ownPlayer);
  renderRanking();

  if (!session.online) return;
  try {
    await fetch(`${API_BASE}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomCode: session.roomCode,
        playerId: session.playerId,
        name: session.playerName,
        score,
        reps,
        mode: selectedMode.name,
      }),
    });
  } catch (_error) {
    session.online = false;
    onlineState.textContent = "local";
    onlineState.classList.remove("online");
  }
}

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
    minDetectionConfidence: 0.72,
    minTrackingConfidence: 0.72,
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
    width: 1280,
    height: 720,
  });

  await camera.start();
  startCalibration();
  startButton.textContent = "Câmera ligada";
  startButton.disabled = false;
  speakCurrentExercise();
}

function startCalibration() {
  calibration = { active: true, startedAt: performance.now(), samples: [] };
  baseline = null;
  gameRunning = false;
  sensorStatus.textContent = "Calibrando: fique parado, de corpo inteiro, por alguns segundos.";
  positiveFeedback.textContent = "Calibrando. Não vou contar pontos ainda.";
  lastAward.textContent = "Calibrando: fique parado e apareça de corpo inteiro.";
}

function onPoseResults(results) {
  resizeCanvas();
  const width = poseCanvas.clientWidth;
  const height = poseCanvas.clientHeight;
  poseCtx.save();
  poseCtx.clearRect(0, 0, width, height);
  poseCtx.drawImage(results.image, 0, 0, width, height);

  if (results.poseLandmarks) {
    const quality = analyzePose(results.poseLandmarks);
    lastPoseQuality = quality;
    drawPose(results.poseLandmarks, quality);
    updateSensorPanel(quality);

    if (quality.valid) {
      const features = makeFeatures(results.poseLandmarks, quality);
      pushHistory(features);
      handleCalibration(features);
      if (gameRunning && baseline) evaluateMove(features, quality);
    }
  } else {
    lastPoseQuality = { valid: false, confidence: 0, reason: "Nenhum corpo detectado." };
    updateSensorPanel(lastPoseQuality);
  }

  poseCtx.restore();
}

function analyzePose(landmarks) {
  const required = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  const visibleCount = required.filter((index) => isVisible(landmarks[index])).length;
  const confidence = Math.round((visibleCount / required.length) * 100);
  const shoulders = distance(landmarks[11], landmarks[12]);
  const hips = distance(landmarks[23], landmarks[24]);
  const torso = distance(midpoint(landmarks[11], landmarks[12]), midpoint(landmarks[23], landmarks[24]));
  const bodyInFrame = required.every((index) => {
    const point = landmarks[index];
    return point.x > 0.02 && point.x < 0.98 && point.y > 0.02 && point.y < 0.99;
  });

  if (confidence < 92) return { valid: false, confidence, reason: "Mostre cabeça, braços, quadril, joelhos e pés." };
  if (!bodyInFrame) return { valid: false, confidence, reason: "Afaste a câmera: parte do corpo saiu da tela." };
  if (shoulders < 0.07 || hips < 0.05 || torso < 0.12) return { valid: false, confidence, reason: "Corpo muito longe ou pose instável." };
  return { valid: true, confidence, reason: "Corpo inteiro reconhecido.", shoulders, hips, torso };
}

function makeFeatures(landmarks, quality) {
  const shoulder = midpoint(landmarks[11], landmarks[12]);
  const hip = midpoint(landmarks[23], landmarks[24]);
  const knee = midpoint(landmarks[25], landmarks[26]);
  const ankle = midpoint(landmarks[27], landmarks[28]);
  const legLength = avg(
    distance(landmarks[23], landmarks[25]) + distance(landmarks[25], landmarks[27]),
    distance(landmarks[24], landmarks[26]) + distance(landmarks[26], landmarks[28]),
  );
  return {
    t: performance.now(),
    landmarks,
    confidence: quality.confidence,
    shoulderX: shoulder.x,
    shoulderY: shoulder.y,
    hipX: hip.x,
    hipY: hip.y,
    kneeY: knee.y,
    ankleY: ankle.y,
    centerX: avg(shoulder.x, hip.x),
    leftKneeY: landmarks[25].y,
    rightKneeY: landmarks[26].y,
    leftWristY: landmarks[15].y,
    rightWristY: landmarks[16].y,
    leftWristX: landmarks[15].x,
    rightWristX: landmarks[16].x,
    leftAnkleX: landmarks[27].x,
    rightAnkleX: landmarks[28].x,
    noseY: landmarks[0].y,
    shoulderWidth: quality.shoulders,
    torsoLength: quality.torso,
    legLength,
    ankleSpread: Math.abs(landmarks[27].x - landmarks[28].x),
  };
}

function handleCalibration(features) {
  if (!calibration.active) return;
  calibration.samples.push(features);
  const elapsed = performance.now() - calibration.startedAt;
  const percent = Math.min(100, Math.round((elapsed / CALIBRATION_MS) * 100));
  sensorStatus.textContent = `Calibrando corpo: ${percent}%`;

  if (elapsed < CALIBRATION_MS || calibration.samples.length < 24) return;

  baseline = averageFeatures(calibration.samples);
  calibration.active = false;
  gameRunning = true;
  roundStartedAt = performance.now();
  history = [];
  phase = {};
  sensorStatus.textContent = "Calibrado. Agora os pontos contam apenas com movimento confirmado.";
  positiveFeedback.textContent = "Pronto. Movimento real vale ponto; pose fraca não vale.";
  lastAward.textContent = `Agora faça: ${currentExercise().name}.`;
  showToast("Calibração concluída. Pode jogar.");
}

function averageFeatures(samples) {
  const fields = [
    "shoulderY",
    "hipY",
    "kneeY",
    "ankleY",
    "centerX",
    "leftKneeY",
    "rightKneeY",
    "leftWristY",
    "rightWristY",
    "shoulderWidth",
    "torsoLength",
    "legLength",
    "ankleSpread",
  ];
  const result = {};
  fields.forEach((field) => {
    result[field] = avg(...samples.map((sample) => sample[field]));
  });
  return result;
}

function pushHistory(features) {
  history.push(features);
  history = history.filter((item) => features.t - item.t < 1800);
}

function evaluateMove(features, quality) {
  updateTimer(features.t);
  if (features.t - lastRepAt < COOLDOWN_MS) return;

  const movementQuality = currentExercise().detect(features, history);
  if (movementQuality > 0) {
    lastRepAt = features.t;
    reps += 1;
    const verifiedQuality = clamp(movementQuality * (quality.confidence / 100), 0.1, 1);
    const gained = Math.round((10 + verifiedQuality * 16) * selectedMode.scoreMultiplier);
    score += gained;
    coins += Math.max(2, Math.ceil(gained / 5));
    phase = { ...phase, hitAt: features.t };
    positiveFeedback.textContent = `Movimento confirmado com ${Math.round(verifiedQuality * 100)}% de confiança.`;
    lastAward.textContent = `+${gained} pontos: ${currentExercise().name} confirmado.`;
    updateHud();
    syncScoreSoon();
    showToast(`+${gained} pontos para ${session.playerName || "você"}.`);
  }
}

function updateTimer(now) {
  const elapsed = (now - roundStartedAt) / 1000;
  const left = Math.max(0, ROUND_SECONDS - elapsed);
  timerText.textContent = Math.ceil(left);
  timerRing.style.strokeDashoffset = `${ringLength * (1 - left / ROUND_SECONDS)}`;
  if (left <= 0) nextExercise();
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
  history = [];
  renderCurrentExercise();
  speakCurrentExercise();
  lastAward.textContent = `Agora faça: ${currentExercise().name}.`;
}

function renderCurrentExercise() {
  const exercise = currentExercise();
  movementIcon.textContent = exercise.icon;
  exerciseName.textContent = exercise.name;
  exerciseHint.textContent = exercise.hint;
  guideMovementIcon.textContent = exercise.icon;
  guideExerciseName.textContent = exercise.name;
  guideExerciseHint.textContent = exercise.hint;
  modeDescription.textContent = selectedMode.description;
  renderMovementSequence();
}

function speakCurrentExercise() {
  const synth = window.speechSynthesis;
  if (!synth) {
    showToast("Áudio indisponível neste navegador.");
    return;
  }
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(currentExercise().spoken);
  utterance.lang = "pt-BR";
  if (portugueseVoice) utterance.voice = portugueseVoice;
  utterance.rate = selectedMode.id === "inclusive" ? 0.82 : 0.95;
  synth.speak(utterance);
}

function detectMarch(features) {
  const kneeDelta = Math.abs(features.leftKneeY - features.rightKneeY);
  const side = features.leftKneeY < features.rightKneeY ? "left" : "right";
  const threshold = baseline.legLength * 0.085;
  if (kneeDelta > threshold && phase.marchSide !== side) {
    phase.marchSide = side;
    return clamp(kneeDelta / (baseline.legLength * 0.18), 0.45, 1);
  }
  return 0;
}

function detectJump(features, frames) {
  const hipLift = baseline.hipY - features.hipY;
  const shoulderLift = baseline.shoulderY - features.shoulderY;
  const threshold = baseline.legLength * 0.07;
  const upTogether = hipLift > threshold && shoulderLift > baseline.torsoLength * 0.05;
  if (upTogether && !phase.jumpUp) {
    phase.jumpUp = true;
    return clamp((hipLift + shoulderLift) / (baseline.legLength * 0.24), 0.5, 1);
  }
  const returned = frames.length > 4 && features.hipY > baseline.hipY - baseline.legLength * 0.025;
  if (returned) phase.jumpUp = false;
  return 0;
}

function detectJumpingJack(features) {
  const handsHigh = features.leftWristY < features.shoulderY && features.rightWristY < features.shoulderY;
  const handsWide = Math.abs(features.leftWristX - features.rightWristX) > baseline.shoulderWidth * 1.65;
  const legsOpen = features.ankleSpread > baseline.ankleSpread + baseline.shoulderWidth * 0.38;
  const open = handsHigh && handsWide;
  if (open && !phase.jackOpen) {
    phase.jackOpen = true;
    return legsOpen ? 1 : 0.68;
  }
  if (!open) phase.jackOpen = false;
  return 0;
}

function detectSquat(features) {
  const hipDrop = features.hipY - baseline.hipY;
  const shoulderDrop = features.shoulderY - baseline.shoulderY;
  const down = hipDrop > baseline.legLength * 0.09 && shoulderDrop > baseline.torsoLength * 0.035;
  if (down && !phase.squatDown) {
    phase.squatDown = true;
    return clamp(hipDrop / (baseline.legLength * 0.18), 0.55, 1);
  }
  if (features.hipY < baseline.hipY + baseline.legLength * 0.035) phase.squatDown = false;
  return 0;
}

function detectDance(features) {
  const shift = features.centerX - baseline.centerX;
  const side = shift > 0 ? "right" : "left";
  const amount = Math.abs(shift);
  const threshold = baseline.shoulderWidth * 0.28;
  if (amount > threshold && phase.danceSide && phase.danceSide !== side) {
    phase.danceSide = side;
    return clamp(amount / (baseline.shoulderWidth * 0.55), 0.5, 1);
  }
  if (amount > threshold) phase.danceSide = side;
  return 0;
}

function detectArmsUp(features) {
  const bothUp = features.leftWristY < features.noseY && features.rightWristY < features.noseY;
  if (bothUp && !phase.armsUp) {
    phase.armsUp = true;
    return 1;
  }
  if (features.leftWristY > features.shoulderY && features.rightWristY > features.shoulderY) {
    phase.armsUp = false;
  }
  return 0;
}

function updateSensorPanel(quality) {
  confidenceText.textContent = `${quality.confidence}%`;
  confidenceFill.style.width = `${quality.confidence}%`;
  confidenceScoreEl.textContent = `${quality.confidence}%`;
  guideConfidence.textContent = `${quality.confidence}%`;
  if (!calibration.active) sensorStatus.textContent = quality.reason;
}

function updateHud() {
  const level = Math.floor(score / 200) + 1;
  const levelProgress = Math.min(100, Math.round(((score % 200) / 200) * 100));
  scoreEl.textContent = score;
  coinsEl.textContent = coins;
  repsEl.textContent = reps;
  guideScore.textContent = score;
  guideCoins.textContent = coins;
  guideReps.textContent = reps;
  avatarLevel.textContent = `Nivel ${level} - ${levelTitle(level)}`;
  levelFill.style.width = `${levelProgress}%`;
  renderRanking();
  renderShop();
  renderSkins();
}

function renderMovementSequence() {
  movementSequence.innerHTML = "";
  selectedMode.exercises.forEach((exerciseId, index) => {
    const exercise = exerciseLibrary[exerciseId];
    const item = document.createElement("div");
    item.className = `sequence-chip${index === currentExerciseIndex % selectedMode.exercises.length ? " active" : ""}`;
    item.innerHTML = `<span>${exercise.icon}</span>${escapeHtml(exercise.name)}`;
    movementSequence.append(item);
  });
}

function renderRanking() {
  const ranking = [...players].sort((a, b) => b.score - a.score);
  const ownIndex = ranking.findIndex((player) => player.id === session.playerId);
  weeklyRank.textContent = ownIndex >= 0 ? `Sala: ${ownIndex + 1}o` : "Sala: --";
  rankingList.innerHTML = "";

  if (!ranking.length) {
    rankingList.innerHTML = "<li><div class=\"ranking-pos\">1</div><div><strong>Aguardando</strong><span>Entre em uma sala</span></div><strong>0</strong></li>";
    return;
  }

  ranking.slice(0, 8).forEach((player, index) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <div class="ranking-pos">${index + 1}</div>
      <div><strong>${escapeHtml(player.name)}</strong><span>${escapeHtml(player.mode || "Jogando")}</span></div>
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
  if (reward.type === "Roupa") selectedReward = reward;
  if (reward.id === "focus") positiveFeedback.textContent = "Ritmo lento ativado.";
  updateHud();
}

function drawPose(landmarks, quality) {
  const color = quality.valid ? "#5fe0b8" : "#ff7d73";
  drawConnectors(poseCtx, landmarks, POSE_CONNECTIONS, { color, lineWidth: quality.valid ? 4 : 2 });
  drawLandmarks(poseCtx, landmarks, { color: "#ffd35a", lineWidth: 2, radius: quality.valid ? 3 : 2 });
}

function drawAvatarLoop() {
  drawHumanAvatar(avatarCtx, avatarCanvas, selectedReward.color, score, phase.hitAt || 0);
  drawHumanAvatar(homeAvatarCtx, homeAvatarCanvas, "#5fe0b8", 280, 0);
  requestAnimationFrame(drawAvatarLoop);
}

function drawHumanAvatar(ctx, canvas, outfitColor, avatarScore, hitAt) {
  const w = canvas.width;
  const h = canvas.height;
  const t = performance.now() / 1000;
  const pulse = hitAt ? Math.max(0, 1 - (performance.now() - hitAt) / 420) : 0;
  const level = Math.floor(avatarScore / 200) + 1;
  const x = w / 2;
  const y = h * 0.5 + Math.sin(t * 2.6) * 3 - pulse * 8;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#141912";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(95, 224, 184, 0.1)";
  ctx.beginPath();
  ctx.ellipse(x, h - 38, 110, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  const skin = "#d7a77c";
  const shade = "#b98562";
  const pants = "#26344f";
  const shoe = "#10140f";

  capsule(ctx, x - 42, y + 56, x - 62, y + 150, 28, pants);
  capsule(ctx, x + 42, y + 56, x + 62, y + 150, 28, pants);
  capsule(ctx, x - 62, y + 150, x - 76, y + 194, 24, skin);
  capsule(ctx, x + 62, y + 150, x + 76, y + 194, 24, skin);
  capsule(ctx, x - 78, y + 198, x - 42, y + 200, 18, shoe);
  capsule(ctx, x + 42, y + 200, x + 78, y + 198, 18, shoe);

  ctx.fillStyle = outfitColor;
  ctx.beginPath();
  ctx.moveTo(x - 74, y - 54);
  ctx.quadraticCurveTo(x - 42, y - 82, x, y - 74);
  ctx.quadraticCurveTo(x + 42, y - 82, x + 74, y - 54);
  ctx.lineTo(x + 50, y + 64);
  ctx.quadraticCurveTo(x, y + 88, x - 50, y + 64);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.ellipse(x, y - 8, 26 + level, 54, 0, 0, Math.PI * 2);
  ctx.fill();

  capsule(ctx, x - 78, y - 46, x - 118, y + 32 - pulse * 28, 24, skin);
  capsule(ctx, x + 78, y - 46, x + 118, y + 32 - pulse * 28, 24, skin);
  capsule(ctx, x - 118, y + 32 - pulse * 28, x - 122, y + 92 - pulse * 32, 22, shade);
  capsule(ctx, x + 118, y + 32 - pulse * 28, x + 122, y + 92 - pulse * 32, 22, shade);

  ctx.fillStyle = skin;
  roundedRect(ctx, x - 22, y - 104, 44, 42, 18);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 128, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2d2018";
  ctx.beginPath();
  ctx.ellipse(x, y - 150, 46, 24, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#151914";
  ctx.beginPath();
  ctx.arc(x - 14, y - 132, 4, 0, Math.PI * 2);
  ctx.arc(x + 14, y - 132, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#fffaf0";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x, y - 118, 14, 0.16, Math.PI - 0.16);
  ctx.stroke();

  ctx.fillStyle = "#ffd35a";
  ctx.font = "900 22px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`NV ${level}`, x, 34);
}

function capsule(ctx, x1, y1, x2, y2, width, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function isVisible(point) {
  return point && (point.visibility === undefined || point.visibility >= 0.68);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function avg(...values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cleanName(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, 24);
}

function cleanRoom(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function createRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getOrCreatePlayerId() {
  const stored = localStorage.getItem("moveQuestPlayerId");
  if (stored) return stored;
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  localStorage.setItem("moveQuestPlayerId", id);
  return id;
}

function upsertPlayer(list, player) {
  const map = new Map(list.map((item) => [item.id, item]));
  map.set(player.id, { ...(map.get(player.id) || {}), ...player });
  return [...map.values()];
}

function levelTitle(level) {
  if (level >= 8) return "Campeao ativo";
  if (level >= 5) return "Explorador em movimento";
  if (level >= 3) return "Corpo acordado";
  return "Comecando";
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastHost.append(toast);
  setTimeout(() => toast.remove(), 3200);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  })[char]);
}

joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  enterGame(false);
});

createRoomButton.addEventListener("click", () => enterGame(true));
startButton.addEventListener("click", () => {
  startCamera().catch((error) => {
    startButton.disabled = false;
    startButton.textContent = "Iniciar câmera";
    showToast("Não consegui acessar a câmera. Confira a permissão do navegador.");
    console.error(error);
  });
});
nextButton.addEventListener("click", nextExercise);
audioButton.addEventListener("click", speakCurrentExercise);
calibrateButton.addEventListener("click", startCalibration);
backHomeButton.addEventListener("click", () => {
  gameScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
});
copyRoomButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(session.roomCode);
    showToast("Código da sala copiado.");
  } catch (_error) {
    showToast(`Sala: ${session.roomCode}`);
  }
});
window.addEventListener("resize", resizeCanvas);

renderModeTabs();
renderCurrentExercise();
updateHud();
drawAvatarLoop();
