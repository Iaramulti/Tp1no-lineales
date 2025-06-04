// --- VARIABLES GLOBALES (accesibles por todos los componentes) ---
let buttonSymbols = [
    "≡", "☰", "⋮", "⋯", "⮟", "➤", "➕", "＋", "▶", "▸", "→", "↓", "…", "✓", "✕", "❯", "⏵", "⏷", "★", "⮞", "⮜", "⮚", "⮛", "↷", "↺", "⊗", "⬈", "⬊", "▻", "◁", "▲", "▼", "■", "≡", "☰", "≡", "☰", "≡", "☰", "≡", "☰", "≡", "☰",
];

let buttons = [];
let numButtons = 10;
let bgImg; // Variable para la imagen de fondo

let garabatoData = null; // Para el garabato overlay

// Variables para el seguimiento global del mouse (para overlays)
window.mouseX = 0;
window.mouseY = 0;

// --- FUNCIONES AUXILIARES (RE-IMPLEMENTACIONES DE P5.JS PARA USO GLOBAL) ---
// Estas funciones son necesarias para que los overlays (que no son parte del sketch de p5.js)
// puedan usar utilidades matemáticas como dist, lerp, random, etc.
// NOTA: En este archivo, como p5.js no está en modo instancia, estas funciones
// son redundantes si ya existen como globales de p5.js, pero las mantengo
// para compatibilidad con el patrón de otros archivos.
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(x1, y1, x2, y2) { return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)); }
function random(min, max) {
    if (max === undefined) {
        max = min;
        min = 0;
    }
    return Math.random() * (max - min) + min;
}
function abs(n) { return Math.abs(n); }
function map(value, start1, stop1, start2, stop2, withinBounds) {
    let newval = (value - start1) / (stop1 - start1) * (stop2 - start2) + start2;
    if (withinBounds) {
        if (start2 < stop2) {
            return Math.max(Math.min(newval, stop2), start2);
        } else {
            return Math.max(Math.min(newval, start2), stop2);
        }
    }
    return newval;
}
function constrain(n, low, high) {
    return Math.max(Math.min(n, high), low);
}
function atan2(y, x) { return Math.atan2(y, x); }
function round(n) { return Math.round(n); }
const TWO_PI_GLOBAL = Math.PI * 2; // Usar global para funciones que no son de p5.js
const PI_GLOBAL = Math.PI; // Usar global para funciones que no son de p5.js


// --- P5.JS PRELOAD ---
function preload() {
    bgImg = loadImage("img/fondo3.jpg");
}

// --- P5.JS SETUP ---
function setup() {
    createCanvas(windowWidth, windowHeight);
    textFont("Arial");
    noCursor(); // Oculta el cursor del sistema

    for (let i = 0; i < numButtons; i++) {
        let symbol = random(buttonSymbols);
        let x = random(50, width - 50);
        let y = random(50, height - 50);
        buttons.push({
            x: x,
            y: y,
            w: 80,
            h: 80,
            symbol: symbol,
            hover: false,
            expanded: false, // para los menus desplegables
            submenu: [], // para guardar los símbolos desplegados
        });
    }
}

// --- P5.JS DRAW ---
function draw() {
    if (bgImg && bgImg.width > 0 && bgImg.height > 0) {
        image(bgImg, 0, 0, width, height);
    } else {
        background(0); // Fondo negro de respaldo
    }

    noStroke();
    fill(200, 100, 255, 180);
    ellipse(mouseX, mouseY, 12, 12); // Dibuja el cursor personalizado

    for (let b of buttons) {
        b.hover = isMouseOver(b);

        push();
        textAlign(CENTER, CENTER);
        rectMode(CENTER);
        textSize(40);

        if (b.hover) {
            fill(200, 100, 255, 40);
            ellipse(b.x, b.y, b.w + 30, b.h + 30);
            fill(200, 100, 255, 20);
            rect(b.x, b.y, b.w, b.h, 16);
            fill(255, 200, 255);
            textSize(44);
        } else {
            fill(200, 100, 255, 10);
            rect(b.x, b.y, b.w, b.h, 16);
            fill(180, 100, 255);
        }

        text(b.symbol, b.x, b.y);
        pop();

        // Si está expandido, mostrar submenu
        if (b.expanded) {
            drawSubmenu(b);
        }
    }

    // --- Dibuja el menú de esferas overlay ---
    drawMenuEsferasHTML();
    // --- Dibuja el garabato overlay ---
    drawGarabatoOverlay();
}

// --- FUNCIONES AUXILIARES DEL SKETCH ---
function drawSubmenu(button) {
    let radius = 90;
    let submenuCount = button.submenu.length;
    textAlign(CENTER, CENTER);
    rectMode(CENTER);
    textSize(30);
    noStroke();

    for (let i = 0; i < submenuCount; i++) {
        let angle = map(i, 0, submenuCount, 0, TWO_PI) - PI / 2;
        let sx = button.x + cos(angle) * radius;
        let sy = button.y + sin(angle) * radius;

        // fondo y hover para cada submenu item
        let hover = dist(mouseX, mouseY, sx, sy) < 40;
        if (hover) {
            fill(200, 100, 255, 80);
            ellipse(sx, sy, 70, 70);
            fill(255, 200, 255, 10);
        } else {
            fill(200, 100, 255, 30);
        }
        rect(sx, sy, 60, 60, 12);

        fill(180, 100, 255);
        if (hover) fill(255, 200, 255);
        text(button.submenu[i], sx, sy);
    }
}

function isMouseOver(b) {
    return (
        mouseX > b.x - b.w / 2 &&
        mouseX < b.x + b.w / 2 &&
        mouseY > b.y - b.h / 2 &&
        mouseY < b.y + b.h / 2
    );
}

// --- P5.JS MOUSE PRESSED (COMBINADO PARA NAVEGACIÓN Y BOTONES) ---
function mousePressed() {
    // --- Lógica de botones interactivos ---
    let handledByButton = false;
    for (let b of buttons) {
        if (b.expanded) {
            // Si el click está en submenu
            let submenuClicked = false;
            let radius = 90;
            for (let i = 0; i < b.submenu.length; i++) {
                let angle = map(i, 0, b.submenu.length, 0, TWO_PI) - PI / 2;
                let sx = b.x + cos(angle) * radius;
                let sy = b.y + sin(angle) * radius;
                if (dist(mouseX, mouseY, sx, sy) < 30) {
                    //Cambia el símbolo principal por el del submenu clickeado
                    b.symbol = b.submenu[i];
                    b.expanded = false;
                    b.submenu = [];
                    submenuClicked = true;
                    handledByButton = true; // El clic fue manejado por un submenú
                    break;
                }
            }
            if (submenuClicked) break; // Si se hizo clic en un submenú, no procesar más botones
        }
    }

    if (!handledByButton) { // Solo procesa el clic en el botón principal si no fue manejado por un submenú
        for (let b of buttons) {
            if (b.hover) {
                // Si el botón es menú (podemos decidir que sea el símbolo "≡" o "☰")
                if (b.symbol === "≡" || b.symbol === "☰") {
                    if (!b.expanded) {
                        b.expanded = true;
                        // Generar submenu con 6 símbolos aleatorios diferentes
                        b.submenu = [];
                        while (b.submenu.length < 6) {
                            let sym = random(buttonSymbols);
                            if (sym !== b.symbol && !b.submenu.includes(sym)) {
                                b.submenu.push(sym);
                            }
                        }
                    } else {
                        // Cerrar submenu
                        b.expanded = false;
                        b.submenu = [];
                    }
                } else {
                    // Para otros símbolos, solo cambian símbolo y mueven posición
                    let newSymbol;
                    do {
                        newSymbol = random(buttonSymbols);
                    } while (newSymbol === b.symbol);
                    b.symbol = newSymbol;

                    b.x = constrain(b.x + random(-30, 30), 50, width - 50);
                    b.y = constrain(b.y + random(-30, 30), 50, height - 50);
                }
                handledByButton = true; // El clic fue manejado por un botón principal
                break;
            }
        }
    }


    // --- Lógica de navegación de overlays (solo si el clic no fue manejado por los botones) ---
    if (!handledByButton) {
        // --- CLICK SOBRE EL GARABATO OVERLAY ---
        const garabatoCanvas = document.getElementById('garabato-overlay');
        if (garabatoCanvas) {
            const rect = garabatoCanvas.getBoundingClientRect();
            const cx_overlay = rect.width - 45; // Posición X del centro del garabato en la esquina inferior derecha
            const cy_overlay = rect.height - 45; // Posición Y del centro del garabato en la esquina inferior derecha
            const radio_garabato = 36;

            const mx_overlay = window.mouseX - rect.left;
            const my_overlay = window.mouseY - rect.top;

            const d_garabato = dist(mx_overlay, my_overlay, cx_overlay, cy_overlay); // Usar dist global

            if (d_garabato < radio_garabato + 12) {
                window.location.href = "index.html"; // Redirige al universo de esferas
                return; 
            }
        }

        // --- CLICK SOBRE MENÚ DE ESFERAS ---
        const menuCanvas = document.getElementById('menu-esferas');
        if (menuCanvas) {
            const rect = menuCanvas.getBoundingClientRect();
            const mx_menu = window.mouseX - rect.left;
            const my_menu = window.mouseY - rect.top;

            const menuRadius = 14;
            const menuMargin = 18;
            const menuY = 30; // Posición Y de las esferas en el canvas del menú
            const menuXStart = 30; // Posición X de la primera esfera en el canvas del menú

            for (let i = 0; i < 4; i++) {
                const x_sphere = menuXStart + i * (menuRadius * 2 + menuMargin);
                const y_sphere = menuY;
                const d_sphere = dist(mx_menu, my_menu, x_sphere, y_sphere); // Usar dist global

                if (d_sphere < menuRadius) {
                    if (i === 0) {
                        window.location.href = "reloj.html";
                        return;
                    }
                    if (i === 1) {
                        window.location.href = "scroll_infinito.html";
                        return;
                    }
                    if (i === 2) {
                        window.location.href = "abismo.html";
                        return;
                    }
                    if (i === 3) {
                        window.location.href = "qr.html";
                        return;
                    }
                }
            }
        }
    }
}

// --- P5.JS WINDOW RESIZED ---
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // Regenerar garabato data al redimensionar para que se ajuste
    garabatoData = null;
    drawGarabatoOverlay(); // Redibujar el garabato
    drawMenuEsferasHTML(); // Redibujar el menú
}


// --- MENÚ FIJO EN CANVAS HTML, SOLO CUANDO EL CURSOR ESTÁ EN EL CUADRANTE 1 ---
function drawMenuEsferasHTML() {
    const canvas = document.getElementById('menu-esferas');
    if (!canvas) return;
    // Asegura que el canvas del menú también ocupe toda la ventana para que las coordenadas sean consistentes
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mostrar solo si el mouse está en el cuadrante superior izquierdo DE TODA LA PANTALLA
    if (
        typeof window.mouseX === "number" &&
        typeof window.mouseY === "number" &&
        window.mouseX >= 0 && window.mouseY >= 0 &&
        window.mouseX < window.innerWidth / 2 &&
        window.mouseY < window.innerHeight / 2
    ) {
        const menuRadius = 14;
        const menuMargin = 18;
        const menuY = 30;
        const menuXStart = 30;
        for (let i = 0; i < 4; i++) {
            let x = menuXStart + i * (menuRadius * 2 + menuMargin);
            let y = menuY;
            ctx.beginPath();
            ctx.arc(x, y, menuRadius, 0, 2 * Math.PI);
            // Colores: 3 violetas, 1 beige/blanca
            ctx.fillStyle = (i === 3) ? "#00ff50" : "#a259f7";
            ctx.shadowColor = "#000";
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// Llama a la función cada frame
function animateMenuEsferas() {
    drawMenuEsferasHTML();
    requestAnimationFrame(animateMenuEsferas);
}


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
