// --- VARIABLES ORIGINALES ---
let radiusScale = 1;
let growing = true;
let minScale = 1;
let maxScale = 1.8;
let breathingSpeed = 0.008;

let particles = [];
let numParticles = 50;

let bgImg;
let ambientSound;
let garabatoData = null;

function preload() {
  soundFormats('mp3', 'ogg');
  bgImg = loadImage('img/fondoburbuja.jpg');
  ambientSound = loadSound('sonido/meditacion1.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      pos: createVector(random(-width / 2, width / 2), random(-height / 2, height / 2)),
      vel: createVector(random(-0.5, 0.5), random(-0.5, 0.5))
    });
  }
}

function draw() {
  background(255);

  // Fondo con textura que cubre toda la pantalla
push();
resetMatrix(); // Salimos de WEBGL para posicionar correctamente
texture(bgImg);
plane(width, height);
pop();


  // Luces suaves
  ambientLight(150);
  directionalLight(255, 255, 255, 0, 0, -1);

  // Animación respiratoria
  if (growing) {
    radiusScale += breathingSpeed;
    if (radiusScale > maxScale) {
      radiusScale = maxScale;
      growing = false;
    }
  } else {
    radiusScale -= breathingSpeed;
    if (radiusScale < minScale) {
      radiusScale = minScale;
      growing = true;
    }
  }

  // Burbuja externa
  push();
  scale(radiusScale);
  fill(255, 255, 255, 100);
  sphere(100, 100, 100);
  pop();

  // Burbuja interna iridiscente
  push();
  scale(radiusScale * 0.6);
  for (let r = 90; r > 0; r -= 5) {
    let c = color(
      200 + 55 * sin(frameCount * 0.01 + r),
      150 + 105 * sin(frameCount * 0.012 + r),
      255,
      100
    );
    fill(c);
    sphere(r * 0.2, 12, 12);
  }
  pop();

  // Partículas
  push();
  translate(-width / 2, -height / 2);
  blendMode(ADD);
  for (let p of particles) {
    fill(255, 180, 255, 100);
    ellipse(p.pos.x, p.pos.y, 6);
    let target = createVector(mouseX, mouseY);
    p.pos.lerp(target, 0.05);
  }
  blendMode(BLEND);
  pop();

  // Menú si el mouse está en el cuadrante superior izquierdo
  if (mouseX < width / 2 && mouseY < height / 2) {
    drawMenuZen();
  }

  // Garabato
  drawGarabatoOverlay();
}

function drawMenuZen() {
  const menuRadius = 14;
  const menuMargin = 18;
  const menuY = -height / 2 + 30; // esquina superior
  const menuXStart = -width / 2 + 30; // izquierda
  for (let i = 0; i < 4; i++) {
    let x = menuXStart + i * (menuRadius * 2 + menuMargin);
    let y = menuY;
    push();
    translate(x, y, 1);
    noStroke();
    if (i === 3) fill("#00ff50");
    else fill("#f5f5dc");
    ellipse(0, 0, menuRadius * 2);
    pop();
  }
}

function mousePressed() {
  // Inicia sonido
  if (ambientSound && !ambientSound.isPlaying()) {
    ambientSound.loop();
  }

  // Redirección si se hace clic en el garabato
  const canvas = document.getElementById('garabato-overlay');
  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const mx = mouseX - rect.left;
    const my = mouseY - rect.top;
    const d = dist(mx, my, cx, cy);
    if (d < 48) {
      window.location.href = "index.html";
      return;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  drawGarabatoOverlay();
}

// --- GARABATO ---
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
  const mx = mouseX - rect.left;
  const my = mouseY - rect.top;
  const d = dist(mx, my, cx, cy);
  const t = constrain(1 - d / (radio + 12), 0, 1);
  const r = lerp(255, 0, t);
  const a = lerp(0.18, 0.95, t);
  ctx.save();
  ctx.strokeStyle = `rgba(${r},${r},${r},${a})`;
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

window.addEventListener('resize', drawGarabatoOverlay);
setTimeout(drawGarabatoOverlay, 100);


function mousePressed() {
  // Inicia sonido
  if (ambientSound && !ambientSound.isPlaying()) {
    ambientSound.loop();
  }

  // Redirección si se hace clic en el garabato
  const canvas = document.getElementById('garabato-overlay');
  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const mx = mouseX - rect.left;
    const my = mouseY - rect.top;
    const d = dist(mx, my, cx, cy);
    if (d < 48) {
      window.location.href = "index.html";
      return;
    }
  }

  // --- MENÚ: detección de click en esferas ---
  // Calcula posición relativa al centro de la pantalla (WEBGL)
  let menuRadius = 14;
  let menuMargin = 18;
  let menuY = 30;
  let menuXStart = 30;
  // Solo si el mouse está en el cuadrante superior izquierdo
  if (mouseX < width / 2 && mouseY < height / 2) {
    for (let i = 0; i < 4; i++) {
      let x = menuXStart + i * (menuRadius * 2 + menuMargin);
      let y = menuY;
      // mouseX y mouseY son relativos a la esquina superior izquierda
      let d = dist(mouseX, mouseY, x, y);
      if (d < menuRadius * 1.2) {
        if (i === 0) {
          window.location.href = "agua.html";
          return;
        }
        if (i === 1) {
          window.location.href = "particulas.html";
          return;
        }
        if (i === 2) {
          window.location.href = "pantalla_zen.html";
          return;
        }
        if (i === 3) {
          window.location.href = "ojo.html";
          return;
        }
      }
    }
  }
}