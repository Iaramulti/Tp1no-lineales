// Variables globales para el sketch
let fingerprintLines = [];
let drawSpeed = 0.2;
let currentFrame = 0;
let scannerTexture;
let animationFinished = false;
let scanSound; // Variable para el sonido

// Nuevas variables para la posición de la huella digital
let fingerprintX;
let fingerprintY;

// Preload: Carga de recursos antes de que inicie el sketch
function preload() {
    // Asegúrate de que la ruta 'sonido/sonidohuellas.mp3' sea correcta
    // y que el archivo esté disponible en esa ubicación.
    scanSound = loadSound('sonido/sonidohuellas.mp3', soundLoaded, soundError);
}

// Callback cuando el sonido se carga correctamente
function soundLoaded() {
    console.log("Sonido cargado correctamente.");
}

// Callback si hay un error al cargar el sonido
function soundError(err) {
    console.error("Error al cargar el sonido:", err);
    // Puedes asignar un sonido de respaldo o deshabilitar la funcionalidad de sonido
    scanSound = null;
}

// Setup: Se ejecuta una vez al inicio del sketch
function setup() {
    createCanvas(windowWidth, windowHeight); // Crea el canvas principal de p5.js
    generateScannerTexture(); // Genera la textura del escáner
    noFill(); // Deshabilita el relleno para las formas (la huella solo tendrá contorno)
    stroke(0, 255, 100); // Establece el color de trazo por defecto (verde)

    // Inicializa la posición de la huella en el centro al inicio
    fingerprintX = width / 2;
    fingerprintY = height / 2;

    generateFingerprint(); // Genera los datos de la huella digital
}

// Draw: Se ejecuta continuamente (bucle de dibujo)
function draw() {
    background(0); // Fondo negro en cada frame
    image(scannerTexture, 0, 0, width, height); // Dibuja la textura del escáner

    // --- MENÚ SOLO SI EL CURSOR ESTÁ EN EL CUADRANTE SUPERIOR IZQUIERDO ---
    if (mouseX < width / 2 && mouseY < height / 2) {
        // push() y pop() son cruciales aquí para aislar los cambios de estilo
        // realizados por drawMenuEsferas() y evitar que afecten a la huella digital.
        push();
        drawMenuEsferas();
        pop();
    }

    // --- HUELLA DIGITAL ---
    // Guarda el estado de transformación actual antes de trasladar para la huella
    push();
    // Traslada el origen a la posición de la huella (centro o clic)
    translate(fingerprintX, fingerprintY);

    // Calcula cuántas líneas de la huella se deben dibujar en el frame actual
    let linesToDraw = floor(currentFrame * drawSpeed);

    // Bucle para dibujar las líneas de la huella
    for (let i = 0; i < fingerprintLines.length; i++) {
        if (i > linesToDraw) continue; // Si la línea aún no debe dibujarse, salta

        stroke(0, 255, 100, 180); // Establece el color de trazo para la huella (verde con transparencia)
        strokeWeight(1.2); // Establece el grosor del trazo
        beginShape(); // Inicia una nueva forma para la línea
        for (let pt of fingerprintLines[i]) {
            let x = pt.x;
            let y = pt.y;

            // SOLO aplicar oscilación una vez completada toda la huella
            if (animationFinished) {
                x += sin(frameCount * 0.1 + pt.y * 0.5) * 0.6;
                y += cos(frameCount * 0.1 + pt.x * 0.5) * 0.6;
            }

            vertex(x, y); // Añade un vértice a la forma
        }
        endShape(); // Finaliza la forma
    }
    pop(); // Restaura el estado de transformación después de dibujar la huella digital

    // Escáner mientras se dibuja la huella
    // Esta parte se dibuja ahora en el sistema de coordenadas global del lienzo.
    if (linesToDraw < fingerprintLines.length) {
        // Calcula la posición Y del escáner en relación con la altura total del lienzo.
        // La animación progresa de 0 a fingerprintLines.length.
        // La barra de escaneo debe moverse desde la parte superior (0) hasta la inferior (height) del lienzo.
        let scanY = map(linesToDraw, 0, fingerprintLines.length, 0, height);

        noStroke();
        fill(0, 255, 100, 9);
        // Dibuja el rectángulo desde el origen global (0,0) del lienzo.
        rect(0, scanY - 10, width, 20); // X es 0, el ancho es el ancho completo del lienzo.
        currentFrame++;
    } else {
        animationFinished = true;
    }

    // --- GARABATO OVERLAY ---
    drawGarabatoOverlay();
}

// mousePressed: Se ejecuta cuando se presiona el botón del ratón
function mousePressed() {
    // --- CLICK SOBRE EL GARABATO ---
    const cx = window.innerWidth - 45;
    const cy = window.innerHeight - 45;
    const radio = 22;
    const d = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
    if (d < radio + 12) { // Si el clic está dentro del área del garabato
        window.location.href = "index.html"; // Redirige a index.html
        return; // Sale de la función
    }

    // --- CLICK SOBRE LOS CÍRCULOS DEL MENÚ ---
    if (mouseX < width / 2 && mouseY < height / 2) { // Si el clic está en el cuadrante superior izquierdo
        const menuRadius = 14;
        const menuMargin = 18;
        const menuY = 30;
        const menuXStart = 30;

        // Primer círculo: ojos.html
        const esfera1x = menuXStart + 0 * (menuRadius * 2 + menuMargin);
        const esfera1y = menuY;
        const dMenu1 = Math.sqrt((mouseX - esfera1x) ** 2 + (mouseY - esfera1y) ** 2);
        if (dMenu1 < menuRadius) {
            window.location.href = "ojo.html";
            return;
        }

        // Segundo círculo: camara.html
        const esfera2x = menuXStart + 1 * (menuRadius * 2 + menuMargin);
        const esfera2y = menuY;
        const dMenu2 = Math.sqrt((mouseX - esfera2x) ** 2 + (mouseY - esfera2y) ** 2);
        if (dMenu2 < menuRadius) {
            window.location.href = "camara.html";
            return;
        }

        // Tercer círculo: qr.html
        const esfera3x = menuXStart + 2 * (menuRadius * 2 + menuMargin);
        const esfera3y = menuY;
        const dMenu3 = Math.sqrt((mouseX - esfera3x) ** 2 + (mouseY - esfera3y) ** 2);
        if (dMenu3 < menuRadius) {
            window.location.href = "qr.html";
            return;
        }

        // Cuarto círculo: beige (no navega)
        const esfera4x = menuXStart + 3 * (menuRadius * 2 + menuMargin);
        const esfera4y = menuY;
        const dMenu4 = Math.sqrt((mouseX - esfera4x) ** 2 + (mouseY - esfera4y) ** 2);
        if (dMenu4 < menuRadius) {
            window.location.href = "agua.html";
            return;
        }
    }

    // Si el clic no fue en el garabato ni en el menú, genera una nueva huella en la posición del clic
    fingerprintX = mouseX; // Actualiza la posición X de la huella al clic
    fingerprintY = mouseY; // Actualiza la posición Y de la huella al clic
    generateFingerprint(); // Regenera la huella digital
    currentFrame = 0; // Reinicia la animación
    animationFinished = false; // La animación no ha terminado

    // Reproduce el sonido de escaneo si está cargado
    if (scanSound && scanSound.isLoaded()) {
        scanSound.stop(); // Detiene si ya está sonando
        scanSound.play(); // Inicia la reproducción
    }
}

// mouseMoved: Se ejecuta cuando el ratón se mueve
function mouseMoved() {
    // Cambia el cursor solo si está sobre el garabato
    const cx = window.innerWidth - 45;
    const cy = window.innerHeight - 45;
    const radio = 22;
    const d = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);
    const canvas = document.getElementById('garabato-overlay');
    if (canvas) {
        if (d < radio + 12) {
            canvas.style.cursor = "pointer"; // Cambia el cursor a puntero
        } else {
            canvas.style.cursor = "default"; // Vuelve al cursor por defecto
        }
    }
}

// generateFingerprint: Genera los datos de las líneas de la huella digital
function generateFingerprint() {
    fingerprintLines = []; // Reinicia las líneas de la huella
    let rings = int(random(35, 50)); // Número de anillos
    let pointsPerRing = 300; // Puntos por anillo
    let noiseScale = random(0.02, 0.04); // Escala para el ruido Perlin
    let radiusStep = random(2.5, 4); // Incremento del radio entre anillos
    let swirlStrength = random(0.5, 1.5); // Fuerza del efecto de remolino

    for (let r = 0; r < rings; r++) {
        let ring = [];
        let baseRadiusX = r * radiusStep * 0.7; // Radio base en X
        let baseRadiusY = r * radiusStep * 1.1; // Radio base en Y (para una forma elíptica)

        for (let a = 0; a < pointsPerRing; a++) {
            let angle = map(a, 0, pointsPerRing, 0, TWO_PI); // Ángulo para el punto
            let swirl = swirlStrength * sin(r * 0.4 + angle * 3); // Efecto de remolino

            // Offsets basados en ruido Perlin para irregularidades
            let xoff = cos(angle) * baseRadiusX * noiseScale;
            let yoff = sin(angle) * baseRadiusY * noiseScale;
            let noiseVal = noise(xoff, yoff);

            let offsetX = map(noiseVal, 0, 1, -8, 8) + swirl;
            let offsetY = map(noiseVal, 0, 1, -8, 8) - swirl;

            // Calcula la posición final del punto
            let x = cos(angle) * baseRadiusX + offsetX;
            let y = sin(angle) * baseRadiusY + offsetY;

            ring.push(createVector(x, y)); // Añade el punto al anillo
        }
        fingerprintLines.push(ring); // Añade el anillo completo a las líneas de la huella
    }
}

// generateScannerTexture: Genera la textura de fondo del escáner
function generateScannerTexture() {
    scannerTexture = createGraphics(windowWidth, windowHeight); // Crea un nuevo buffer gráfico
    scannerTexture.background(0); // Fondo negro para la textura
    scannerTexture.strokeWeight(1); // Grosor de trazo para las líneas

    // Dibuja líneas verticales aleatorias
    for (let x = 0; x < windowWidth; x += 2) {
        let gray = random(100, 50);
        scannerTexture.stroke(gray, 70); // Color gris con transparencia
        scannerTexture.line(x, 5, x, windowHeight);
    }

    // Dibuja puntos de ruido aleatorios
    for (let i = 0; i < 500; i++) {
        let x = random(windowWidth);
        let y = random(windowHeight);
        let gray = random(70, 60);
        scannerTexture.stroke(gray, 20); // Color gris con baja transparencia
        scannerTexture.point(x, y);
    }
}

// windowResized: Se ejecuta cuando la ventana del navegador cambia de tamaño
function windowResized() {
    resizeCanvas(windowWidth, windowHeight); // Redimensiona el canvas de p5.js
    generateScannerTexture(); // Regenera la textura del escáner
    
    // Al redimensionar, la huella vuelve al centro
    fingerprintX = width / 2;
    fingerprintY = height / 2;

    generateFingerprint(); // Regenera la huella digital
    currentFrame = 0; // Reinicia la animación
    animationFinished = false; // La animación no ha terminado
    drawGarabatoOverlay(); // Redibuja el garabato overlay
}

// --- MENÚ DESPLEGABLE DE 4 ESFERAS ---
function drawMenuEsferas() {
    // Dibuja cuatro esferas en la esquina superior izquierda
    const menuRadius = 14;
    const menuMargin = 18;
    const menuY = 30;
    const menuXStart = 30;
    for (let i = 0; i < 4; i++) {
        let x = menuXStart + i * (menuRadius * 2 + menuMargin);
        let y = menuY;
        if (i === 3) {
            fill("#f5f5dc"); // Color blanca/beige para la cuarta esfera
        } else {
            fill("#00ff50"); // Color verde para las primeras tres esferas
        }
        noStroke(); // Sin contorno para las esferas
        ellipse(x, y, menuRadius * 2); // Dibuja la esfera
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
