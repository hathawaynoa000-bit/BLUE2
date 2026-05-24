// ================= SETUP =================
const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const ctx = canvasElement.getContext('2d');

canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

let mode = 'idle';
let currentGesture = '';
let flash = 0;

// ================= FRAME TIMER =================
let frameActive = false;
let frameStartTime = 0;
const FRAME_DURATION = 8000;

// ================= PARTICLES =================
const PARTICLE_COUNT = 8000;
const particles = [];

class Particle {
  constructor() {
    this.x = Math.random() * canvasElement.width;
    this.y = Math.random() * canvasElement.height;
    this.tx = this.x;
    this.ty = this.y;
    this.vx = 0;
    this.vy = 0;
    this.z = Math.random();
    this.size = Math.random() * 1.8 + 1.2;
    this.speed = Math.random() * 0.08 + 0.05;

    this.color =
      Math.random() > 0.33
        ? 'rgba(255,120,200,0.55)'
        : 'rgb(207, 177, 193)';
  }

  update() {
    this.vx += (this.tx - this.x) * 0.002;
    this.vy += (this.ty - this.y) * 0.002;

    this.vx *= 0.92;
    this.vy *= 0.92;

    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size + this.z, 0, Math.PI * 2);
    ctx.fill();
  }
}

for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

// ================= HAND DRAW =================
function drawHand(lm) {
  drawConnectors(ctx, lm, HAND_CONNECTIONS, {
    color: 'rgba(255,255,255,0.6)',
    lineWidth: 1.5
  });
  drawLandmarks(ctx, lm, {
    color: '#ff6fae',
    radius: 2
  });
}

// ================= GESTURE =================
function detectGesture(lm) {
  const t = lm[4].y < lm[2].y;
  const i = lm[8].y < lm[6].y;
  const m = lm[12].y < lm[10].y;
  const r = lm[16].y < lm[14].y;
  const p = lm[20].y < lm[18].y;

  if (t && i && !m && !r && p) return 'love';
  if (i && m && !r && !p) return 'peace';
  if (i && m && r && p) return 'palm';
  if (!i && !m && !r && !p) return 'fist';
  return '';
}

function getGlobalGesture(landmarks) {
  const g = landmarks.map(lm => detectGesture(lm));
  if (g.includes('love')) return 'love';
  if (g.includes('peace')) return 'peace';
  if (g.includes('palm')) return 'palm';
  if (g.includes('fist')) return 'fist';
  return '';
}

// ================= MODES =================
function setIdle() {
  mode = 'idle';

  particles.forEach(p => {
    p.tx = Math.random() * canvasElement.width;
    p.ty = Math.random() * canvasElement.height;

    const a = Math.random() * Math.PI * 2;
    const f = Math.random() * 6 + 2;
    p.vx += Math.cos(a) * f;
    p.vy += Math.sin(a) * f;
  });
}

function setHeart() {
  mode = 'heart';

  const cx = canvasElement.width / 2;
  const cy = canvasElement.height / 2.2;

  particles.forEach((p, i) => {

    const t = Math.PI * 2 * i / PARTICLE_COUNT;

    const x =
      13 * Math.pow(Math.sin(t), 3);

    const y =
      -(12 * Math.cos(t)
      - 5 * Math.cos(2 * t)
      - 2 * Math.cos(3 * t)
      - Math.cos(4 * t));

    // thickness
    const spread = Math.random() * 28;

    p.tx =
      cx + x * (18 + Math.random() * 3)
      + (Math.random() - 0.5) * spread;

    p.ty =
      cy + y * (18 + Math.random() * 3)
      + (Math.random() - 0.5) * spread;

    p.vx = 0;
    p.vy = 0;
  });
}

function setFlower() {
  mode = 'flower';

  const cx = canvasElement.width / 2;
  const cy = canvasElement.height / 2;

  particles.forEach((p, i) => {

    const t =
      Math.PI * 2 * i / PARTICLE_COUNT;

    const petal =
      Math.sin(5 * t);

    const r = 220;

    // thickness
    const spread = Math.random() * 28;

    p.tx =
      cx +
      Math.cos(t) * petal * r +
      (Math.random() - 0.5) * spread;

    p.ty =
      cy +
      Math.sin(t) * petal * r +
      (Math.random() - 0.5) * spread;

    p.vx = 0;
    p.vy = 0;
  });
}

function setText(text) {
  mode = 'text';

  const temp = document.createElement('canvas');
  const tctx = temp.getContext('2d');
  temp.width = canvasElement.width;
  temp.height = canvasElement.height;

  const fs = Math.min(canvasElement.width / 2.6, 150);
  tctx.fillStyle = '#fff';
  tctx.font = `700 ${fs}px Arial`;
  tctx.textAlign = 'center';
  tctx.textBaseline = 'middle';
  tctx.fillText(text, temp.width / 2, temp.height / 2);

  const data = tctx.getImageData(0, 0, temp.width, temp.height).data;
  const points = [];

  for (let y = 0; y < temp.height; y += 4) {
    for (let x = 0; x < temp.width; x += 4) {
      const i = (y * temp.width + x) * 4;
      if (data[i + 3] > 120) {
        points.push({ x, y });
      }
    }
  }

  particles.forEach((p, i) => {
    const point = points[i % points.length];

    p.tx = point.x + (Math.random() - 0.5) * 2;
    p.ty = point.y + (Math.random() - 0.5) * 2;

    p.vx = 0;
    p.vy = 0;
  });
}

// ================= L SHAPE =================
function isLShape(lm, side) {
  const indexUp = lm[8].y < lm[6].y;
  const thumbOut = side === 'Left'
    ? lm[4].x > lm[3].x
    : lm[4].x < lm[3].x;
  return indexUp && thumbOut;
}

function pt(p) {
  return {
    x: (1 - p.x) * canvasElement.width,
    y: p.y * canvasElement.height
  };
}

function drawFrame(l, r) {
  const a = pt(l[8]);
  const b = pt(r[8]);
  const c = pt(r[4]);
  const d = pt(l[4]);

  ctx.strokeStyle = '#ff6fae';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.stroke();
}

// ================= TIMER =================
function drawTimer(progress) {
  const cx = canvasElement.width / 2;
  const cy = 70;
  const r = 26;

  ctx.strokeStyle = '#ff6fae';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();

  ctx.fillStyle = '#ff6fae';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.ceil((1 - progress) * 5)}`, cx, cy + 6);
}

// ================= CAPTURE =================
function captureWithEffect() {
  

  // tunggu flash render dulu
  setTimeout(() => {

    // capture pas frame masih utuh
    const link = document.createElement('a');
    link.download = `capture_${Date.now()}.png`;
    link.href = canvasElement.toDataURL('image/png');
    link.click();

    // delay sebelum buyar
    setTimeout(() => {
      setIdle();
    }, 1000);

  }, 150);
}

// ================= RENDER =================
function renderParticles() {
  const t = Date.now() * 0.001;

  for (const p of particles) {

    // idle floating movement
    if (mode === 'idle') {
  p.tx += Math.sin(t + p.z * 8) * 0.5;
  p.ty += Math.cos(t + p.z * 8) * 0.5;

  p.x += Math.sin(t + p.z * 5) * 0.05;
  p.y += Math.cos(t + p.z * 5) * 0.05;
}

    p.update();
    p.draw();
  }
}

// ================= MAIN =================
function onResults(res) {
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(res.image, -canvasElement.width, 0, canvasElement.width, canvasElement.height);
  ctx.restore();

  let L = null, R = null;

  if (res.multiHandLandmarks) {
    res.multiHandLandmarks.forEach((lm, i) => {
      const side = res.multiHandedness[i].label;
      if (side === 'Left') L = lm;
      if (side === 'Right') R = lm;
    });

    const now = Date.now();

    if (!frameActive && L && R && isLShape(L, 'Left') && isLShape(R, 'Right')) {
      frameActive = true;
      frameStartTime = now;
    }

    if (L && R && isLShape(L, 'Left') && isLShape(R, 'Right')) {
      drawFrame(L, R);
    }

    if (frameActive) {
      const elapsed = now - frameStartTime;
      const progress = Math.min(elapsed / FRAME_DURATION, 1);
      drawTimer(progress);

      if (elapsed >= FRAME_DURATION) {
        frameActive = false;
        captureWithEffect();
      }
    }

    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvasElement.width, 0);
    res.multiHandLandmarks.forEach(drawHand);
    ctx.restore();

    const g = getGlobalGesture(res.multiHandLandmarks);
    if (g && g !== currentGesture) {
      currentGesture = g;
      if (g === 'peace') setHeart();
      if (g === 'palm') setFlower();
      if (g === 'love') setText('LOVE YOU');
      if (g === 'fist') setIdle();
    }
  }

  renderParticles();

  if (flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flash})`;
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    flash -= 0.08;
  }
}

// ================= MEDIAPIPE =================
const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => await hands.send({ image: videoElement }),
  width: 1280,
  height: 720
});

camera.start().catch(err => {
  alert('Camera error: ' + err.message);
  console.error(err);
});
setIdle();
