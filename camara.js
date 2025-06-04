let video;
let hands = [];
let faces = [];
let faceMesh;
let handPose;

let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };

function preload() {
  handPose = ml5.handPose();
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  video.hide();
  handPose.detectStart(video, gotHands);
  faceMesh.detectStart(video, gotFaces);
}

function draw() {
  image(video, 0, 0, width, height);
  filter(GRAY);

  // Dibujar puntos de las manos
  for (let hand of hands) {
    for (let keypoint of hand.keypoints) {
      fill(0, 255, 0);
      noStroke();
      circle(keypoint.x, keypoint.y, 10);
    }
  }

  // Dibujar puntos del rostro
  for (let face of faces) {
    for (let keypoint of face.keypoints) {
      fill(0, 255, 0);
      noStroke();
      circle(keypoint.x, keypoint.y, 5);
    }
  }

  if (mouseX < width / 2 && mouseY < height / 2) {
    drawMenuZen();
  }

  drawGarabatoOverlay();
}

function gotFaces(results) {
  faces = results;
}

function gotHands(results) {
  hands = results;
}

function drawMenuZen() {
  const menuRadius = 14;
  const menuMargin = 18;
  const menuY = 30;
  const menuXStart = 30;
  for (let i = 0; i < 4; i++) {
    let x = menuXStart + i * (menuRadius * 2 + menuMargin);
    let y = menuY;
    fill(i === 3 ? "#f5f5dc" : "#00ff50");
    noStroke();
    ellipse(x, y, menuRadius * 2);
  }
}

function mousePressed() {
  const canvas = document.getElementById('garabato-overlay');
  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radio = 36;
    const mx = mouseX - rect.left;
    const my = mouseY - rect.top;
    const d = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
    if (d < radio + 12) {
      window.location.href = "index.html";
      return;
    }
  }

  if (mouseX < width / 2 && mouseY < height / 2) {
    const menuRadius = 14;
    const menuMargin = 18;
    const menuY = 30;
    const menuXStart = 30;
    for (let i = 0; i < 4; i++) {
      const x = menuXStart + i * (menuRadius * 2 + menuMargin);
      const y = menuY;
      const d = dist(mouseX, mouseY, x, y);
      if (d < menuRadius) {
        if (i === 0) window.location.href = "ojos.html";
        if (i === 1) window.location.href = "huella.html";
        if (i === 2) window.location.href = "qr.html";
        if (i === 3) window.location.href = "pantalla_zen.html";
        return;
      }
    }
  }
}

let garabatoData = null;

function drawGarabatoOverlay() {
  const canvas = document.getElementById('garabato-overlay');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radio = 36;
  const numLineas = 14;
  const puntosPorLinea = 32;

  if (!garabatoData || canvas.width !== garabatoData.w || canvas.height !== garabatoData.h) {
    garabatoData = {
      w: canvas.width,
      h: canvas.height,
      lineas: generaGarabatoEsquinaCaotico(cx, cy, radio, numLineas, puntosPorLinea)
    };
  }

  const rect = canvas.getBoundingClientRect();
  let mx = mouseX - rect.left;
  let my = mouseY - rect.top;
  const d = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
  const hoverRadius = radio + 12;
  let t = constrain(1 - d / hoverRadius, 0, 1);

  const r = lerp(255, 0, t);
  const g = lerp(255, 0, t);
  const b = lerp(255, 0, t);
  const a = lerp(0.18, 0.95, t);

  ctx.save();
  ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
  ctx.lineWidth = 2;

  for (let linea of garabatoData.lineas) {
    ctx.beginPath();
    for (let i = 0; i < linea.length; i++) {
      let [x, y] = linea[i];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function generaGarabatoEsquinaCaotico(cx, cy, radio, numLineas, puntosPorLinea) {
  let lineas = [];
  for (let j = 0; j < numLineas; j++) {
    let linea = [];
    let x = cx + random(-radio * 0.3, radio * 0.3);
    let y = cy + random(-radio * 0.3, radio * 0.3);
    linea.push([x, y]);
    for (let i = 1; i < puntosPorLinea; i++) {
      let ang = random(TWO_PI);
      let paso = random(radio * 0.15, radio * 0.5);
      if (random() < 0.7 && i > 1) {
        let prev = linea[i - 1];
        let prev2 = linea[i - 2];
        let angPrev = atan2(prev[1] - prev2[1], prev[0] - prev2[0]);
        ang = angPrev + random(-PI / 2, PI / 2);
      }
      x += cos(ang) * paso;
      y += sin(ang) * paso;
      x += (cx - x) * 0.07;
      y += (cy - y) * 0.07;
      let dx = x - cx;
      let dy = y - cy;
      let distAlCentro = Math.sqrt(dx * dx + dy * dy);
      if (distAlCentro > radio * 0.98) {
        let factor = (radio * 0.98) / distAlCentro;
        x = cx + dx * factor;
        y = cy + dy * factor;
      }
      linea.push([x, y]);
    }
    lineas.push(linea);
  }
  return lineas;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  drawGarabatoOverlay();
}

window.addEventListener('resize', drawGarabatoOverlay);
setTimeout(drawGarabatoOverlay, 100);
