// --- VARIABLES PRINCIPALES ---
let fichas = [];
let imagenes = []; // CORRECCIÓN: Cambiado de 'imagen es' a 'imagenes'
let cantidadImagenes = 16; // Si tienes rostro1.png a rostro10.png
let qrSize = 150;
let glassShapes = [];
let glitchSound;
// 'soundPlayed' debería ser una propiedad de cada ficha, no global.
// Se mantiene aquí por si se necesita una lógica global de sonido, pero la ficha ya tiene su propia.

let nombres = [
    "Lucía Fernández", "Mateo González", "Valentina Díaz", "Tomás Herrera",
    "Camila Romero", "Santiago López", "Martina Ruiz", "Benjamín Torres",
    "Isabella Gómez", "Joaquín Silva", "Matías Romero", "Romina Estebis", "Abril Salazar", "Nicolás Vega", "Mía Castro", "Thiago Moreno",
    "Lara Méndez", "Facundo Ríos", "Zoe Navarro", "Ian Córdoba",
    "Alma Pereyra", "Dante Suárez", "Olivia Márquez", "Gael Paredes",
    "Jazmín Aguirre", "Elías Bustos", "Candelaria Ortiz", "León Ferreira",
    "Milagros Medina", "Benicio Cabrera", "Renata Ayala", "Bautista Cáceres",
    "Juana Carrizo", "Valentino Arias", "Delfina Acosta", "Joaquín Ibáñez",
    "Emma Roldán", "Simón Arce", "Antonia Barrios", "Lisandro Cuello",
    "Julia Herrera", "Lorenzo Escobar"
];

let generos = ["Femenino", "Masculino", "No binario"];

function preload() {
    // Carga las imágenes de los rostros
    for (let i = 1; i <= cantidadImagenes; i++) {
        imagenes.push(loadImage(`img/rostro${i}.png`,
            () => console.log(`Imagen rostro${i}.png cargada.`), // Callback de éxito
            (err) => console.error(`Error al cargar rostro${i}.png:`, err) // Callback de error
        ));
    }
    // Carga el sonido de glitch
    glitchSound = loadSound('sonido/glitch.m4a',
        () => console.log("Sonido glitch.m4a cargado."), // Callback de éxito
        (err) => console.error("Error al cargar glitch.m4a:", err) // Callback de error
    );
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    textSize(12);
    textAlign(LEFT, TOP);
    noStroke();
    fill(255);

    // Inicializa las formas de vidrio para el fondo
    for (let i = 0; i < 40; i++) {
        glassShapes.push({
            x: random(width),
            y: random(height),
            w: random(100, 250),
            h: random(60, 180),
            alpha: random(4, 12),
            dx: random(-0.2, 0.2),
            dy: random(-0.2, 0.2)
        });
    }
}

function draw() {
    background(10); // Fondo oscuro

    // Fondo con efecto vidrio (formas en movimiento)
    for (let g of glassShapes) {
        fill(255, g.alpha); // Blanco translúcido
        rect(g.x, g.y, g.w, g.h, 0); // Dibuja el rectángulo de vidrio

        g.x += g.dx; // Mueve la forma en X
        g.y += g.dy; // Mueve la forma en Y

        // Invierte la dirección si la forma sale de los límites del lienzo
        if (g.x < 0 || g.x + g.w > width) g.dx *= -1; // CORRECCIÓN: Multiplicar por -1 para invertir, no por -20
        if (g.y < 0 || g.y + g.h > height) g.dy *= -1; // CORRECCIÓN: Multiplicar por -1 para invertir, no por -20
    }

    // Líneas horizontales sutiles para simular profundidad
    stroke(255, 4); // Blanco muy translúcido
    for (let y = 0; y < height; y += 6) {
        line(0, y, width, y); // Dibuja líneas de borde a borde
    }
    noStroke(); // Deshabilita el trazo para los siguientes dibujos

    // Actualiza y muestra cada ficha de identidad
    for (let f of fichas) {
        f.update();
        f.display();
    }

    // --- MENÚ SOLO SI EL CURSOR ESTÁ EN EL CUADRANTE SUPERIOR IZQUIERDO ---
    // Asegura que drawMenuEsferas se dibuje en las coordenadas correctas y no afecte otros dibujos
    push();
    if (mouseX < width / 2 && mouseY < height / 2) {
        drawMenuEsferas();
    }
    pop();

    // --- GARABATO OVERLAY CAÓTICO FINAL ---
    // Asegura que drawGarabatoOverlay se dibuje en las coordenadas correctas y no afecte otros dibujos
    push();
    drawGarabatoOverlay();
    pop();
}

// --- INTERACCIÓN ---
function mousePressed() {
    // --- CLICK SOBRE EL GARABATO ---
    const overlay = document.getElementById('garabato-overlay');
    if (overlay) {
        const rect = overlay.getBoundingClientRect();
        // CORRECCIÓN: Ajustar cx y cy para que el garabato esté en la esquina inferior derecha
        const cx = rect.width - 45; // Posición X del centro del garabato
        const cy = rect.height - 45; // Posición Y del centro del garabato

        const mx = mouseX - rect.left; // Mouse X relativo al overlay
        const my = mouseY - rect.top; // Mouse Y relativo al overlay
        const radio = 36; // Radio del garabato
        const d = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
        if (d < radio + 12) {
            window.location.href = "index.html";
            return;
        }
    }

    // --- CLICK SOBRE LOS CÍRCULOS DEL MENÚ ---
    if (mouseX < width / 2 && mouseY < height / 2) {
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

        // Segundo círculo: huellas.html
        const esfera2x = menuXStart + 1 * (menuRadius * 2 + menuMargin);
        const esfera2y = menuY;
        const dMenu2 = Math.sqrt((mouseX - esfera2x) ** 2 + (mouseY - esfera2y) ** 2);
        if (dMenu2 < menuRadius) {
            window.location.href = "huellas.html";
            return;
        }

        // Tercer círculo: camara.html
        const esfera3x = menuXStart + 2 * (menuRadius * 2 + menuMargin);
        const esfera3y = menuY;
        const dMenu3 = Math.sqrt((mouseX - esfera3x) ** 2 + (mouseY - esfera3y) ** 2);
        if (dMenu3 < menuRadius) {
            window.location.href = "camara.html";
            return;
        }

        // Cuarto círculo: qr.html (ya estás en esta página, así que no navega)
        const esfera4x = menuXStart + 3 * (menuRadius * 2 + menuMargin);
        const esfera4y = menuY;
        const dMenu4 = Math.sqrt((mouseX - esfera4x) ** 2 + (mouseY - esfera4y) ** 2);
        if (dMenu4 < menuRadius) {
            window.location.href = "pantalla_zen.html"; // Asumiendo que esta es la página actual o una de destino
            return;
        }
    }

    // --- RESTO DE TU LÓGICA DE mousePressed (agregar fichas) ---
    // Si el clic no fue en el garabato ni en el menú, agrega una nueva ficha
    let x = random(width - qrSize);
    let y = random(height - qrSize);
    fichas.push(new FichaIdentidad(x, y, qrSize));
}

class FichaIdentidad {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.img = random(imagenes); // Ahora 'imagenes' está correctamente definida

        this.name = random(nombres);
        this.age = int(random(18, 40));
        this.height = nf(random(1.55, 1.90), 1, 2) + "m";
        this.gender = random(generos);
        this.showData = false;
        this.soundPlayed = false;
    }

    update() {
        let hovering =
            mouseX > this.x &&
            mouseX < this.x + this.size &&
            mouseY > this.y &&
            mouseY < this.y + this.size;

        if (hovering && !this.soundPlayed) {
            // Asegúrate de que glitchSound esté cargado antes de intentar reproducirlo
            if (glitchSound && glitchSound.isLoaded()) {
                glitchSound.play();
                this.soundPlayed = true;
            }
        } else if (!hovering && this.soundPlayed) { // CORRECCIÓN: Solo resetear si no está haciendo hover Y el sonido se había reproducido
            this.soundPlayed = false;
        }
        // CORRECCIÓN: Si el sonido no está cargado, no debería intentar reproducirlo.
        // La lógica de `soundPlayed` solo debe activarse si el sonido se reproduce con éxito.

        this.showData = hovering;
    }

    display() {
        if (this.showData) {
            glitchImage(this.img, this.x, this.y, this.size, this.size);
            fill(255); // Color de texto blanco
            let offset = 5;
            text(this.name, this.x + offset, this.y + offset);
            text("Edad: " + this.age, this.x + offset, this.y + 20);
            text("Estatura: " + this.height, this.x + offset, this.y + 35);
            text("Género: " + this.gender, this.x + offset, this.y + 50);
        } else {
            image(this.img, this.x, this.y, this.size, this.size);
        }
    }
}

function glitchImage(img, x, y, w, h) {
    let glitchCount = int(random(1, 3));
    for (let i = 0; i < glitchCount; i++) {
        let glitchY = int(random(h));
        let glitchHeight = int(random(2, 6));
        let offset = int(random(-10, 10));
        // copy(srcImage, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        // Asegúrate de que img.width y img.height sean válidos.
        // Si img no está completamente cargada, podría causar problemas.
        if (img && img.width > 0 && img.height > 0) {
            copy(img, 0, glitchY, img.width, glitchHeight, int(x + offset), int(y + glitchY), w, glitchHeight);
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // No es necesario regenerar fichas o reiniciar animaciones aquí,
    // ya que las fichas se agregan con mousePressed.
    // Solo se redimensiona el canvas principal.
    
    // CORRECCIÓN: Asegurar que el garabato overlay se redibuje con el nuevo tamaño
    drawGarabatoOverlay();
}

function keyPressed() {
    if (key === ' ') {
        window.location.href = "camara.html";
    }
}

// --- MENÚ DESPLEGABLE DE 4 ESFERAS ---
function drawMenuEsferas() {
    const menuRadius = 14;
    const menuMargin = 18;
    const menuY = 30;
    const menuXStart = 30;
    for (let i = 0; i < 4; i++) {
        let x = menuXStart + i * (menuRadius * 2 + menuMargin);
        let y = menuY;
        if (i === 3) {
            fill("#f5f5dc"); // blanca/beige
        } else {
            fill("#00ff50"); // verde
        }
        noStroke();
        ellipse(x, y, menuRadius * 2);
    }
}

// --- GARABATO OVERLAY CAÓTICO FINAL ---
let garabatoData = null; // Mantenemos esta variable global para almacenar los datos del garabato
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
