// --- VARIABLES GLOBALES ---
let feedImage;
let errorScreenImage;
let murmurSound;
let glassBreakSound;

let feedY = 0;

let scrollSensitivity = 1;
let accelerationStartThreshold = 0.8;
let maxScrollSpeed = 200;
let currentScrollSpeed = 0;

let sketchState = 'FEED';

const MIN_MURMUR_VOLUME = 0.1;
const MAX_MURMUR_VOLUME = 0.8;

let glitchActive = false;
let glitchStartTime = 0;

const GLITCH_DURATION = 200;

let audioStarted = false;

// --- p5.js preload ---
function preload() {
    feedImage = loadImage('img/scroll_infinito1.png',
        () => console.log('feedImage cargada correctamente.'),
        (err) => console.error('Error al cargar feedImage:', err)
    );
    errorScreenImage = loadImage('img/imagen_error.jpg',
        () => console.log('errorScreenImage cargada correctamente.'),
        (err) => console.error('Error al cargar errorScreenImage:', err)
    );
    soundFormats('mp3', 'wav');
    murmurSound = loadSound('sonido/murmullos.mp3');
    glassBreakSound = loadSound('sonido/vidrio_roto.mp3');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    
    feedImage.resize(0, 0);
    errorScreenImage.resize(windowWidth, windowHeight);
    background(0);
}

function draw() {
    if (sketchState === 'FEED') {
        drawFeed();
    } else if (sketchState === 'BROKEN_SCREEN') {
        drawBrokenScreen();
    }

    if (mouseX < width / 2 && mouseY < height / 2) {
    drawMenuZen();
  }

  drawGarabatoOverlay();
}

// --- SCROLL INFINITO ---
function drawFeed() {
    background(0);

    image(feedImage, 0, feedY);
    image(feedImage, 0, feedY + feedImage.height);

    let effectiveScrollY = Math.abs(feedY % feedImage.height);
    let scrolledPercentage = effectiveScrollY / feedImage.height;

    if ((scrolledPercentage >= accelerationStartThreshold || currentScrollSpeed > 0) && currentScrollSpeed < maxScrollSpeed) {
        currentScrollSpeed += 0.1;
    }

    feedY -= currentScrollSpeed;

    if (feedY <= -feedImage.height) {
        feedY += feedImage.height;
    }

    feedY = Math.min(feedY, 0);

    if (currentScrollSpeed > 0) {
        let volumeMap = map(currentScrollSpeed, 0, maxScrollSpeed, MIN_MURMUR_VOLUME, MAX_MURMUR_VOLUME);
        murmurSound.setVolume(volumeMap);
    }

    if (currentScrollSpeed >= maxScrollSpeed) {
        sketchState = 'BROKEN_SCREEN';
        glassBreakSound.play();
        murmurSound.stop();
    }
}

function drawBrokenScreen() {
    background(0);
    image(errorScreenImage, 0, 0, windowWidth, windowHeight);

    if (glitchActive) {
        if (millis() - glitchStartTime < GLITCH_DURATION) {
            let offsetX = random(-5, 5);
            let offsetY = random(-5, 5);
            image(errorScreenImage, offsetX, offsetY, windowWidth, windowHeight);
        } else {
            glitchActive = false;
        }
    }
}

function mouseWheel(event) {
    if (sketchState === 'FEED' && currentScrollSpeed < maxScrollSpeed * 0.5) {
        feedY -= event.delta * scrollSensitivity;
        feedY = Math.min(feedY, 0);
    }
}

// --- AUDIO AUTOPLAY FIX ---
function mousePressed() {
    // Iniciar audio tras primer click
    if (!audioStarted) {
        if (getAudioContext().state !== 'running') {
            userStartAudio();
        }
        murmurSound.setVolume(MIN_MURMUR_VOLUME);
        murmurSound.loop();
        murmurSound.play();
        audioStarted = true;
    }

    // Lógica para la pantalla rota
    if (sketchState === 'BROKEN_SCREEN') {
        glitchActive = true;
        glitchStartTime = millis();
        glassBreakSound.play();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    feedImage.resize(windowWidth, 0);
    errorScreenImage.resize(windowWidth, windowHeight);
}

// Inicializar estilos básicos
document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement('style');
    style.textContent = `
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
});

function drawMenuZen() {
  const menuRadius = 14;
  const menuMargin = 18;
  const menuY = 30;
  const menuXStart = 30;
  for (let i = 0; i < 4; i++) {
    let x = menuXStart + i * (menuRadius * 2 + menuMargin);
    let y = menuY;
    if (i === 3) {
      fill("#00ff50");
    } else {
      fill("#a259f7");
    }
    noStroke();
    ellipse(x, y, menuRadius * 2);
  }
}

function mousePressed() {
  // --- CLICK SOBRE EL GARABATO ---
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

  // --- CLICK SOBRE MENÚ DE ESFERAS ---
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
        if (i === 0) {
          window.location.href = "reloj.html";
          return;
        }
        if (i === 1) {
          window.location.href = "abismo.html";
          return;
        }
        if (i === 2) {
          window.location.href = "aburrimiento.html";
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

window.addEventListener('resize', drawGarabatoOverlay);
setTimeout(drawGarabatoOverlay, 100);
