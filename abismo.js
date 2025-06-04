// --- VARIABLES GLOBALES (accesibles por todos los componentes) ---
// Variables específicas del sketch de Abismo
let symbols = [];
let popups = [];
let clickCount = 0;
let baseSpeed = 1;
let maxSpeedReached = false;
const messages = [
    "Demasiados datos",
    "¿Aceptás compartir todos tus datos?",
    "ERROR 503: Servicio saturado",
    "Advertencia: actividad inusual detectada",
    "Sin privacidad",
    "Descargando identidad...",
    "Verificando comportamiento...",
    "ERROR: No podés cerrar esto",
];
let messageIndex = 0;
let lastChange = 0;
const maxPopups = 50;
let isSaturated = false;
let isOverwhelmed = false; // NUEVO ESTADO
let specialPopup = null;

// Variables para el menú y garabato overlays
let garabatoData = null; // Para almacenar los datos del garabato
window.mouseX = 0; // Para el seguimiento global del mouse
window.mouseY = 0; // Para el seguimiento global del mouse

// --- FUNCIONES AUXILIARES (RE-IMPLEMENTACIONES DE P5.JS PARA USO GLOBAL) ---
// Estas funciones son necesarias para que los overlays (que no son parte del sketch de p5.js)
// puedan usar utilidades matemáticas como dist, lerp, random, etc.
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
// Constantes matemáticas
const TWO_PI = Math.PI * 2;
const PI = Math.PI;


// --- SKETCH DE P5.JS (MODO INSTANCIA) ---
const sketch = (p) => {
    // Las variables del sketch ahora son locales a esta instancia de p5.js
    // y se accede a ellas a través de 'p.' (ej. p.width, p.random)
    // Las variables globales definidas arriba (garabatoData, window.mouseX/Y, etc.)
    // siguen siendo accesibles directamente.

    class Symbol {
        constructor(x, y, speed, size) {
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.size = size;
            this.value = this.getRandomChar();
        }

        getRandomChar() {
            const chars = "01";
            return chars.charAt(p.floor(p.random(chars.length)));
        }

        update() {
            this.y += this.speed;
            if (this.y > p.height) this.y = 0;
            if (p.frameCount % 5 === 0) {
                this.value = this.getRandomChar();
            }
        }

        draw() {
            p.fill(200, 100, 255); // Color violeta para los símbolos
            p.textSize(this.size);
            p.text(this.value, this.x, this.y);
            this.update();
        }
    }

    class Stream {
        constructor(x, symbolSize) {
            this.symbols = [];
            const numSymbols = p.floor(p.random(5, 20));
            const speed = baseSpeed + p.random(0.5, 1.5);
            for (let i = 0; i < numSymbols; i++) {
                this.symbols.push(new Symbol(x, i * -symbolSize, speed, symbolSize));
            }
        }

        render() {
            for (const s of this.symbols) {
                s.draw();
            }
        }
    }

    class Popup {
        constructor(x, y, message) {
            this.x = x;
            this.y = y;
            this.w = 220;
            this.h = 120;
            this.message = message;
            this.isSpecial = false;
        }

        move() {
            this.x += p.random(-2, 2);
            this.y += p.random(-2, 2);
        }

        display() {
            p.fill(40, 0, 60, 230); // Fondo oscuro del popup
            p.stroke(180, 100, 255); // Borde violeta del popup
            p.strokeWeight(2);
            p.rect(this.x, this.y, this.w, this.h, 5);

            p.noStroke();
            p.fill(220, 180, 255); // Texto violeta claro
            p.textSize(14);
            p.textAlign(p.LEFT, p.TOP);
            p.text(this.message, this.x + 10, this.y + 10, this.w - 20);

            if (!this.isSpecial) {
                p.fill(220, 160, 255); // Botones normales (violeta claro)
                p.rect(this.x + 20, this.y + this.h - 30, 80, 20, 3);
                p.rect(this.x + 120, this.y + this.h - 30, 80, 20, 3);

                p.fill(40, 0, 60); // Texto de botón oscuro
                p.textSize(12);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("Aceptar", this.x + 60, this.y + this.h - 20);
                p.text("Rechazar", this.x + 160, this.y + this.h - 20);
            } else {
                p.fill(200, 100, 255); // Botones especiales (violeta más intenso)
                p.rect(this.x + 40, this.y + this.h - 40, 60, 30, 5);
                p.rect(this.x + 120, this.y + this.h - 40, 60, 30, 5);

                p.fill(255); // Texto de botón blanco
                p.textSize(16);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("Sí", this.x + 70, this.y + this.h - 25);
                p.text("No", this.x + 150, this.y + this.h - 25);
            }
        }

        checkClick(mx, my) {
            if (!this.isSpecial) return null;
            if (mx > this.x + 40 && mx < this.x + 100 && my > this.y + this.h - 40 && my < this.y + this.h - 10) {
                return 'yes';
            }
            if (mx > this.x + 120 && mx < this.x + 180 && my > this.y + this.h - 40 && my < this.y + this.h - 10) {
                return 'no';
            }
            return null;
        }
    }

    function reset() {
        symbols = [];
        popups = [];
        messageIndex = 0;
        lastChange = 0;
        isSaturated = false;
        isOverwhelmed = false;
        specialPopup = null;

        let symbolSize = 20;
        for (let i = 0; i <= p.width / symbolSize; i++) {
            symbols.push(new Stream(i * symbolSize, symbolSize));
        }
    }

    function generateGlitchText() {
        const chars = "!@#$%^&*()_+{}[]<>?/|~¥£¢§Δ≠Ω≈π✓∂≡√◊◦";
        let text = "";
        let len = Math.floor(Math.random() * 15) + 5;
        for (let i = 0; i < len; i++) {
            text += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return text;
    }

    p.setup = () => {
        const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
        cnv.parent(document.querySelector("main")); // Asegura que el canvas de p5.js esté dentro de <main>
        cnv.elt.style.position = "fixed";
        cnv.elt.style.top = "0";
        cnv.elt.style.left = "0";
        cnv.elt.style.zIndex = "1"; // Z-index menor que los overlays

        p.background(0); // Fondo inicial negro

        p.textFont('monospace');
        reset();
    };

    p.draw = () => {
        // Actualizar las variables globales de posición del mouse
        window.mouseX = p.mouseX;
        window.mouseY = p.mouseY;

        // Limpiar el fondo en cada frame
        p.background(0);

        if (isOverwhelmed) {
            // MODO DE COLAPSO CAÓTICO
            for (let i = 0; i < 5; i++) {
                let msg = generateGlitchText();
                popups.push(new Popup(p.random(p.width), p.random(p.height), msg));
            }

            for (let popup of popups) {
                popup.move();
                popup.display();
            }

            for (let i = 0; i < 50; i++) {
                p.stroke(p.random(150, 255), p.random(100, 200), p.random(200, 255)); // Ruido en tonos violetas/azulados
                p.point(p.random(p.width), p.random(p.height));
            }

            p.fill(255, 0, 100); // Texto de error magenta
            p.textSize(64);
            p.textAlign(p.CENTER, p.CENTER);
            if (p.frameCount % 20 < 10) {
                p.text("¡ERROR FATAL!", p.width / 2 + p.random(-10, 10), p.height / 2 + p.random(-10, 10));
            }
        } else {
            // LÓGICA NORMAL O SATURADA
            if (isSaturated) {
                // Si está saturado, muestra el fondo de ruido violeta
                for (let i = 0; i < 1000; i++) {
                    p.stroke(p.random(150, 200), p.random(100, 150), p.random(200, 255)); // Ruido en tonos violetas/azulados
                    p.point(p.random(p.width), p.random(p.height));
                }
            } else {
                // Estado normal: Fondo translúcido para el efecto de lluvia
                p.background(0, 100);
            }

            for (let stream of symbols) {
                stream.render();
            }

            if (!isSaturated && maxSpeedReached) {
                if (p.millis() - lastChange > 500) {
                    lastChange = p.millis();
                    let glitchMsg = generateGlitchText();
                    popups.push(new Popup(p.random(p.width), p.random(p.height), glitchMsg));
                }

                for (let popup of popups) {
                    popup.move();
                    popup.display();
                }

                if (popups.length > maxPopups) {
                    isSaturated = true;
                    specialPopup = new Popup(p.width / 2 - 110, p.height / 2 - 60, "¿Ahora sí querés compartir tus datos?");
                    specialPopup.isSpecial = true;
                }
            } else if (isSaturated) {
                if (specialPopup) {
                    specialPopup.display();
                }
            }
        }

        // Dibuja el cursor personalizado (si no está en modo colapso)
        if (!isOverwhelmed) {
            p.noStroke();
            p.fill(200, 100, 255, 180); // Color violeta para el cursor
            p.ellipse(p.mouseX, p.mouseY, 12, 12);
        }

        // Dibuja los overlays (siempre encima de todo lo demás)
        drawMenuEsferasHTML();
        drawGarabatoOverlay();
    };

    p.mousePressed = () => {
        // --- Lógica de navegación de overlays (PRIORIDAD AL MENÚ Y GARABATO) ---
        // CLICK SOBRE EL GARABATO OVERLAY
        const garabatoCanvas = document.getElementById('garabato-overlay');
        if (garabatoCanvas) {
            const rect = garabatoCanvas.getBoundingClientRect();
            // Coordenadas globales del centro del garabato
            const cx_global = rect.left + garabatoCanvas.offsetWidth / 2;
            const cy_global = rect.top + garabatoCanvas.offsetHeight / 2;
            const radio_garabato = 22; // Radio del garabato (ajustado para el tamaño del icono)

            // Coordenadas del mouse relativas a la ventana completa (p.mouseX ya es global)
            const mx_global = p.mouseX;
            const my_global = p.mouseY;

            const d_garabato = dist(mx_global, my_global, cx_global, cy_global);

            if (d_garabato < radio_garabato + 12) {
                window.location.href = "index.html"; // Redirige al universo de esferas
                return; // Detiene la ejecución si el clic fue en el garabato
            }
        }

        // CLICK SOBRE MENÚ DE ESFERAS
        const menuCanvas = document.getElementById('menu-esferas');
        if (menuCanvas) {
            // Coordenadas del mouse relativas a la ventana completa
            const mx_global = p.mouseX;
            const my_global = p.mouseY;

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
                        window.location.href = "reloj.html";
                        return;
                    }
                    if (i === 1) {
                        window.location.href = "scroll_infinito.html";
                        return;
                    }
                    if (i === 2) {
                        window.location.href = "aburrimiento.html"; // Página de conexiones
                        return;
                    }
                    if (i === 3) {
                        window.location.href = "particulas.html";
                        return;
                    }
                }
            }
        }

        // --- Lógica del juego (solo si el clic no fue manejado por los overlays) ---
        if (isOverwhelmed) return;

        clickCount++;
        baseSpeed = p.min(20, baseSpeed + 0.5);
        reset();

        if (!maxSpeedReached && baseSpeed >= 10) {
            maxSpeedReached = true;
        }

        if (maxSpeedReached && !isSaturated) {
            let glitchMsg = generateGlitchText();
            popups.push(new Popup(p.mouseX, p.mouseY, glitchMsg));
        } else if (specialPopup) {
            let clicked = specialPopup.checkClick(p.mouseX, p.mouseY);
            if (clicked === 'yes') {
                clickCount = 0;
                baseSpeed = 1;
                maxSpeedReached = false;
                reset();
            } else if (clicked === 'no') {
                isOverwhelmed = true;
                popups = [];
            }
        }
    };

    p.mouseMoved = () => {
        if (!isSaturated && !isOverwhelmed && maxSpeedReached && p.random() < 0.1) {
            let glitchMsg = generateGlitchText();
            popups.push(new Popup(p.mouseX + p.random(-100, 100), p.mouseY + p.random(-100, 100), glitchMsg));
        }
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        reset();
        // Los overlays (menú y garabato) se redimensionan y redibujan con sus propios listeners globales
        drawGarabatoOverlay();
        drawMenuEsferasHTML();
    };
};

// Inicia el sketch de p5.js
new p5(sketch);

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
            ctx.arc(x, y, menuRadius, 0, 2 * Math.PI);

            if (i === 3) {
                ctx.fillStyle = "#f5f5dc"; // Color beige/blanca
            } else {
                ctx.fillStyle = "#a259f7"; // Color violeta
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
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Solo procesar clicks si el mouse está en el cuadrante superior izquierdo
    if (mouseX < canvas.width / 2 && mouseY < canvas.height / 2) {
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
                    window.location.href = "scroll_infinito.html";
                    return;
                }
                if (i === 2) {
                    window.location.href = "aburrimiento.html";
                    return;
                }
                if (i === 3) {
                    window.location.href = "particulas.html";
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

    // Ajusta el tamaño del canvas overlay a sus dimensiones CSS (80x80px)
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Centro del garabato DENTRO de su propio canvas (80x80px)
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radio = 22; // Radio del garabato (ajustado para el tamaño del icono)
    const numLineas = 14;
    const puntosPorLinea = 32;

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

function generaGarabatoEsquinaCaotico(cx, cy, radio, numLineas, puntosPorLinea) {
    const lineas = [];
    for (let j = 0; j < numLineas; j++) {
        const linea = [];
        let x = cx + random(-radio * 0.3, radio * 0.3);
        let y = cy + random(-radio * 0.3, radio * 0.3);
        linea.push([x, y]);
        for (let i = 1; i < puntosPorLinea; i++) {
            let ang = random(TWO_PI);
            const paso = random(radio * 0.15, radio * 0.5);
            if (random() < 0.7 && i > 1) {
                const prev = linea[i - 1];
                const prev2 = linea[i - 2];
                const angPrev = atan2(prev[1] - prev2[1], prev[0] - prev2[0]);
                ang = angPrev + random(-PI / 2, PI / 2);
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

// Configurar los overlays
window.addEventListener("resize", () => {
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
        garabatoCanvas.style.width = "80px";
        garabatoCanvas.style.height = "80px";
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
