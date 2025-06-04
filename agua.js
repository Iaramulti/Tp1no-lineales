// --- VARIABLES GLOBALES OPTIMIZADAS ---
let img;
let cols, rows;
let scale = 25; // Aumentado de 20 para menos vértices
let w = 1200; // Reducido de 1600
let h = 900;  // Reducido de 1200
let flying = 0;
let terrain;

let rotationX;
let rotationZ;
let autoRotate = false;
let zoom = 1; // Variable para el zoom

let hoverSound;
let hoverCooldown = 0;
let hoverActive = false;
let hoverTimeout = 0;
let backgroundSound;
let audioStarted = false;

// Variables para overlays optimizadas
let garabatoData = null;
window.mouseX = 0;
window.mouseY = 0;

// --- FUNCIONES AUXILIARES OPTIMIZADAS ---
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(x1, y1, x2, y2) { return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)); }
function random(min, max) {
    if (max === undefined) {
        max = min;
        min = 0;
    }
    return Math.random() * (max - min) + min;
}
function map(value, start1, stop1, start2, stop2) {
    return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2;
}
function constrain(n, low, high) {
    return Math.max(Math.min(n, high), low);
}
const TWO_PI_GLOBAL = Math.PI * 2;
const PI_GLOBAL = Math.PI;

// --- MENÚ OPTIMIZADO ---
let menuVisible = false;
let lastMenuCheck = 0;

function drawMenuEsferasHTML() {
    const canvas = document.getElementById('menu-esferas');
    if (!canvas) return;
    
    // Optimización: solo verificar visibilidad cada 100ms
    const now = Date.now();
    if (now - lastMenuCheck > 100) {
        menuVisible = window.mouseX < window.innerWidth / 2 && window.mouseY < window.innerHeight / 2;
        lastMenuCheck = now;
    }
    
    if (!menuVisible) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const menuRadius = 14;
    const menuMargin = 18;
    const menuY = 30;
    const menuXStart = 30;
    
    for (let i = 0; i < 4; i++) {
        let x = menuXStart + i * (menuRadius * 2 + menuMargin);
        let y = menuY;
        ctx.beginPath();
        ctx.arc(x, y, menuRadius, 0, 2 * Math.PI);
        // Las 3 primeras blancas, la última verde
        ctx.fillStyle = (i < 3) ? "#fff" : "#00ff50";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// --- GARABATO OPTIMIZADO ---
let garabatoUpdateCounter = 0;

function generaGarabatoEsquinaCaotico(cx, cy, radio, numLineas, puntosPorLinea) {
    let lineas = [];
    for (let j = 0; j < numLineas; j++) {
        let linea = [];
        let x = cx + random(-radio * 0.3, radio * 0.3);
        let y = cy + random(-radio * 0.3, radio * 0.3);
        linea.push([x, y]);
        
        for (let i = 1; i < puntosPorLinea; i++) {
            let ang = random(TWO_PI_GLOBAL);
            let paso = random(radio * 0.15, radio * 0.5);
            
            if (random() < 0.7 && i > 1) {
                let prev = linea[i - 1];
                let prev2 = linea[i - 2];
                let angPrev = Math.atan2(prev[1] - prev2[1], prev[0] - prev2[0]);
                ang = angPrev + random(-PI_GLOBAL / 2, PI_GLOBAL / 2);
            }
            
            x += Math.cos(ang) * paso;
            y += Math.sin(ang) * paso;
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

function drawGarabatoOverlay() {
    const canvas = document.getElementById('garabato-overlay');
    if (!canvas) return;
    
    // Optimización: actualizar menos frecuentemente
    garabatoUpdateCounter++;
    if (garabatoUpdateCounter % 2 !== 0) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width - 45;
    const cy = canvas.height - 45;
    const radio = 36;
    const numLineas = 10; // Reducido de 14
    const puntosPorLinea = 24; // Reducido de 32

    if (!garabatoData || canvas.width !== garabatoData.w || canvas.height !== garabatoData.h) {
        garabatoData = {
            w: canvas.width,
            h: canvas.height,
            lineas: generaGarabatoEsquinaCaotico(cx, cy, radio, numLineas, puntosPorLinea)
        };
    }

    let mx = window.mouseX || -1000;
    let my = window.mouseY || -1000;
    const d = dist(mx, my, cx, cy);
    const hoverRadius = radio + 12;
    let t = constrain(1 - d / hoverRadius, 0, 1);

    const colorVal = Math.round(lerp(255, 0, t));
    ctx.strokeStyle = `rgb(${colorVal},${colorVal},${colorVal})`;
    ctx.globalAlpha = lerp(0.7, 0.95, t);
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
}

// --- SKETCH P5.JS OPTIMIZADO ---
const sketch = (p) => {
    let frameCounter = 0;

    p.preload = () => {
        // Cargar audio de forma más robusta
        p.soundFormats('mp3');
        try {
            backgroundSound = p.loadSound('sonido/fondo.mp3', 
                () => console.log('Background sound loaded successfully'),
                (err) => console.error('Error loading background sound:', err)
            );
            hoverSound = p.loadSound('sonido/hover.mp3',
                () => console.log('Hover sound loaded successfully'),
                (err) => console.error('Error loading hover sound:', err)
            );
            img = p.loadImage('img/text2.jpg');
        } catch (error) {
            console.error('Error in preload:', error);
        }
    };

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        cols = Math.floor(w / scale);
        rows = Math.floor(h / scale);

        // Inicializar terreno optimizado
        terrain = [];
        for (let i = 0; i < cols; i++) {
            terrain[i] = new Array(rows).fill(0);
        }

        rotationX = p.PI / 2;
        rotationZ = 0;
    };

    p.draw = () => {
        frameCounter++;
        
        // Optimización: actualizar terreno menos frecuentemente
        if (frameCounter % 2 === 0) {
            flying -= 0.03;
            let yoff = flying;

            for (let y = 0; y < rows; y++) {
                let xoff = 3;
                for (let x = 0; x < cols; x++) {
                    let base = p.map(p.noise(xoff, yoff), 0, 1, -100, 100);
                    terrain[x][y] = p.lerp(terrain[x][y], base, 0.15); // Interpolación más rápida
                    xoff += 0.05; // Incremento ligeramente mayor para menos detalle
                }
                yoff += 0.05;
            }
        }

        p.background(250, 235, 215);
        p.noStroke();
        p.translate(0, 5);
        p.scale(zoom); // Aplicar zoom
        p.rotateX(rotationX);
        p.rotateZ(rotationZ);
        p.translate(-w / 2, -h / 2);

        // Renderizar terreno optimizado
        for (let y = 0; y < rows - 1; y++) {
            p.beginShape(p.TRIANGLE_STRIP);
            p.textureMode(p.NORMAL);
            p.texture(img);
            for (let x = 0; x < cols; x++) {
                let u = x / cols;
                let v1 = y / rows;
                let v2 = (y + 1) / rows;
                p.vertex(x * scale, y * scale, terrain[x][y], u, v1);
                p.vertex(x * scale, (y + 1) * scale, terrain[x][y + 1], u, v2);
            }
            p.endShape();
        }

        // Control de audio optimizado
        if (hoverTimeout > 0) {
            hoverTimeout--;
        } else if (hoverActive && hoverSound && hoverSound.isPlaying()) {
            hoverSound.stop();
            hoverActive = false;
        }

        if (hoverCooldown > 0) {
            hoverCooldown--;
        }
    };

    // Función mejorada para iniciar audio
    function startAudioAndSounds() {
        if (audioStarted) return;
        
        console.log('Attempting to start audio...');
        
        // Usar userStartAudio de p5.js que es más confiable
        p.userStartAudio().then(() => {
            console.log('Audio context started successfully');
            
            // Configurar sonido de fondo
            if (backgroundSound && backgroundSound.isLoaded()) {
                try {
                    backgroundSound.setLoop(true);
                    backgroundSound.setVolume(0.3);
                    backgroundSound.play();
                    console.log('Background sound playing');
                } catch (error) {
                    console.error('Error playing background sound:', error);
                }
            }
            
            // Configurar sonido hover
            if (hoverSound && hoverSound.isLoaded()) {
                try {
                    hoverSound.setVolume(0.2);
                    console.log('Hover sound configured');
                } catch (error) {
                    console.error('Error configuring hover sound:', error);
                }
            }
            
            audioStarted = true;
        }).catch(err => {
            console.error('Error starting audio context:', err);
        });
    }

    p.mouseDragged = () => {
        startAudioAndSounds();
        if (p.mouseButton === p.LEFT) {
            autoRotate = false;
            let dx = p.movedX * 0.01;
            let dy = p.movedY * 0.01;
            rotationZ += dx;
            rotationX += dy;
        }
    };

    p.mouseReleased = () => {
        autoRotate = true;
    };

    p.mousePressed = () => {
        startAudioAndSounds();
    };

    p.mouseMoved = () => {
        if (!p.width || !p.height) return;

        let mx = p.mouseX - p.width / 3;
        let my = p.mouseY - p.height / 3;
        let angle = p.PI / 3;
        let rotatedY = my * p.cos(angle);

        let xIndex = p.floor((mx + w / 2) / scale);
        let yIndex = p.floor((rotatedY + h / 2) / scale);

        let radius = 4; // Reducido de 5
        let hovered = false;

        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                let xi = xIndex + i;
                let yj = yIndex + j;
                if (xi >= 0 && xi < cols && yj >= 0 && yj < rows) {
                    let distSq = i * i + j * j;
                    let maxDistSq = radius * radius;
                    let strength = p.exp(-distSq / (maxDistSq * 0.5)) * 25; // Reducido de 30
                    terrain[xi][yj] -= strength;
                    hovered = true;
                }
            }
        }

        if (hovered) {
            hoverTimeout = 15;
            if (hoverSound && hoverSound.isLoaded() && !hoverSound.isPlaying() && hoverCooldown === 0 && audioStarted) {
                try {
                    hoverSound.play();
                    hoverActive = true;
                    hoverCooldown = 20;
                } catch (error) {
                    console.error('Error playing hover sound:', error);
                }
            }
        }
    };

    // Permitir zoom con la rueda del mouse
    p.mouseWheel = (event) => {
        zoom += event.deltaY * -0.001;
        zoom = constrain(zoom, 0.3, 3); // Limitar el zoom
        return false; // Prevenir scroll de la página
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};

// Iniciar sketch
let p5Instance = new p5(sketch);

// --- EVENT LISTENERS OPTIMIZADOS ---
let animationId;

function animateMenuEsferas() {
    drawMenuEsferasHTML();
    animationId = requestAnimationFrame(animateMenuEsferas);
}

// Optimizar intervalos
setInterval(drawGarabatoOverlay, 50); // Reducido de 30ms
animateMenuEsferas();

window.addEventListener('resize', () => {
    drawGarabatoOverlay();
    drawMenuEsferasHTML();
});

// Event listeners para navegación
document.addEventListener('DOMContentLoaded', function() {
    const menuCanvas = document.getElementById('menu-esferas');
    if (menuCanvas) {
        menuCanvas.addEventListener('mousedown', function(e) {
            if (!(window.mouseX < window.innerWidth / 2 && window.mouseY < window.innerHeight / 2)) {
                return;
            }
            
            const rect = this.getBoundingClientRect();
            const mouseXc = e.clientX - rect.left;
            const mouseYc = e.clientY - rect.top;
            const menuRadius = 14;
            const menuMargin = 18;
            const menuY = 30;
            const menuXStart = 30;

            const pages = ["burbuja.html", "particulas.html", "pantalla_zen.html", "huellas.html"];
            
            for (let i = 0; i < 4; i++) {
                let x = menuXStart + i * (menuRadius * 2 + menuMargin);
                let d = dist(mouseXc, mouseYc, x, menuY);
                if (d < menuRadius) {
                    window.location.href = pages[i];
                    return;
                }
            }
        });
    }

    const garabatoCanvas = document.getElementById('garabato-overlay');
    if (garabatoCanvas) {
        garabatoCanvas.addEventListener('mousedown', function(e) {
            const cx = window.innerWidth - 45;
            const cy = window.innerHeight - 45;
            const radio = 36;
            const d = dist(e.clientX, e.clientY, cx, cy);
            if (d < radio + 12) {
                window.location.href = "index.html";
            }
        });
    }

    window.addEventListener('mousemove', function(e) {
        window.mouseX = e.clientX;
        window.mouseY = e.clientY;
    });
});