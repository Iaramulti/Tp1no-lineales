// --- VARIABLES GLOBALES (accesibles por todos los componentes) ---
// Variables específicas del sketch de Partículas
let particles = [];
let numParticles = 100;
let bgImage;
let explosionSound;

// Variables para el menú y garabato overlays
let garabatoData = null; // Para almacenar los datos del garabato
window.mouseX = 0; // Para el seguimiento global del mouse (usado por overlays)
window.mouseY = 0; // Para el seguimiento global del mouse (usado por overlays)

// --- FUNCIONES AUXILIARES GLOBALES (para uso de overlays y sketch) ---
// Estas funciones son necesarias para que los overlays (que no son parte del sketch de p5.js)
// puedan usar utilidades matemáticas como dist, lerp, random, etc.
// Las funciones como dist, random, abs, map, constrain, atan2 ya están definidas por p5.js
// y son accesibles dentro del sketch. Para las funciones de overlay, las definimos
// globalmente o usamos las de p5.js si se llaman dentro del draw del sketch.
// Para evitar conflictos con p5.js, usaremos versiones globales para los overlays.
const TWO_PI_GLOBAL = Math.PI * 2;
const PI_GLOBAL = Math.PI;

function lerp(a, b, t) {
    return a + (b - a) * t;
}
function dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
function random(min, max) {
    if (max === undefined) {
        max = min;
        min = 0;
    }
    return Math.random() * (max - min) + min;
}
function abs(n) {
    return Math.abs(n);
}
function map(value, start1, stop1, start2, stop2, withinBounds) {
    const newval = ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
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
function atan2(y, x) {
    return Math.atan2(y, x);
}
function round(n) {
    return Math.round(n);
}


// --- P5.JS PRELOAD ---
function preload() {
    bgImage = loadImage("img/fondo2.jpg");
    explosionSound = loadSound("sonido/explosion.mp3"); // Asegurate de tener este archivo
}

// --- P5.JS SETUP ---
function setup() {
    createCanvas(windowWidth, windowHeight);
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(random(width), random(height)));
    }
}

// --- P5.JS DRAW ---
function draw() {
    background(0); // Limpia el fondo del canvas de p5.js
    image(bgImage, 0, 0, width, height); // Dibuja la imagen de fondo

    for (let p of particles) {
        p.update();
        p.show();
    }

    // Eliminar partículas de explosión ya desvanecidas
    particles = particles.filter(p => p.alpha > 0);

    // Si no quedan partículas de explosión activas, detené el sonido
    let stillExploding = particles.some(p => p.isExplosion && p.alpha > 0);
    if (!stillExploding && explosionSound.isPlaying()) {
        explosionSound.stop();
    }

    // Actualizar las variables globales de posición del mouse
    window.mouseX = mouseX;
    window.mouseY = mouseY;

    // Dibujar los overlays (se dibujan en sus propios canvases HTML)
    drawMenuEsferasHTML();
    drawGarabatoOverlay();
}

// --- CLASE PARTICLE (del código original) ---
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        let chance = random();
        if (chance < 0.2) {
            this.r = random(40, 60);
        } else if (chance < 0.6) {
            this.r = random(10, 30);
        } else {
            this.r = random(2, 10);
        }

        this.alpha = random(50, 150);
        this.noiseOffsetX = random(1000);
        this.noiseOffsetY = random(1000);

        this.vx = 0;
        this.vy = 0;
        this.isExplosion = false;
    }

    update() {
        if (this.isExplosion) {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.95;
            this.vy *= 0.95;
            this.alpha -= 2;
        } else {
            let moveAmount = 2;
            this.x += map(noise(this.noiseOffsetX), 0, 1, -moveAmount, moveAmount);
            this.y += map(noise(this.noiseOffsetY), 0, 1, -moveAmount, moveAmount);
            this.noiseOffsetX += 0.002;
            this.noiseOffsetY += 0.002;

            let d = dist(this.x, this.y, mouseX, mouseY);
            let mouseRadius = 100;
            if (d < mouseRadius) {
                let angle = atan2(this.y - mouseY, this.x - mouseX);
                let force = map(d, 0, mouseRadius, 2, 0);
                this.x += cos(angle) * force;
                this.y += sin(angle) * force;
            }
        }

        // Wrapping
        if (this.x > width + this.r) this.x = -this.r;
        if (this.x < -this.r) this.x = width + this.r;
        if (this.y > height + this.r) this.y = -this.r;
        if (this.y < -this.r) this.y = height + this.r;
    }

    show() {
        noStroke();
        fill(250, 235, 215, this.alpha);
        if (drawingContext) {
            drawingContext.shadowBlur = this.r * 2.5;
            drawingContext.shadowColor = color(90, 90, 90, this.alpha);
        }
        ellipse(this.x, this.y, this.r * 2);
    }
}

// --- P5.JS MOUSE PRESSED ---
function mousePressed() {
    // --- Lógica de navegación de overlays (PRIORIDAD AL MENÚ Y GARABATO) ---
    // CLICK SOBRE EL GARABATO OVERLAY
    const garabatoCanvas = document.getElementById('garabato-overlay');
    if (garabatoCanvas) {
        // Obtener la posición del mouse relativa al canvas del garabato
        const rect = garabatoCanvas.getBoundingClientRect();
        const mx_relative = mouseX - rect.left;
        const my_relative = mouseY - rect.top;

        // Centro del garabato en su propio canvas de 80x80
        const cx_garabato = garabatoCanvas.offsetWidth / 2;
        const cy_garabato = garabatoCanvas.offsetHeight / 2;
        const radio_garabato = 22; // Radio ajustado para el tamaño del icono

        const d_garabato = dist(mx_relative, my_relative, cx_garabato, cy_garabato);

        if (d_garabato < radio_garabato + 12) {
            window.location.href = "index.html"; // Redirige al universo de esferas
            return; // Detiene la ejecución si el clic fue en el garabato
        }
    }

    // CLICK SOBRE MENÚ DE ESFERAS
    const menuCanvas = document.getElementById('menu-esferas');
    if (menuCanvas) {
        // Coordenadas del mouse relativas a la ventana completa
        const mx_global = mouseX;
        const my_global = mouseY;

        const menuRadius = 14;
        const menuMargin = 18;
        const menuY = 30; // Posición Y de las esferas en el canvas del menú
        const menuXStart = 30; // Posición X de la primera esfera en el canvas del menú

        for (let i = 0; i < 4; i++) {
            const x_sphere = menuXStart + i * (menuRadius * 2 + menuMargin);
            const y_sphere = menuY;
            const d_sphere = dist(mx_global, my_global, x_sphere, y_sphere);

            if (d_sphere < menuRadius) {
                if (i === 0) {
                    window.location.href = "burbuja.html";
                    return;
                }
                if (i === 1) {
                    window.location.href = "agua.html";
                    return;
                }
                if (i === 2) {
                    window.location.href = "pantalla_zen.html";
                    return;
                }
                if (i === 3) {
                    window.location.href = "abismo.html";
                    return;
                }
            }
        }
    }

    // --- Lógica original de mousePressed para las partículas (solo si el clic no fue manejado por los overlays) ---
    let cantidad = 20;
    for (let i = 0; i < cantidad; i++) {
        let p = new Particle(mouseX, mouseY);
        let angle = random(TWO_PI);
        let speed = random(2, 5);
        p.vx = cos(angle) * speed;
        p.vy = sin(angle) * speed;
        p.isExplosion = true;
        particles.push(p);
    }

    if (explosionSound.isPlaying()) {
        explosionSound.stop();
    }
    explosionSound.play();
}

// --- P5.JS WINDOW RESIZED ---
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // Los overlays (menú y garabato) se redimensionan y redibujan con sus propios listeners globales
    drawGarabatoOverlay();
    drawMenuEsferasHTML();
}

// --- FUNCIÓN PARA DIBUJAR EL MENÚ EN OVERLAY SEPARADO ---
function drawMenuEsferasHTML() {
    const canvas = document.getElementById("menu-esferas");
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mostrar solo si el mouse está en el cuadrante superior izquierdo DE TODA LA PANTALLA
    if (window.mouseX < canvas.width / 2 && window.mouseY < canvas.height / 2) {
        const menuRadius = 14;
        const menuMargin = 18;
        const menuY = 30;
        const menuXStart = 30;

        for (let i = 0; i < 4; i++) {
            const x = menuXStart + i * (menuRadius * 2 + menuMargin);
            const y = menuY;

            ctx.beginPath();
            ctx.arc(x, y, menuRadius, 0, TWO_PI_GLOBAL); // Usar TWO_PI_GLOBAL
            
            // Colores: 3 beige/blancas y 1 violeta
            if (i < 3) { // Las primeras 3 esferas
                ctx.fillStyle = "#f5f5dc"; // Beige/blanca
            } else { // La última esfera
                ctx.fillStyle = "#a259f7"; // Violeta
            }

            ctx.shadowColor = "#000";
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// --- FUNCIÓN PARA MANEJAR CLICKS EN EL MENÚ ---
function handleMenuClick(event) {
    const canvas = document.getElementById("menu-esferas");
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX_local = event.clientX - rect.left; // Coordenadas locales al canvas del menú
    const mouseY_local = event.clientY - rect.top;

    // Solo procesar clicks si el mouse está en el cuadrante superior izquierdo del canvas
    if (mouseX_local < canvas.width / 2 && mouseY_local < canvas.height / 2) {
        const menuRadius = 14;
        const menuMargin = 18;
        const menuY = 30;
        const menuXStart = 30;

        for (let i = 0; i < 4; i++) {
            const x = menuXStart + i * (menuRadius * 2 + menuMargin);
            const y = menuY;
            const d = dist(mouseX_local, mouseY_local, x, y); // Usar dist global

            if (d < menuRadius) {
                if (i === 0) {
                    window.location.href = "burbuja.html";
                    return;
                }
                if (i === 1) {
                    window.location.href = "agua.html";
                    return;
                }
                if (i === 2) {
                    window.location.href = "pantalla_zen.html";
                    return;
                }
                if (i === 3) {
                    window.location.href = "abismo.html";
                    return;
                }
            }
        }
    }
}

// --- FUNCIÓN PARA DIBUJAR EL GARABATO EN OVERLAY SEPARADO ---
function drawGarabatoOverlay() {
    const canvas = document.getElementById("garabato-overlay");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Establecer el tamaño del canvas de dibujo al tamaño real del elemento DOM
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2; // Centro del garabato en su propio canvas
    const cy = canvas.height / 2; // Centro del garabato en su propio canvas
    const radio = 22; // Radio ajustado para el tamaño del icono (80x80)
    const numLineas = 14;
    const puntosPorLinea = 32;

    // Regenera los datos del garabato solo si el tamaño del canvas ha cambiado
    if (!garabatoData || canvas.width !== garabatoData.w || canvas.height !== garabatoData.h) {
        garabatoData = {
            w: canvas.width,
            h: canvas.height,
            lineas: generaGarabatoEsquinaCaotico(cx, cy, radio, numLineas, puntosPorLinea),
        };
    }

    // Obtener la posición del mouse relativa al canvas del garabato
    const rect = canvas.getBoundingClientRect();
    const mx_relative = window.mouseX - rect.left;
    const my_relative = window.mouseY - rect.top;

    const d = dist(mx_relative, my_relative, cx, cy);
    const hoverRadius = radio + 12;
    const t = constrain(1 - d / hoverRadius, 0, 1);

    const colorVal = round(lerp(255, 0, t)); // Blanco cuando lejos, negro cuando cerca
    ctx.save();
    ctx.strokeStyle = `rgba(${Math.round(colorVal)},${Math.round(colorVal)},${Math.round(colorVal)},${lerp(0.7, 0.95, t)})`; // Opacidad de 0.7 a 0.95
    ctx.lineWidth = 2;

    for (const linea of garabatoData.lineas) {
        ctx.beginPath();
        if (linea.length > 0) {
            ctx.moveTo(linea[0][0], linea[0][1]);
        }
        for (let i = 1; i < linea.length; i++) {
            const [x, y] = linea[i];
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    ctx.restore();
}

// --- FUNCIÓN AUXILIAR PARA GENERAR EL GARABATO CAÓTICO ---
function generaGarabatoEsquinaCaotico(cx, cy, radio, numLineas, puntosPorLinea) {
    const lineas = [];
    for (let j = 0; j < numLineas; j++) {
        const linea = [];
        let x = cx + random(-radio * 0.3, radio * 0.3); // Usar random global
        let y = cy + random(-radio * 0.3, radio * 0.3); // Usar random global
        linea.push([x, y]);
        for (let i = 1; i < puntosPorLinea; i++) {
            let ang = random(TWO_PI_GLOBAL); // Usar random y TWO_PI_GLOBAL
            const paso = random(radio * 0.15, radio * 0.5); // Usar random global
            if (random() < 0.7 && i > 1) { // Usar random global
                const prev = linea[i - 1];
                const prev2 = linea[i - 2];
                const angPrev = atan2(prev[1] - prev2[1], prev[0] - prev2[0]); // Usar atan2 global
                ang = angPrev + random(-PI_GLOBAL / 2, PI_GLOBAL / 2); // Usar random y PI_GLOBAL
            }
            x += Math.cos(ang) * paso;
            y += Math.sin(ang) * paso;
            x += (cx - x) * 0.07;
            y += (cy - y) * 0.07;
            const dx = x - cx;
            const dy = y - cy;
            const distAlCentro = Math.sqrt(dx * dx + dy * dy);
            if (distAlCentro > radio * 0.98) {
                const factor = (radio * 0.98) / distAlCentro;
                x = cx + dx * factor;
                y = cy + dy * factor;
            }
            linea.push([x, y]);
        }
        lineas.push(linea);
    }
    return lineas;
}

// --- INICIALIZACIÓN DE OVERLAYS Y LISTENERS GLOBALES ---
// Se aseguran de que los overlays se redibujen al cambiar el tamaño de la ventana
window.addEventListener('resize', () => {
    drawGarabatoOverlay();
    drawMenuEsferasHTML();
});

// Actualizar tanto el menú como el garabato en cada frame
function animateOverlays() {
    drawMenuEsferasHTML();
    drawGarabatoOverlay();
    requestAnimationFrame(animateOverlays);
}

// Iniciar los overlays después de un pequeño retraso para asegurar que el DOM esté listo
setTimeout(() => {
    animateOverlays();
}, 100);

document.addEventListener("DOMContentLoaded", () => {
    // Crear el elemento <main> si no existe (necesario para el p5.js canvas)
    if (!document.querySelector("main")) {
        const mainElement = document.createElement("main");
        mainElement.style.width = "100vw";
        mainElement.style.height = "100vh";
        mainElement.style.overflow = "hidden";
        mainElement.style.position = "relative";
        document.body.appendChild(mainElement);
    }

    // Crear el canvas para el menú si no existe
    if (!document.getElementById("menu-esferas")) {
        const menuCanvas = document.createElement("canvas");
        menuCanvas.id = "menu-esferas";
        menuCanvas.style.position = "fixed";
        menuCanvas.style.top = "0";
        menuCanvas.style.left = "0";
        menuCanvas.style.width = "100vw";
        menuCanvas.style.height = "100vh";
        menuCanvas.style.zIndex = "20"; // Z-index más alto que todo
        menuCanvas.style.pointerEvents = "auto"; // Permite que el mouse interactúe
        menuCanvas.addEventListener("click", handleMenuClick);
        document.body.appendChild(menuCanvas);
    }

    // Crear el canvas para el garabato si no existe
    if (!document.getElementById("garabato-overlay")) {
        const garabatoCanvas = document.createElement("canvas");
        garabatoCanvas.id = "garabato-overlay";
        garabatoCanvas.style.position = "fixed";
        garabatoCanvas.style.bottom = "20px";
        garabatoCanvas.style.right = "20px";
        garabatoCanvas.style.width = "80px"; // Tamaño fijo para el garabato
        garabatoCanvas.style.height = "80px"; // Tamaño fijo para el garabato
        garabatoCanvas.style.zIndex = "10";
        garabatoCanvas.style.cursor = "pointer";
        garabatoCanvas.addEventListener("click", () => {
            window.location.href = "index.html"; // Redirige al universo de esferas
        });
        document.body.appendChild(garabatoCanvas);
    }

    // Llamadas iniciales para dibujar los overlays una vez que el DOM está listo
    drawGarabatoOverlay();
    drawMenuEsferasHTML();
});