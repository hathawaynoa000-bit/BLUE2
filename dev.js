// ================= SETUP =================
const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const ctx = canvasElement.getContext('2d');

canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

let mode = 'idle';
let currentGesture = '';

// ================= PARTICLES =================
const PARTICLE_COUNT = 7000; // dikurangin biar enteng
const particles = [];

class Particle {
  constructor() {
    this.x = Math.random() * canvasElement.width;
    this.y = Math.random() * canvasElement.height;
    this.tx = this.x;
    this.ty = this.y;
    this.z = Math.random();
    this.size = Math.random() * 1 + 0.9;
    this.speed = Math.random() * 0.08 + 0.05;
  }
  update() {
    this.x += (this.tx - this.x) * this.speed;
    this.y += (this.ty - this.y) * this.speed;
  }
  draw() {
    ctx.fillStyle = `rgba(255,120,180,${0.25 + this.z * 0.35})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size + this.z, 0, Math.PI * 2);
    ctx.fill();
  }
}

for (let i = 0; i < PARTICLE_COUNT; i++) {
  particles.push(new Particle());
}

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

  if (t && i && !m && !r && p) return 'love';   // 🤟
  if (i && m && !r && !p) return 'peace';       // ✌️
  if (i && m && r && p) return 'palm';          // ✋
  if (!i && !m && !r && !p) return 'fist';      // ✊
  return '';
}

// ================= IDLE =================
function setIdle() {
  mode = 'idle';
  particles.forEach(p => {
    p.tx = Math.random() * canvasElement.width;
    p.ty = Math.random() * canvasElement.height;
  });
}

// ================= HEART =================
function setHeart() {
  mode = 'heart';
  const cx = canvasElement.width / 2;
  const cy = canvasElement.height / 2.2;

  particles.forEach((p, i) => {
    const t = Math.PI * 2 * i / PARTICLE_COUNT;
    const x = 13 * Math.pow(Math.sin(t), 3);
    const y = -(12 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
    const d = Math.random() * 4;
    p.tx = cx + x * (18 + d);
    p.ty = cy + y * (18 + d);
    p.z = d / 5;
  });
}

// ================= FLOWER =================
function setFlower() {
  mode = 'flower';
  const cx = canvasElement.width / 2;
  const cy = canvasElement.height / 2;
  const base = Date.now() * 0.0003;

  particles.forEach((p, i) => {
    const t = Math.PI * 2 * i / PARTICLE_COUNT + base;
    const petal = Math.sin(5 * t);
    const r = 220;
    p.tx = cx + Math.cos(t) * petal * r;
    p.ty = cy + Math.sin(t) * petal * r;
    p.z = 0.5;
  });
}

// ================= TEXT =================
function setText(text) {
  mode = 'text';
  const temp = document.createElement('canvas');
  const tctx = temp.getContext('2d');
  temp.width = canvasElement.width;
  temp.height = canvasElement.height;

  const fs = Math.min(canvasElement.width / 2.6, 150);
  tctx.fillStyle = '#ffffff';
  tctx.font = `700 ${fs}px Arial`;
  tctx.textAlign = 'center';
  tctx.textBaseline = 'middle';
  tctx.fillText(text, temp.width / 2, temp.height / 2);

  const data = tctx.getImageData(0, 0, temp.width, temp.height).data;
  let idx = 0;

  for (let y = 0; y < temp.height; y += 4) {
    for (let x = 0; x < temp.width; x += 4) {
      const i = (y * temp.width + x) * 4;
      if (data[i + 3] > 120 && particles[idx]) {
        particles[idx].tx = x;
        particles[idx].ty = y;
        idx++;
      }
    }
  }
}

// ================= L SHAPE FRAME =================
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

// ================= RENDER =================
function renderParticles() {
  particles.forEach(p => {
    if (mode === 'idle') {
      p.tx += Math.sin(Date.now() * 0.001 + p.z * 10) * 0.2;
      p.ty += Math.cos(Date.now() * 0.001 + p.z * 10) * 0.2;
    }
    p.update();
    p.draw();
  });
}

// ================= MAIN =================
function getGlobalGesture(landmarks) {
  const gestures = landmarks.map(lm => detectGesture(lm));

  if (gestures.includes('love')) return 'love';
  if (gestures.includes('peace')) return 'peace';
  if (gestures.includes('palm')) return 'palm';
  if (gestures.includes('fist')) return 'fist';

  return '';
}

function onResults(res) {
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // camera
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

    // L shape frame
    if (L && R && isLShape(L, 'Left') && isLShape(R, 'Right')) {
      drawFrame(L, R);
    }

    // draw hand
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvasElement.width, 0);
    res.multiHandLandmarks.forEach(lm => drawHand(lm));
    ctx.restore();

    // 🔥 FIXED GESTURE LOGIC
    const g = getGlobalGesture(res.multiHandLandmarks);

    if (g && g !== currentGesture) {
      currentGesture = g;

      // reset dulu biar bersih
      particles.forEach(p => {
        p.tx = Math.random() * canvasElement.width;
        p.ty = Math.random() * canvasElement.height;
      });

      if (g === 'peace') setHeart();
      if (g === 'palm') setFlower();
      if (g === 'love') setText('LOVE YOU');
      if (g === 'fist') setIdle();
    }
  }

  renderParticles();
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

camera.start();
setIdle();