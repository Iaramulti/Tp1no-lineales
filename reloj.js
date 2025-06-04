// Variables globales para las dimensiones iniciales del reloj principal
let initialSecondsRadius;
let initialMinutesRadius;
let initialHoursRadius;
let initialClockDiameter;

// Variables para la aceleración y la multiplicación de relojes
let speedMultiplier = 1; // Multiplicador de velocidad inicial (afecta manecillas)
let clocks = []; // Array para almacenar todos los objetos de reloj
let simulatedTime = 0; // Tiempo simulado en milisegundos, que se acelera

// --- NUEVA VARIABLE PARA LA VELOCIDAD DEL SONIDO DEL RELOJ ---
let currentRelojSoundRate = 1; // Controla la velocidad de reproducción de relojSound
const MAX_RELOJ_SOUND_RATE = 3.0; // Límite superior para la velocidad del sonido
const RELOJ_SOUND_RATE_INCREASE = 1.1; // Multiplicador de velocidad del sonido por clic
// --- FIN NUEVA VARIABLE ---

let clickCount = 0; // Contador de clics para la lógica de aparición de relojes

// Variables para la inversión de color
let colorInversionProgress = 0; // Progreso de la inversión de color (0 a 1)
let colorInversionActive = false; // Bandera para indicar si la inversión de color está activa
const INVERSION_TRIGGER_SPEED = 40; // Umbral de velocidad para iniciar la inversión de color
const INVERSION_TRIGGER_CLOCKS = 50; // Umbral de cantidad de relojes para iniciar la inversión de color
const COLOR_TRANSITION_STEP = 0.1; // Cuánto progresa la inversión de color con cada clic
const MAX_SPEED_CAP = 150; // Límite máximo para el speedMultiplier

// Variables para la desaparición/reaparición de relojes
let lastClickTime = 0; // Tiempo del último clic
const IDLE_TIME_THRESHOLD = 3000; // Tiempo de inactividad (en ms) para que los relojes empiecen a desaparecer
let shrinkingClocksActive = false; // Bandera para indicar si los relojes están encogiéndose

// Array para los efectos visuales de clic (corazones/likes)
let clickEffects = [];

// Variables para los sonidos
let relojSound; // Sonido de fondo constante
let ansiedadSound; // Sonido de ansiedad que se activa y modula

// --- VARIABLES PARA EL ESTADO DE CARGA ---
let assetsLoaded = false; // Indica si todos los recursos están cargados
let totalAssetsToLoad = 2; // Número total de assets a cargar (relojSound, ansiedadSound)
let assetsLoadedCount = 0; // Contador de assets cargados
// --- FIN VARIABLES DE ESTADO DE CARGA ---

// --- NUEVA VARIABLE PARA LA IMAGEN DE FONDO ---
let backgroundImage;
// --- FIN NUEVA VARIABLE ---

/**
 * Función preload()
 * Se ejecuta antes de setup(). Se usa para cargar archivos de medios como imágenes y sonidos.
 */
function preload() {
  // Carga los sonidos y usa funciones de callback para saber cuándo están cargados
  // ASEGÚRATE DE QUE LAS RUTAS SEAN CORRECTAS (ej: 'reloj.mp3' si están en la misma carpeta)
  relojSound = loadSound('sonido/reloj.mp3', soundLoaded, soundError);
  ansiedadSound = loadSound('sonido/sonido_ansiedad.mp3', soundLoaded, soundError);

  // --- CARGAR LA IMAGEN DE FONDO AQUÍ ---
  // Reemplaza 'fondito.gif' con la ruta correcta a tu archivo de imagen
  backgroundImage = loadImage('img/fondito.gif');
  // --- FIN CARGA DE IMAGEN DE FONDO ---
}

// --- FUNCIONES DE CALLBACK PARA LA CARGA DE SONIDOS ---
function soundLoaded() {
  assetsLoadedCount++;
  console.log(`Asset cargado: ${assetsLoadedCount}/${totalAssetsToLoad}`);
  if (assetsLoadedCount === totalAssetsToLoad) {
    assetsLoaded = true;
    console.log("Todos los assets cargados. ¡Juego listo!");
  }
}

function soundError(error) {
  console.error("Error al cargar un sonido:", error);
  // Aunque haya un error, incrementamos el contador para no bloquear el inicio
  assetsLoadedCount++;
  if (assetsLoadedCount === totalAssetsToLoad) {
    assetsLoaded = true;
    console.log("Intentando cargar assets. Algunos fallaron, pero se puede continuar.");
  }
}
// --- FIN FUNCIONES DE CALLBACK ---

/**
 * Clase AcceleratedClock
 * Representa un reloj individual que puede dibujarse en cualquier posición y tamaño.
 */
class AcceleratedClock {
  /**
   * Constructor para crear una nueva instancia de reloj.
   * @param {number} x - La coordenada X del centro del reloj.
   * @param {number} y - La coordenada Y del centro del reloj.
   * @param {number} diameter - El diámetro del reloj.
   * @param {boolean} isMainClock - Indica si es el reloj principal (no se encoge).
   */
  constructor(x, y, diameter, isMainClock = false) {
    this.x = x;
    this.y = y;
    this.diameter = diameter;
    this.originalDiameter = diameter; // Almacena el diámetro original para el re-agrandamiento
    this.targetDiameter = diameter; // Diámetro objetivo para la animación de encogimiento/agrandamiento
    this.isMainClock = isMainClock; // Si es el reloj principal, no se encoge
    // Inicializa los radios de las manecillas
    let currentRadius = this.diameter / 1.7;
    this.secondsRadius = currentRadius * 0.71;
    this.minutesRadius = currentRadius * 0.6;
    this.hoursRadius = currentRadius * 0.5;
  }

  /**
   * Dibuja el reloj en el lienzo.
   * @param {number} currentSimulatedTime - El tiempo simulado actual en milisegundos.
   */
  display(currentSimulatedTime) {
    // Si el reloj está encogiéndose y su diámetro es muy pequeño, no lo dibujamos.
    if (this.targetDiameter === 0 && this.diameter < 1) {
      return;
    }

    push(); // Guarda el estado actual de la transformación
    translate(this.x, this.y); // Mueve el origen al centro de este reloj

    // Lógica de interpolación de color para mantener la diferenciación
    let faceValue;
    let lineValue;

    if (colorInversionProgress === 0) { // Explicitamente establecer colores iniciales
        faceValue = 255; // Cara blanca
        lineValue = 0;   // Líneas negras
    } else {
        faceValue = lerp(255, 0, colorInversionProgress); // Valor de la cara del reloj
        lineValue = 255 - faceValue; // Inverso para las líneas

        // Ajusta el valor de la línea para asegurar una diferenciación constante
        const colorOffset = 40; // Offset para asegurar la distinción en los tonos grises
        if (colorInversionProgress < 0.5) {
            // Cuando el fondo es más claro, las líneas deben ser más oscuras
            lineValue = max(0, lineValue - colorOffset);
        } else {
            // Cuando el fondo es más oscuro, las líneas deben ser más claras
            lineValue = min(255, lineValue + colorOffset);
        }
    }

    let currentFaceColor = color(faceValue); // Color de fondo del reloj
    let currentLineColor = color(lineValue); // Color de manecillas, bordes, marcas y números

    // Dibuja el fondo del reloj (color interpolado)
    noStroke(); // Sin borde para las formas de fondo
    fill(currentFaceColor); // Color de relleno interpolado para la cara del reloj
    ellipse(0, 0, this.diameter, this.diameter); // Círculo interior (cara del reloj)

    // Dibuja el borde exterior del reloj (color interpolado)
    stroke(currentLineColor); // Color del borde interpolado
    strokeWeight(1); // **AJUSTE: Grosor del borde más fino**
    noFill(); // Sin relleno para el borde
    ellipse(0, 0, this.diameter + 5, this.diameter + 5); // Círculo exterior ligeramente más grande para el borde

    // Calcula los ángulos para cada manecilla basado en el tiempo simulado
    let s = (currentSimulatedTime / 1000) % 60; // Segundos simulados (0-59)
    let m = (currentSimulatedTime / (1000 * 60)) % 60; // Minutos simulados (0-59)
    let h = (currentSimulatedTime / (1000 * 60 * 60)) % 12; // Horas simuladas (0-11)

    // Mapea los valores de tiempo a ángulos de 0 a 360 grados
    let secondAngle = map(s, 0, 60, 0, 360);
    let minuteAngle = map(m, 0, 60, 0, 360);
    let hourAngle = map(h, 0, 12, 0, 360);

    // Asegura que las manecillas tengan el color de línea actual
    stroke(currentLineColor);

    // Manecilla de segundos
    push();
    rotate(secondAngle); // Rota el lienzo al ángulo de los segundos
    strokeWeight(0.5); // **AJUSTE: Grosor de la manecilla de segundos más fino**
    line(0, 0, 0, -this.secondsRadius); // Dibuja la línea desde el centro hacia arriba
    pop(); // Restaura el estado de la transformación

    // Manecilla de minutos
    push();
    strokeWeight(1); // **AJUSTE: Grosor de la manecilla de minutos más fino**
    rotate(minuteAngle); // Rota el lienzo al ángulo de los minutos
    line(0, 0, 0, -this.minutesRadius); // Dibuja la línea desde el centro hacia arriba
    pop(); // Restaura el estado de la transformación

    // Manecilla de horas
    push();
    strokeWeight(2); // **AJUSTE: Grosor de la manecilla de horas más fino**
    rotate(hourAngle); // Rota el lienzo al ángulo de las horas
    line(0, 0, 0, -this.hoursRadius); // Dibuja la línea desde el centro hacia arriba
    pop(); // Restaura el estado de la transformación

    // Marcas de los segundos/minutos alrededor del perímetro del reloj (rayas)
    push();
    strokeWeight(0.75); // **AJUSTE: Grosor de las rayas más fino**
    for (let ticks = 0; ticks < 60; ticks += 1) {
      if (ticks % 5 === 0) { // Marcas más largas para las horas (cada 5 ticks)
        line(0, -this.secondsRadius, 0, -this.secondsRadius * 0.9);
      } else { // Marcas más cortas para los minutos/segundos
        line(0, -this.secondsRadius, 0, -this.secondsRadius * 0.95);
      }
      rotate(6); // Rota 6 grados para la siguiente marca (360/60 = 6)
    }
    pop(); // Restaura el estado de la transformación

    // --- SE HAN ELIMINADO LOS NÚMEROS PRINCIPALES (12, 3, 6, 9) ---
    // fill(currentLineColor);
    // noStroke();
    // textSize(this.diameter * 0.08);
    // textAlign(CENTER, CENTER);
    // push(); rotate(-90); text('12', 0, -this.secondsRadius * 0.82); pop();
    // push(); rotate(0); text('3', this.secondsRadius * 0.82, 0); pop();
    // push(); rotate(90); text('6', 0, this.secondsRadius * 0.82); pop();
    // push(); rotate(180); text('9', -this.secondsRadius * 0.82, 0); pop();
    // --- FIN DE ELIMINACIÓN ---

    pop(); // Restaura el estado de la transformación original antes de dibujar este reloj

    // Animación de encogimiento/agrandamiento
    if (this.diameter !== this.targetDiameter) {
      this.diameter = lerp(this.diameter, this.targetDiameter, 0.05); // Interpola gradualmente hacia el diámetro objetivo
      // Ajusta los radios de las manecillas en función del diámetro actual
      let currentRadius = this.diameter / 1.7;
      this.secondsRadius = currentRadius * 0.71;
      this.minutesRadius = currentRadius * 0.6;
      this.hoursRadius = currentRadius * 0.5;

      // Si el reloj está muy cerca de su targetDiameter, lo ajustamos para evitar oscilaciones
      if (abs(this.diameter - this.targetDiameter) < 0.1) {
        this.diameter = this.targetDiameter;
      }
    }
  }
}

/**
 * Clase ClickEffect
 * Representa el efecto visual de un clic (corazón wireframe).
 */
class ClickEffect {
  /**
   * Constructor para crear una nueva instancia de efecto de clic.
   * @param {number} x - La coordenada X inicial del efecto.
   * @param {number} y - La coordenada Y inicial del efecto.
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.alpha = 255; // Opacidad inicial
    this.size = 20; // Tamaño inicial
    this.yVelocity = random(-1, -3); // Velocidad vertical (hacia arriba)
    this.xVelocity = random(-1, 1); // Velocidad horizontal
  }

  /**
   * Actualiza el estado del efecto de clic.
   */
  update() {
    this.x += this.xVelocity;
    this.y += this.yVelocity;
    this.alpha -= 5; // Desvanece gradualmente
    this.size += 0.5; // Crece ligeramente
  }

  /**
   * Dibuja el efecto de clic en el lienzo.
   * --- DIBUJO DEL CORAZÓN WIREFRAME ---
   */
  display() {
    push();
    translate(this.x, this.y);
    scale(this.size / 20); // Escala el corazón para que se vea del tamaño deseado. Ajusta el divisor si es muy grande/pequeño.

    // Color del corazón (verde) y opacidad (alpha)
    stroke(255, 0, 255, this.alpha); // RGB para verde, con la opacidad actual
    strokeWeight(2); // Grosor de la línea del corazón
    noFill(); // No rellenar, solo el contorno (wireframe)

    // Dibuja un corazón simplificado. Para un corazón más "wireframe" como tu imagen,
    // necesitarías más puntos o usar una forma más compleja.
    beginShape();
    vertex(0, 0); // Centro
    bezierVertex(20, -20, 40, 20, 0, 40); // Lado derecho
    bezierVertex(-40, 20, -20, -20, 0, 0); // Lado izquierdo
    endShape(CLOSE);
    pop();
  }
}

/**
 * Función setup()
 * Se ejecuta una vez al inicio del sketch.
 * Configura el lienzo y las variables iniciales.
 */
function setup() {
  createCanvas(windowWidth, windowHeight); // Crea un lienzo que ocupa toda la ventana
  angleMode(DEGREES); // Establece el modo de ángulo a grados para facilitar los cálculos de rotación

  // Calcula las dimensiones iniciales para el primer reloj basado en el tamaño del lienzo
  // Reducimos el tamaño multiplicando por 0.6 para que sea más pequeño
  let radius = min(width, height) / 2;
  initialClockDiameter = radius * 1.7 * 0.6; // Reducido a 60% del tamaño original

  // Calcula los radios de las manecillas basados en el nuevo diámetro inicial
  let initialRadius = initialClockDiameter / 1.7;
  initialSecondsRadius = initialRadius * 0.71;
  initialMinutesRadius = initialRadius * 0.6;
  initialHoursRadius = initialRadius * 0.5;

  // Inicializa el primer reloj en el centro del lienzo, marcándolo como principal
  clocks.push(new AcceleratedClock(width / 2, height / 2, initialClockDiameter, true));

  // Establece el tiempo simulado inicial a la hora actual real.
  // Esto hace que el reloj comience con la hora actual antes de acelerarse.
  let now = new Date();
  simulatedTime = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) * 1000 + now.getMilliseconds();

  // Inicializa el tiempo del último clic
  lastClickTime = millis();

  // Descripción para accesibilidad
  describe('Múltiples relojes aparecen y se aceleran con los clics del ratón, con inversión de color y desaparición/reaparición al dejar de interactuar.');
}

/**
 * Función draw()
 * Se ejecuta continuamente en un bucle.
 * Actualiza el tiempo y dibuja todos los relojes.
 */
function draw() {
  // --- LÓGICA DE PANTALLA DE CARGA ---
  if (!assetsLoaded) {
    background(20); // Fondo oscuro para la pantalla de carga
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text('Cargando sonidos...', width / 2, height / 2 - 20);
    textSize(20);
    text(`(${assetsLoadedCount}/${totalAssetsToLoad})`, width / 2, height / 2 + 20);
    return; // Detiene la ejecución del resto de draw()
  }
  // --- FIN LÓGICA DE PANTALLA DE CARGA ---

  // --- INICIO AUTOMÁTICO DEL SONIDO DE RELOJ UNA VEZ QUE LOS ASSETS ESTÁN CARGADOS ---
  // Se asegura de que la imagen de fondo esté cargada también
  // Añadimos una verificación adicional por si backgroundImage.width no está disponible inmediatamente
  if (relojSound.isLoaded() && !relojSound.isPlaying() && backgroundImage && backgroundImage.width > 0) {
    relojSound.loop();
    relojSound.setVolume(0.2); // Volumen inicial
    console.log("Sonido de reloj iniciado automáticamente.");
  }
  // --- FIN INICIO AUTOMÁTICO ---

  // --- DIBUJAR LA IMAGEN DE FONDO ---
  // Asegúrate de que la imagen esté cargada antes de intentar dibujarla
  if (backgroundImage) {
    image(backgroundImage, 0, 0, width, height); // Dibuja la imagen para que ocupe todo el lienzo
  } else {
    // Si la imagen no se cargó, usa un fondo blanco por defecto
    background(255);
  }
  // --- FIN DIBUJAR LA IMAGEN DE FONDO ---

  // Actualiza el tiempo simulado en función del delta de tiempo (tiempo desde el último frame)
  // y el multiplicador de velocidad.
  simulatedTime += deltaTime * speedMultiplier;

  // Dibuja y actualiza todos los relojes en el array
  // Filtramos los relojes que se han encogido completamente
  clocks = clocks.filter(clock => !(clock.targetDiameter === 0 && clock.diameter < 1));
  for (let i = 0; i < clocks.length; i++) {
    clocks[i].display(simulatedTime);
  }

  // Actualiza y dibuja los efectos de clic
  for (let i = clickEffects.length - 1; i >= 0; i--) {
    clickEffects[i].update();
    clickEffects[i].display();
    if (clickEffects[i].alpha <= 0) {
      clickEffects.splice(i, 1); // Elimina los efectos que ya se desvanecieron
    }
  }

  // Lógica para la desaparición de relojes
  // Se activa si la inversión de color está completa Y el usuario ha estado inactivo
  if (colorInversionProgress >= 1.0 && millis() - lastClickTime > IDLE_TIME_THRESHOLD) {
    if (!shrinkingClocksActive) {
      console.log("Iniciando encogimiento de relojes...");
      shrinkingClocksActive = true;
      // Inicia el encogimiento para todos los relojes excepto el principal
      for (let i = 0; i < clocks.length; i++) {
        if (!clocks[i].isMainClock) {
          clocks[i].targetDiameter = 0; // Se encogerán hasta desaparecer
        }
      }
    }

    // --- LÓGICA DE DESACELERACIÓN Y DETENCIÓN AL FINAL ---
    // Desacelerar speedMultiplier y relojSoundRate
    speedMultiplier = lerp(speedMultiplier, 1, 0.02); // Vuelve a la velocidad normal
    currentRelojSoundRate = lerp(currentRelojSoundRate, 1, 0.02); // Vuelve a la velocidad normal del sonido
    if (abs(speedMultiplier - 1) < 0.01) speedMultiplier = 1; // Ajuste fino
    if (abs(currentRelojSoundRate - 1) < 0.01) currentRelojSoundRate = 1; // Ajuste fino

    // Aplicar la nueva velocidad al sonido del reloj
    if (relojSound.isLoaded()) {
      relojSound.rate(currentRelojSoundRate);
    }

    // Detener sonido de ansiedad si solo queda el reloj principal visible
    const nonMainClocksVisible = clocks.filter(c => c.diameter > 1 && !c.isMainClock);
    if (nonMainClocksVisible.length === 0) { // Si no quedan relojes secundarios visibles
      if (ansiedadSound.isPlaying()) {
        ansiedadSound.setVolume(lerp(ansiedadSound.getVolume(), 0, 0.05)); // Fade out rápido
        if (ansiedadSound.getVolume() < 0.01) {
          ansiedadSound.stop();
          console.log("Sonido de ansiedad detenido al finalizar experiencia.");
        }
      }
    }
    // --- FIN LÓGICA DE DESACELERACIÓN Y DETENCIÓN ---

  } else { // Si no estamos en la fase de encogimiento
      // Asegurarse de que el sonido de ansiedad NO se esté reduciendo si no debe
      if (ansiedadSound.isLoaded() && colorInversionActive && ansiedadSound.isPlaying()) {
        let targetVolume = map(colorInversionProgress, 0, 1, 0.1, 0.8);
        ansiedadSound.setVolume(lerp(ansiedadSound.getVolume(), targetVolume, 0.05));
      }
  }


  // Control de volumen para el sonido de ansiedad (cuando no está encogiéndose)
  if (ansiedadSound.isLoaded() && colorInversionActive && !shrinkingClocksActive) {
    if (!ansiedadSound.isPlaying()) {
      ansiedadSound.loop();
    }
    let targetVolume = map(colorInversionProgress, 0, 1, 0.1, 0.8); // Volumen base según el progreso de inversión
    ansiedadSound.setVolume(lerp(ansiedadSound.getVolume(), targetVolume, 0.05)); // Fade in al volumen objetivo
  } else if (ansiedadSound.isLoaded() && !colorInversionActive && ansiedadSound.isPlaying()) {
    // Si la inversión de color no está activa, asegura que el sonido de ansiedad esté detenido o en volumen 0
    ansiedadSound.setVolume(lerp(ansiedadSound.getVolume(), 0, 0.05));
    if (ansiedadSound.getVolume() < 0.01) {
      ansiedadSound.stop();
    }
  }

}

/**
 * Función mouseClicked()
 * Se ejecuta cada vez que el usuario hace clic con el ratón en el lienzo.
 * Acelera el tiempo y añade nuevos relojes.
 */
function mouseClicked() {
  if (!assetsLoaded) {
    // Si los assets no están cargados, ignora el clic
    return;
  }

  clickCount++; // Incrementa el contador de clics
  lastClickTime = millis(); // Reinicia el temporizador de inactividad

  // Si los relojes estaban encogiéndose, haz que vuelvan a crecer a su tamaño original
  if (shrinkingClocksActive) {
    console.log("Deteniendo encogimiento y haciendo crecer relojes...");
    shrinkingClocksActive = false; // Detiene el estado general de encogimiento
    // Restablece la velocidad y el rate del sonido de reloj a los valores actuales del juego
    // para que la aceleración continúe desde donde estaba
    speedMultiplier = min(speedMultiplier * 1.8, MAX_SPEED_CAP);
    currentRelojSoundRate = min(currentRelojSoundRate * RELOJ_SOUND_RATE_INCREASE, MAX_RELOJ_SOUND_RATE);

    for (let i = 0; i < clocks.length; i++) {
      if (!clocks[i].isMainClock) {
        clocks[i].targetDiameter = clocks[i].originalDiameter; // Establece el objetivo al tamaño original
      }
    }
    // Si el sonido de ansiedad se había detenido, pero la inversión de color sigue activa, lo reactivamos
    if (ansiedadSound.isLoaded() && colorInversionActive && !ansiedadSound.isPlaying()) {
        ansiedadSound.loop();
    }
  } else {
    // Si no estábamos en modo de encogimiento, simplemente aceleramos
    speedMultiplier = min(speedMultiplier * 1.8, MAX_SPEED_CAP); // Aumenta la velocidad en un 80% con cada clic, con un tope
    currentRelojSoundRate = min(currentRelojSoundRate * RELOJ_SOUND_RATE_INCREASE, MAX_RELOJ_SOUND_RATE);
  }

  console.log("Multiplicador de velocidad:", speedMultiplier);
  console.log("Velocidad sonido reloj:", currentRelojSoundRate);


  let numNewClocks = 0;

  // Lógica para añadir nuevos relojes basada en el contador de clics
  if (clickCount >= 8 && clickCount <= 10) {
    numNewClocks = 1; // Clics 8, 9 y 10 añaden 1 reloj
  } else if (clickCount > 10) {
    numNewClocks = clickCount - 9; // A partir del clic 11, añade (clickCount - 9) relojes (e.g., clic 11 añade 2, clic 12 añade 3)
  }
  // Para clickCount <= 7, numNewClocks permanece en 0 por defecto, lo que significa que no se añaden relojes nuevos por esta lógica.

  // Añade los nuevos relojes al array
  for (let i = 0; i < numNewClocks; i++) {
    let x, y, size;
    // La posición y el tamaño de los nuevos relojes siguen la lógica de dispersión existente
    // Tamaños variados: pequeños, medianos y grandes
    let randomSizeFactor = random(0.3, 1.5); // Factor para variar el tamaño
    size = initialClockDiameter * randomSizeFactor;

    x = random(-width * 0.2, width * 1.2); // Rango más amplio para que aparezcan por todo el lienzo
    y = random(-height * 0.2, height * 1.2);

    clocks.push(new AcceleratedClock(x, y, size));
  }

  // Verifica si la inversión de color debe comenzar
  if (!colorInversionActive && speedMultiplier >= INVERSION_TRIGGER_SPEED && clocks.length >= INVERSION_TRIGGER_CLOCKS) {
    colorInversionActive = true;
    console.log("Inversión de color activada!");
  }

  // Si la inversión de color está activa, progresa la transición de color con cada clic
  if (colorInversionActive) {
    colorInversionProgress = min(colorInversionProgress + COLOR_TRANSITION_STEP, 1.0);
    console.log("Progreso de inversión de color:", colorInversionProgress);
  }

  // Añade un efecto de clic (corazón/like)
  clickEffects.push(new ClickEffect(mouseX, mouseY));
}

/**
 * Función windowResized()
 * Se ejecuta cada vez que la ventana del navegador cambia de tamaño.
 * Ajusta el tamaño del lienzo y las dimensiones del reloj principal.
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Redimensiona el lienzo al tamaño de la ventana

  // Recalcula las dimensiones iniciales del reloj principal para que sea responsivo
  let radius = min(width, height) / 2;
  initialClockDiameter = radius * 1.7 * 0.6; // Reducido a 60% del tamaño original

  // Actualiza la posición y el diámetro del reloj principal (el primero en el array)
  if (clocks.length > 0) {
    clocks[0].x = width / 2;
    clocks[0].y = height / 2;
    clocks[0].diameter = initialClockDiameter;
    // También actualiza los radios internos de las manecillas del reloj principal
    let mainClockRadius = clocks[0].diameter / 1.7;
    clocks[0].secondsRadius = mainClockRadius * 0.71;
    clocks[0].minutesRadius = mainClockRadius * 0.6;
    clocks[0].hoursRadius = mainClockRadius * 0.5;
  }
}
// ... Tu código de p5.js y lógica de reloj aquí (setup, draw, clases, etc) ...

// --- MENÚ DESPLEGABLE (ESQUINA SUPERIOR IZQUIERDA) ---
function drawMenuEsferasHTML() {
  const canvas = document.getElementById('menu-esferas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Solo dibuja si el mouse está en el cuadrante superior izquierdo de la pantalla
  let show = false;
  if (typeof window.mouseX !== "undefined" && typeof window.mouseY !== "undefined") {
    if (window.mouseX >= 0 && window.mouseY >= 0 &&
        window.mouseX < window.innerWidth/2 && window.mouseY < window.innerHeight/2) {
      show = true;
    }
  }
  if (!show) return;

  const menuRadius = 14;
  const menuMargin = 18;
  const menuY = 30;
  const menuXStart = 30;
  for (let i = 0; i < 4; i++) {
    let x = menuXStart + i * (menuRadius * 2 + menuMargin);
    let y = menuY;
    ctx.beginPath();
    ctx.arc(x, y, menuRadius, 0, 2 * Math.PI);
    ctx.fillStyle = (i === 3) ? "#fff" : "#a259f7"; // 3 violetas, 1 blanca
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
function animateMenuEsferas() {
  drawMenuEsferasHTML();
  requestAnimationFrame(animateMenuEsferas);
}
animateMenuEsferas();

document.getElementById('menu-esferas').addEventListener('mousedown', function(e) {
  // Solo si el mouse está en el cuadrante superior izquierdo
  if (!(window.mouseX >= 0 && window.mouseY >= 0 &&
      window.mouseX < window.innerWidth/2 && window.mouseY < window.innerHeight/2)) {
    return;
  }
  const rect = this.getBoundingClientRect();
  const mouseXc = e.clientX - rect.left;
  const mouseYc = e.clientY - rect.top;
  const menuRadius = 14;
  const menuMargin = 18;
  const menuY = 30;
  const menuXStart = 30;

  let x = menuXStart + 0 * (menuRadius * 2 + menuMargin);
  let y = menuY;
  let d = Math.sqrt((mouseXc - x) ** 2 + (mouseYc - y) ** 2);
  if (d < menuRadius) {
    window.location.href = "scroll_infinito.html";
    return;
  }
  x = menuXStart + 1 * (menuRadius * 2 + menuMargin);
  d = Math.sqrt((mouseXc - x) ** 2 + (mouseYc - y) ** 2);
  if (d < menuRadius) {
    window.location.href = "abismo.html";
    return;
  }
  x = menuXStart + 2 * (menuRadius * 2 + menuMargin);
  d = Math.sqrt((mouseXc - x) ** 2 + (mouseYc - y) ** 2);
  if (d < menuRadius) {
    window.location.href = "aburrimiento.html";
    return;
  }
  x = menuXStart + 3 * (menuRadius * 2 + menuMargin);
  d = Math.sqrt((mouseXc - x) ** 2 + (mouseYc - y) ** 2);
  if (d < menuRadius) {
    window.location.href = "burbuja.html";
    return;
  }
});

// --- GARABATO OVERLAY (ESQUINA INFERIOR DERECHA) ---
let garabatoData = null;
function drawGarabatoOverlay() {
  const canvas = document.getElementById('garabato-overlay');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
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

  // Mouse relativo al overlay
  let mx = window.mouseX, my = window.mouseY;
  if (mx === undefined || my === undefined) {
    mx = -1000; my = -1000;
  }
  const rect = canvas.getBoundingClientRect();
  mx -= rect.left;
  my -= rect.top;
  const d = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
  const hoverRadius = radio + 12;
  let t = Math.max(0, Math.min(1, 1 - d / hoverRadius));

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
    let x = cx + Math.random() * radio * 0.6 - radio * 0.3;
    let y = cy + Math.random() * radio * 0.6 - radio * 0.3;
    linea.push([x, y]);
    for (let i = 1; i < puntosPorLinea; i++) {
      let ang = Math.random() * Math.PI * 2;
      let paso = Math.random() * (radio * 0.35) + radio * 0.15;
      if (Math.random() < 0.7 && i > 1) {
        let prev = linea[i - 1];
        let prev2 = linea[i - 2];
        let angPrev = Math.atan2(prev[1] - prev2[1], prev[0] - prev2[0]);
        ang = angPrev + (Math.random() - 0.5) * Math.PI;
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
window.addEventListener('resize', drawGarabatoOverlay);
setInterval(drawGarabatoOverlay, 30);

document.getElementById('garabato-overlay').addEventListener('mousedown', function(e) {
  const rect = this.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const radio = 36;
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const d = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
  if (d < radio + 12) {
    window.location.href = "index.html"; // universo de esferas
  }
});

// Utilidad para interpolar (igual que p5.js)
function lerp(a, b, t) { return a + (b - a) * t; }

// --- TRACK GLOBAL MOUSE POSITION ---
window.mouseX = 0;
window.mouseY = 0;
window.addEventListener('mousemove', function(e) {
  window.mouseX = e.clientX;
  window.mouseY = e.clientY;
});