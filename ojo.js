let currentImg;
let images = [];
let imgIndex = 0;
let garabatoData = null;

function preload() {
  images[0] = loadImage('img/ojos.png');
  images[1] = loadImage('img/ojos2.png');
  images[2] = loadImage('img/ojos3.png');
  images[3] = loadImage('img/ojos4.png');
  images[4] = loadImage('img/ojos5.png'); 
  images[5] = loadImage('img/ojos6.png'); 
  images[6] = loadImage('img/ojos7.png'); 
  images[7] = loadImage('img/ojos8.png');
  currentImg = images[imgIndex];
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

   // Crear el menú de instrucciones estilo elegante
  infoBox = createDiv(`
    <p><span style="color:#00FF00">Presioná N</span> para cambiar imagen</p>
  `);

  infoBox.style('position', 'fixed');
  infoBox.style('bottom', '20px');
  infoBox.style('left', '20px');
  infoBox.style('color', 'rgba(255, 255, 255, 0.85)');
  infoBox.style('font-family', 'sans-serif');
  infoBox.style('font-size', '14px');
  infoBox.style('line-height', '1.4em');
  infoBox.style('text-align', 'left');
  infoBox.style('z-index', '1000');
  infoBox.style('background', 'none');
  infoBox.style('padding', '0');
  infoBox.style('pointer-events', 'none'); // No interfiere con el mouse
}

function draw() {
  background(0);

  orbitControl();

  // Esfera de fondo (panorama)
  push();
  scale(-1, 1, 1);
  noStroke();
  texture(currentImg);
  sphere(1000, 64, 64);
  pop();

  // Esfera del ojo en el centro
  push();
  texture(currentImg);
  noStroke();
  sphere(120, 64, 64);
  pop();

  // --- Dibuja el garabato overlay ---
  drawGarabatoOverlay();
}

function keyPressed() {
    if (key === 'N' || key === 'n') {
        imgIndex = (imgIndex + 1) % images.length;
        currentImg = images[imgIndex];
    }

    if (key === 'H' || key === 'h') {
        menuVisible = !menuVisible;
        console.log("H key pressed. menuVisible is now:", menuVisible); // Log para depuración
        if (infoBox && infoBox.elt) { // Asegúrate de que infoBox y su elemento DOM existan
            // INICIO DE LA PORCIÓN DE CÓDIGO MODIFICADA
            if (menuVisible) {
                infoBox.elt.style.display = 'block'; // Muestra el elemento
                console.log("infoBox should be shown (explicit display: block)."); // Log para depuración
            } else {
                infoBox.elt.style.display = 'none'; // Oculta el elemento
                console.log("infoBox should be hidden (explicit display: none)."); // Log para depuración
            }
            // FIN DE LA PORCIÓN DE CÓDIGO MODIFICADA
        } else {
            console.warn("infoBox or infoBox.elt is null or undefined when H key pressed."); // Advertencia si infoBox no está listo
        }
    }
}

// --- MENÚ FIJO EN CANVAS HTML, SOLO CUANDO EL CURSOR ESTÁ EN EL CUADRANTE 1 ---
function drawMenuEsferasHTML() {
    const canvas = document.getElementById('menu-esferas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Solo dibuja si el mouse está en el cuadrante superior izquierdo DE LA VENTANA
    if (typeof window.mouseX !== "undefined" && typeof window.mouseY !== "undefined" &&
        window.mouseX >= 0 && window.mouseY >= 0 &&
        window.mouseX < window.innerWidth / 2 && window.mouseY < window.innerHeight / 2) { //
        const menuRadius = 14;
        const menuMargin = 18;
        const menuY = 30;
        const menuXStart = 30;
        for (let i = 0; i < 4; i++) {
            let x = menuXStart + i * (menuRadius * 2 + menuMargin);
            let y = menuY;
            ctx.beginPath();
            ctx.arc(x, y, menuRadius, 0, 2 * Math.PI);
            ctx.fillStyle = (i === 3) ? "#f5f5dc" : "#00ff50";
            ctx.fill();
        }
    }
}

// Llama a la función cada frame
function animateMenuEsferas() {
  drawMenuEsferasHTML();
  requestAnimationFrame(animateMenuEsferas);
}
animateMenuEsferas();

// --- GARABATO OVERLAY CAÓTICO FINAL ---
function drawGarabatoOverlay() {
  const canvas = document.getElementById('garabato-overlay');
  if (!canvas) return;
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Centro del garabato en el overlay
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

  // Mouse relativo al overlay
  const rect = canvas.getBoundingClientRect();
  let mx = mouseX - rect.left;
  let my = mouseY - rect.top;
  const d = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
  const hoverRadius = radio + 12;
  let t = constrain(1 - d / hoverRadius, 0, 1);

  // Interpolación de color y opacidad
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

// --- CLICK SOBRE EL GARABATO ---
function mousePressed() {
  const overlay = document.getElementById('garabato-overlay');
  if (overlay) {
    const rect = overlay.getBoundingClientRect();
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
          window.location.href = "huellas.html";
          return;
        }
        if (i === 1) {
          window.location.href = "camara.html";
          return;
        }
        if (i === 2) {
          window.location.href = "qr.html";
          return;
        }
        if (i === 3) {
          window.location.href = "scroll_infinito.html";
          return;
        }
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  garabatoData = null;
  drawGarabatoOverlay();
}

window.addEventListener('resize', drawGarabatoOverlay);
setTimeout(drawGarabatoOverlay, 100);