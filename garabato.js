let radio = 100;
let grosor = 0.8;

// Garabato central
let puntos = [];
let conexiones = [];
let numPuntos = 60;
let detalle = 5;

// Red privacidad (izquierda) - estructura geométrica
let puntosRed = [];
let conexionesRed = [];
let rotacionVerde = 0;

// Esfera puntos (derecha) - puntos variados
let puntosEsferaDerecha = [];
let numPuntosEsferaDerecha = 180; // Aumentado
let brilloPuntos = [];
let tamanoPuntos = []; // Para puntos de diferentes tamaños

// Movimiento entre esferas
let targetIndex = 1; // 0: izquierda, 1: centro, 2: derecha
let currentOffsetX = 0;
let targetOffsets = [600, 0, -600]; // izquierda, centro, derecha

// Variables para optimización
let frameCounter = 0;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(RGB, 255);

  // Garabato central
  for (let i = 0; i < numPuntos; i++) {
    let u = random(1);
    let v = random(1);
    let theta = 2 * PI * u;
    let phi = acos(2 * v - 1);
    let x = radio * sin(phi) * cos(theta) + random(-10, 10);
    let y = radio * sin(phi) * sin(theta) + random(-10, 10);
    let z = radio * cos(phi) + random(-10, 10);
    puntos.push(createVector(x, y, z));
  }

  for (let i = 0; i < puntos.length; i++) {
    for (let j = i + 1; j < puntos.length; j++) {
      if (random(1) < 0.05) {
        conexiones.push({
          v1: i,
          v2: j,
          curva: createVector(random(-detalle, detalle), random(-detalle, detalle), random(-detalle, detalle))
        });
      }
    }
  }

  // Generar esfera verde estructurada
  generarEsferaVerde();
  
  // Generar esfera de puntos brillosos
  generarEsferaPuntos();
}

// Genera la esfera verde con más nodos y líneas
function generarEsferaVerde() {
  puntosRed = [];
  conexionesRed = [];
  
  // Más niveles y puntos para mantener forma esférica
  let niveles = 6; // Aumentado de 6
  for (let i = 0; i <= niveles; i++) {
    let phi = map(i, 0, niveles, 0, PI);
    let numPuntosNivel = max(4, floor(sin(phi) * 18)); // Aumentado de 12
    
    for (let j = 0; j < numPuntosNivel; j++) {
      let theta = map(j, 0, numPuntosNivel, 0, TWO_PI);
      let x = -600 + radio * sin(phi) * cos(theta);
      let y = radio * sin(phi) * sin(theta);
      let z = radio * cos(phi);
      puntosRed.push(createVector(x, y, z));
    }
  }
  
  // Más conexiones para formar una red densa
  for (let i = 0; i < puntosRed.length; i++) {
    for (let j = i + 1; j < puntosRed.length; j++) {
      let d = dist(puntosRed[i].x, puntosRed[i].y, puntosRed[i].z,
                  puntosRed[j].x, puntosRed[j].y, puntosRed[j].z);
      if (d < 85 && d > 15) { // Rango más amplio para más conexiones
        conexionesRed.push([i, j]);
      }
    }
  }
}

// Genera la esfera de puntos con tamaños variados
function generarEsferaPuntos() {
  puntosEsferaDerecha = [];
  brilloPuntos = [];
  tamanoPuntos = [];
  
  for (let i = 0; i < numPuntosEsferaDerecha; i++) {
    let u = random(1);
    let v = random(1);
    let theta = 2 * PI * u;
    let phi = acos(2 * v - 1);
    let x = 600 + radio * sin(phi) * cos(theta);
    let y = radio * sin(phi) * sin(theta);
    let z = radio * cos(phi);
    puntosEsferaDerecha.push(createVector(x, y, z));
    
    // Brillo inicial
    brilloPuntos.push(random(0.6, 1.0));
    
    // Tamaños variados: chiquitos, medianos y algunos grandes
    let tipoTamano = random(1);
    if (tipoTamano < 0.6) {
      tamanoPuntos.push(0.8); // Puntos chiquitos
    } else if (tipoTamano < 0.9) {
      tamanoPuntos.push(1.5); // Puntos medianos
    } else {
      tamanoPuntos.push(2.2); // Algunos puntos grandes
    }
  }
}

function draw() {
  background(0);
  orbitControl();
  
  frameCounter++;
  
  // Actualizar animaciones cada pocos frames para optimizar
  if (frameCounter % 2 === 0) {
    rotacionVerde += 0.008;
    
    // Actualizar brillo de puntos blancos
    for (let i = 0; i < brilloPuntos.length; i += 2) {
      brilloPuntos[i] = 0.7 + sin(millis() * 0.002 + i * 0.2) * 0.3;
    }
  }
  
  // Movimiento entre esferas
  currentOffsetX += (targetOffsets[targetIndex] - currentOffsetX) * 0.25;
  translate(currentOffsetX, 0, 0);

  drawGarabato();
  drawEsferaVerde();
  drawEsferaPuntosBrillosos();
  drawCentralNodes();
}

function drawGarabato() {
  stroke(255, 255, 255, 60);
  strokeWeight(grosor);
  noFill();

  for (let i = 0; i < conexiones.length; i++) {
    let v1 = puntos[conexiones[i].v1];
    let v2 = puntos[conexiones[i].v2];
    let curva = conexiones[i].curva;

    let cp1 = p5.Vector.add(v1, p5.Vector.mult(curva, 30));
    let cp2 = p5.Vector.add(v2, p5.Vector.mult(curva, -30));

    bezier(v1.x, v1.y, v1.z, cp1.x, cp1.y, cp1.z, cp2.x, cp2.y, cp2.z, v2.x, v2.y, v2.z);
  }

  // Nodos pequeños: esferas blancas
  noStroke();
  fill(255);
  for (let p of puntos) {
    push();
    translate(p.x, p.y, p.z);
    sphere(2);
    pop();
  }
}

function drawEsferaVerde() {
  push();
  // Rotación dinámica
  translate(-600, 0, 0);
  rotateY(rotacionVerde);
  rotateX(rotacionVerde * 0.7);
  translate(600, 0, 0);
  
  // Líneas verdes con brillo dinámico
  let tiempoBase = millis() * 0.003;
  for (let i = 0; i < conexionesRed.length; i++) {
    let c = conexionesRed[i];
    let v1 = puntosRed[c[0]];
    let v2 = puntosRed[c[1]];
    
    // Brillo dinámico para las líneas
    let brillo = 160 + sin(tiempoBase + i * 0.2) * 60;
    stroke(0, brillo, 60, 180);
    strokeWeight(1.0 + sin(tiempoBase + i * 0.1) * 0.3);
    
    line(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
  }

  // Nodos verdes brillantes
  noStroke();
  for (let i = 0; i < puntosRed.length; i++) {
    let p = puntosRed[i];
    let brillo = 200 + sin(tiempoBase + i * 0.3) * 55;
    fill(0, brillo, 60, 220);
    
    push();
    translate(p.x, p.y, p.z);
    sphere(2.2);
    pop();
  }
  pop();
}

function drawEsferaPuntosBrillosos() {
  // Puntos brillosos con tamaños variados
  noStroke();
  
  for (let i = 0; i < puntosEsferaDerecha.length; i++) {
    let p = puntosEsferaDerecha[i];
    
    // Usar brillo dinámico
    let brillo = (i % 2 === 0) ? brilloPuntos[i] || 0.8 : 0.8;
    
    // Color beige/blanco con variación
    let intensidad = 220 + brillo * 35;
    fill(intensidad, intensidad - 5, intensidad - 15, 160 + brillo * 40);
    
    push();
    translate(p.x, p.y, p.z);
    
    // Usar tamaño pre-definido con variación de brillo
    let tamanoFinal = tamanoPuntos[i] * (0.8 + brillo * 0.4);
    sphere(tamanoFinal);
    
    pop();
  }
}

function drawCentralNodes() {
  // Nodos centrales con pulsación sutil
  let pulsacion = 1 + sin(millis() * 0.002) * 0.05;
  
  // Nodo central del garabato (centro) - violeta
  push();
  translate(0, 0, 0);
  noStroke();
  fill(180, 0, 255, 120);
  sphere(18 * pulsacion);
  pop();

  // Nodo central de la red (izquierda) - verde
  push();
  translate(-600, 0, 0);
  noStroke();
  let brilloVerde = 200 + sin(millis() * 0.003) * 30;
  fill(0, brilloVerde, 80, 120);
  sphere(15 * pulsacion);
  pop();

  // Nodo central de la esfera de puntos (derecha) - beige/blanco
  push();
  translate(600, 0, 0);
  noStroke();
  fill(245, 240, 225, 120);
  sphere(13 * pulsacion);
  pop();
}

// Función para convertir coordenadas 3D a 2D de pantalla
function worldToScreen(x, y, z) {
  // Aplicar el offset actual
  x += currentOffsetX;
  
  // Proyección simple (asumiendo vista frontal)
  let screenX = width/2 + x;
  let screenY = height/2 + y;
  
  return {x: screenX, y: screenY};
}

// Detecta clic en los nodos centrales
function mousePressed() {
  // Convertir posiciones 3D de los nodos a coordenadas de pantalla
  let nodoVioleta = worldToScreen(0, 0, 0);
  let nodoVerde = worldToScreen(-600, 0, 0);
  let nodoBlanco = worldToScreen(600, 0, 0);
  
  // Calcular distancias del mouse a cada nodo
  let distVioleta = dist(mouseX, mouseY, nodoVioleta.x, nodoVioleta.y);
  let distVerde = dist(mouseX, mouseY, nodoVerde.x, nodoVerde.y);
  let distBlanco = dist(mouseX, mouseY, nodoBlanco.x, nodoBlanco.y);
  
  // Radios de detección (ajustables según el tamaño visual de los nodos)
  let radioVioleta = 50;  // Nodo violeta (esfera de 18 de radio)
  let radioVerde = 45;    // Nodo verde (esfera de 15 de radio)  
  let radioBlanco = 40;   // Nodo blanco (esfera de 13 de radio)
  
  // Verificar clics en orden de prioridad
  if (distVioleta < radioVioleta) {
    window.location.href = "reloj.html";
    return;
  }
  
  if (distVerde < radioVerde) {
    window.location.href = "ojo.html";
    return;
  }
  
  if (distBlanco < radioBlanco) {
    window.location.href = "burbuja.html";
    return;
  }
}

function keyPressed() {
  if (keyCode === LEFT_ARROW && targetIndex > 0) {
    targetIndex--;
  } else if (keyCode === RIGHT_ARROW && targetIndex < 2) {
    targetIndex++;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}