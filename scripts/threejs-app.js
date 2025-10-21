import * as THREE from 'three';
// Import 'color' from TSL
import { Fn, texture, uv, uint, instancedArray, positionWorld, billboarding, time, hash, deltaTime, vec2, instanceIndex, positionGeometry, If, color } from 'three/tsl';

// --- INICIO: Comentar OrbitControls ---
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// --- FIN: Comentar OrbitControls ---

// import Stats from 'three/addons/libs/stats.module.js'; // La importación sigue siendo necesaria si se descomenta

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const maxParticleCount = 50000;

let camera, scene, renderer;
let stats; // declarado, pero no se inicializará ni usará
let computeParticles;
let monkey; // Variable declarada, pero el objeto no se asignará ni añadirá
let clock;

// Variables declaradas, pero el objeto collisionBox no se asignará ni añadirá
let collisionBox, collisionCamera, collisionPosRT, collisionPosMaterial;
let collisionBoxPos, collisionBoxPosUI;

// --- INICIO: Variables para el efecto de ratón (Modificado) ---
let mouseX = 0, mouseY = 0;
// --- INICIO: Comentar variables del efecto de offset anterior ---
// let targetCameraOffsetX = 0, targetCameraOffsetY = 0; // Posición objetivo del offset
// const mouseEffectSensitivity = 0.5; // Ajusta la sensibilidad del efecto
// const mouseEffectSmoothness = 0.05; // Ajusta la suavidad del movimiento (lerp factor)
// let baseCameraPosition = new THREE.Vector3(); // Para almacenar la posición base antes del efecto
// --- FIN: Comentar variables del efecto de offset anterior ---
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
// --- INICIO: Añadir vector para el target de la cámara ---
const cameraTarget = new THREE.Vector3(0, 0, 0); // El punto al que mirará la cámara
const cameraLookSensitivity = 50; // Ajusta cuánto se mueve el target con el ratón
// --- FIN: Añadir vector para el target de la cámara ---
// --- FIN: Variables para el efecto de ratón (Modificado) ---

// Variables para la ventana flotante
let floatingWindow;
let isMouseOverWindow = false;


init();

function init() {

  const { innerWidth, innerHeight } = window;

  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 1000); // Aumentado el far plane
  camera.position.set(150, 37.5, 0); // Alejar la cámara para ver el área más grande
  camera.lookAt(cameraTarget); // Mira al target inicial (0,0,0)
  // --- INICIO: Comentar guardado de posición base ---
  // baseCameraPosition.copy(camera.position); // Guarda la posición inicial como base
  // --- FIN: Comentar guardado de posición base ---

  scene = new THREE.Scene();

  const dirLight = new THREE.DirectionalLight(0xffffff, .5);
  dirLight.castShadow = true;
  dirLight.position.set(3, 100, 100); // Subir la luz
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 300; // Aumentar far plane de sombra
  // AJUSTE 0: Ampliar frustum de la cámara de sombras para cubrir el área más grande
  dirLight.shadow.camera.right = 400;
  dirLight.shadow.camera.left = - 400;
  dirLight.shadow.camera.top = 400;
  dirLight.shadow.camera.bottom = - 400;
  dirLight.shadow.mapSize.width = 2048; // Podría necesitarse mayor resolución para sombras nítidas
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.bias = - 0.01;

  scene.add(dirLight);
  scene.add(new THREE.AmbientLight(0x111111));

  // Actualizar los límites de la cámara de colisión al nuevo tamaño (800x800)
  collisionCamera = new THREE.OrthographicCamera(- 400, 400, 400, - 400, .1, 150); // Rango [-400, 400], aumentado far plane
  collisionCamera.position.y = 50; // Mantener la altura o ajustarla si es necesario
  collisionCamera.lookAt(0, 0, 0);
  collisionCamera.layers.disableAll();
  collisionCamera.layers.enable(1); // La capa sigue activa, pero no habrá objetos en ella

  // Aumentar resolución del RenderTarget para mantener precisión en área más grande
  collisionPosRT = new THREE.RenderTarget(2048, 2048); // Aumentado de 1024x1024
  collisionPosRT.texture.type = THREE.HalfFloatType;
  collisionPosRT.texture.magFilter = THREE.NearestFilter;
  collisionPosRT.texture.minFilter = THREE.NearestFilter;
  collisionPosRT.texture.generateMipmaps = false;

  collisionPosMaterial = new THREE.MeshBasicNodeMaterial();
  collisionPosMaterial.colorNode = positionWorld;

  //

  const positionBuffer = instancedArray(maxParticleCount, 'vec3');
  const velocityBuffer = instancedArray(maxParticleCount, 'vec3');
  const ripplePositionBuffer = instancedArray(maxParticleCount, 'vec3');
  const rippleTimeBuffer = instancedArray(maxParticleCount, 'vec3');

  // compute

  const randUint = () => uint(Math.random() * 0xFFFFFF);

  const computeInit = Fn(() => {

    const position = positionBuffer.element(instanceIndex);
    const velocity = velocityBuffer.element(instanceIndex);
    const rippleTime = rippleTimeBuffer.element(instanceIndex);

    const randX = hash(instanceIndex);
    const randY = hash(instanceIndex.add(randUint()));
    const randZ = hash(instanceIndex.add(randUint()));

    // Cambiar el rango de inicialización de X y Z a [-400, 400]
    position.x = randX.mul(800).add(- 400); // Rango [-400, 400]
    position.y = randY.mul(75); // La altura inicial puede mantenerse
    position.z = randZ.mul(800).add(- 400); // Rango [-400, 400]

    velocity.y = randX.mul(- .04).add(- .2);

    rippleTime.x = 1000;

  })().compute(maxParticleCount);

  //

  const computeUpdate = Fn(() => {

    // Actualizar la función de mapeo de coordenadas para el rango [-400, 400]
    const getCoord = (pos) => pos.add(400).div(800); // Mapea [-400, 400] a [0, 1]

    const position = positionBuffer.element(instanceIndex);
    const velocity = velocityBuffer.element(instanceIndex);
    const ripplePosition = ripplePositionBuffer.element(instanceIndex);
    const rippleTime = rippleTimeBuffer.element(instanceIndex);

    position.addAssign(velocity);

    rippleTime.x = rippleTime.x.add(deltaTime.mul(4));

    //

    const collisionArea = texture(collisionPosRT.texture, getCoord(position.xz));

    const surfaceOffset = .05;

    // Como no hay objetos en la capa 1, collisionArea.y será probablemente 0 (o un valor por defecto)
    // Las gotas chocarán con el "suelo" definido por este valor.
    const floorPosition = collisionArea.y.add(surfaceOffset);

    // floor

    const ripplePivotOffsetY = - .9;

    If(position.y.add(ripplePivotOffsetY).lessThan(floorPosition), () => {

      position.y = 75; // Reposicionar en la parte superior

      ripplePosition.xz = position.xz;
      ripplePosition.y = floorPosition;

      // reset hit time: x = time

      rippleTime.x = 1;

      // next drops will not fall in the same place
      // Cambiar el rango de reseteo de X y Z a [-400, 400]
      position.x = hash(instanceIndex.add(time)).mul(800).add(- 400); // Rango [-400, 400]
      position.z = hash(instanceIndex.add(time.add(randUint()))).mul(800).add(- 400); // Rango [-400, 400]

    });

    const rippleOnSurface = texture(collisionPosRT.texture, getCoord(ripplePosition.xz));

    const rippleFloorArea = rippleOnSurface.y.add(surfaceOffset);

    If(ripplePosition.y.greaterThan(rippleFloorArea), () => {

      rippleTime.x = 1000;

    });

  });

  computeParticles = computeUpdate().compute(maxParticleCount);

  // rain

  const rainMaterial = new THREE.MeshBasicNodeMaterial();

  // Calculate intensity
  const rainIntensity = uv().distance(vec2(.5, 0)).oneMinus().mul(3).exp();

  // Multiply intensity by cyan color
  rainMaterial.colorNode = color(0x00ffff).mul(rainIntensity); // Rain color

  rainMaterial.vertexNode = billboarding({ position: positionBuffer.toAttribute() });
  rainMaterial.opacity = .2; // Adjust opacity
  rainMaterial.side = THREE.DoubleSide;
  rainMaterial.forceSinglePass = true;
  rainMaterial.depthWrite = false;
  rainMaterial.depthTest = true;
  rainMaterial.transparent = true;

  const rainParticles = new THREE.Mesh(new THREE.PlaneGeometry(.1, 2), rainMaterial);
  rainParticles.count = 4500; // Initial drop count set
  scene.add(rainParticles);

  // ripple

  const rippleTime = rippleTimeBuffer.element(instanceIndex).x;

  const rippleEffect = Fn(() => { // This function calculates intensity

    const center = uv().add(vec2(- .5)).length().mul(7);
    const distance = rippleTime.sub(center);

    return distance.min(1).sub(distance.max(1).sub(1));

  });

  const rippleMaterial = new THREE.MeshBasicNodeMaterial();
  // Multiply ripple intensity by cyan color
  rippleMaterial.colorNode = color(0x00ffff).mul(rippleEffect()); // Ripple color
  rippleMaterial.positionNode = positionGeometry.add(ripplePositionBuffer.toAttribute());
  rippleMaterial.opacityNode = rippleTime.mul(.3).oneMinus().max(0).mul(.5);
  rippleMaterial.side = THREE.DoubleSide;
  rippleMaterial.forceSinglePass = true;
  rippleMaterial.depthWrite = false;
  rippleMaterial.depthTest = true;
  rippleMaterial.transparent = true;

  // ripple geometry

  const surfaceRippleGeometry = new THREE.PlaneGeometry(2.5, 2.5);
  surfaceRippleGeometry.rotateX(- Math.PI / 2);

  const xRippleGeometry = new THREE.PlaneGeometry(1, 2);
  xRippleGeometry.rotateY(- Math.PI / 2);

  const zRippleGeometry = new THREE.PlaneGeometry(1, 2);

  const rippleGeometry = BufferGeometryUtils.mergeGeometries([surfaceRippleGeometry, xRippleGeometry, zRippleGeometry]);

  const rippleParticles = new THREE.Mesh(rippleGeometry, rippleMaterial);
  rippleParticles.count = 4500; // Initial ripple count set
  scene.add(rippleParticles);

  // floor geometry
  // Aumentar tamaño del suelo
  const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
  floorGeometry.rotateX(- Math.PI / 2);

  const plane = new THREE.Mesh(floorGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
  scene.add(plane);

  /* // INICIO: Comentar Caja de Colisión
  collisionBox = new THREE.Mesh(new THREE.BoxGeometry(30, 1, 15), new THREE.MeshStandardMaterial());
  collisionBox.material.color.set(0x333333);
  collisionBox.position.y = 12;
  collisionBox.scale.x = 3.5;
  collisionBox.layers.enable(1);
  collisionBox.castShadow = true;
  scene.add(collisionBox);
  */ // FIN: Comentar Caja de Colisión

  /* // INICIO: Comentar Carga del Mono
  const loader = new THREE.BufferGeometryLoader();
  loader.load('models/json/suzanne_buffergeometry.json', function (geometry) {

    geometry.computeVertexNormals();

    monkey = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 }));
    monkey.receiveShadow = true;
    monkey.scale.setScalar(5);
    monkey.rotation.y = Math.PI / 2;
    monkey.position.y = 4.5;
    monkey.layers.enable(1); // add to collision layer

    scene.add(monkey);

  });
  */ // FIN: Comentar Carga del Mono

  //

  clock = new THREE.Clock();

  //

  renderer = new THREE.WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000); // Set background to black
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  /* // INICIO: Comentar Stats
  stats = new Stats();
  document.body.appendChild(stats.dom);
  */ // FIN: Comentar Stats

  //

  renderer.computeAsync(computeInit);

  // --- INICIO: Comentar inicialización y configuración de OrbitControls ---
  /*
  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 5;
  controls.maxDistance = 500; // Aumentado el maxDistance significativamente
  // --- INICIO: Guardar posición base al cambiar controles ---
  controls.addEventListener('change', () => {
    // Cuando OrbitControls cambia la cámara, actualizamos la posición base
    // para que el efecto del ratón se aplique sobre la nueva posición/orientación
    baseCameraPosition.copy(camera.position);
    // Reseteamos los offsets para evitar saltos si el usuario movió el ratón mientras orbitaba
    targetCameraOffsetX = 0;
    targetCameraOffsetY = 0;
  });
  // --- FIN: Guardar posición base al cambiar controles ---
  controls.update(); // Llamada inicial
  */
  // --- FIN: Comentar inicialización y configuración de OrbitControls ---

  //

  window.addEventListener('resize', onWindowResize);
  // Añadir listener para el movimiento del ratón ---
  document.addEventListener('mousemove', onDocumentMouseMove);


  // Configuración de la ventana flotante
  floatingWindow = document.getElementById('floatingWindow');

  // Añadir eventos para la ventana flotante
  floatingWindow.addEventListener('mouseenter', () => {
    isMouseOverWindow = true;
  });

  floatingWindow.addEventListener('mouseleave', () => {
    isMouseOverWindow = false;
    // Restaurar la posición de la ventana al salir
    floatingWindow.style.transform = 'translate(-50%, -50%)';
  });

  // gui

  const gui = new GUI();

  /* Comentar GUI Caja de Colisión
  // use lerp to smooth the movement
  // collisionBoxPosUI = new THREE.Vector3().copy(collisionBox.position);
  // collisionBoxPos = new THREE.Vector3();

  // Ampliar el rango del slider de posición Z del cubo
  // gui.add(collisionBoxPosUI, 'z', - 400, 400, .001).name('position'); // Rango [-400, 400]
  // gui.add(collisionBox.scale, 'x', .1, 3.5, 0.01).name('scale');
  */
  // The slider will now start at 4500 because rainParticles.count is 4500
  gui.add(rainParticles, 'count', 200, maxParticleCount, 1).name('drop count').onChange((v) => rippleParticles.count = v);

}

// Función para manejar el movimiento del ratón (Modificada para incluir efecto ventana) ---
function onDocumentMouseMove(event) {
  // Calcula la posición normalizada del ratón (-1 a 1)
  mouseX = (event.clientX - windowHalfX) / windowHalfX;
  mouseY = (event.clientY - windowHalfY) / windowHalfY;

  // Comentar cálculo de offset objetivo ---
  // Calcula el desplazamiento objetivo basado en la posición del ratón y la sensibilidad
  // Multiplicamos por -1 en Y porque el eje Y del ratón va hacia abajo, opuesto al eje Y de Three.js
  // targetCameraOffsetX = mouseX * mouseEffectSensitivity;
  // targetCameraOffsetY = -mouseY * mouseEffectSensitivity;


  // Efecto de movimiento para la ventana flotante
  if (!isMouseOverWindow) {
    // Calcula la distancia entre el ratón y el centro de la pantalla
    const distanceX = (event.clientX - windowHalfX) / 20;
    const distanceY = (event.clientY - windowHalfY) / 20;

    // Movimiento suave de la ventana - efecto de "seguir ligeramente" al ratón
    floatingWindow.style.transform = `translate(calc(-50% + ${distanceX}px), calc(-50% + ${distanceY}px))`;
  } else {
    // Si el ratón está sobre la ventana, aplicar un efecto de "flotación" más pronunciado
    const moveX = (event.clientX - windowHalfX) / 10;
    const moveY = (event.clientY - windowHalfY) / 10;

    floatingWindow.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px)) scale(1.02)`;
  }
}
// Función para manejar el movimiento del ratón ---

function onWindowResize() {

  // mitades de ventana ---
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  const { innerWidth, innerHeight } = window;

  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);

}

function animate() {

  /*
  stats.update();
  */

  const delta = clock.getDelta();


  // controls.update(); // Actualiza los controles orbitales primero

  // efecto de movimiento con el ratón anterior ---
  /*
  // Suaviza el movimiento del offset hacia el objetivo usando lerp
  const currentOffsetX = camera.position.x - baseCameraPosition.x;
  const currentOffsetY = camera.position.y - baseCameraPosition.y;

  const smoothedOffsetX = currentOffsetX + (targetCameraOffsetX - currentOffsetX) * mouseEffectSmoothness;
  const smoothedOffsetY = currentOffsetY + (targetCameraOffsetY - currentOffsetY) * mouseEffectSmoothness;

  // Aplica el offset suavizado a la posición base de la cámara
  // Nota: Esto mueve la cámara en los ejes X/Y DEL MUNDO.
  camera.position.x = baseCameraPosition.x + smoothedOffsetX;
  camera.position.y = baseCameraPosition.y + smoothedOffsetY;

  camera.lookAt(controls.target);
  */

  // Aplicar nuevo efecto de mirada (SOLO HORIZONTAL v2) ---

  // Definimos un punto X base hacia el que mirar (ej: el origen X=0)
  const baseTargetX = 0;
  // Fijamos la altura del target a la misma altura de la cámara
  const targetY = camera.position.y;
  // Calculamos la posición Z del target basándonos en la posición X del ratón.
  // Esto hará que la cámara gire a izquierda/derecha.
  // Ajusta cameraLookSensitivity si quieres más o menos rotación.
  const targetZ = mouseX * cameraLookSensitivity;

  // Establecemos las coordenadas del punto al que la cámara mirará
  cameraTarget.set(baseTargetX, targetY, targetZ);

  // Hacemos que la cámara mire al punto calculado
  camera.lookAt(cameraTarget);


  /* Rotación del Mono
  if (monkey) {

    monkey.rotation.y += delta;

  }
  */

  /* // Actualización Posición Caja de Colisión
  // collisionBoxPos.set(collisionBoxPosUI.x, collisionBoxPosUI.y, - collisionBoxPosUI.z);
  // collisionBox.position.lerp(collisionBoxPos, 10 * delta);
  */

  // position
  // Esto es necesario para que computeUpdate funcione.
  scene.overrideMaterial = collisionPosMaterial;
  renderer.setRenderTarget(collisionPosRT);
  renderer.render(scene, collisionCamera);

  // compute

  renderer.compute(computeParticles);

  // result

  scene.overrideMaterial = null;
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);

  // Añadir un efecto de animación suave a la ventana incluso sin movimiento del ratón
  if (!isMouseOverWindow) {
    const time = Date.now() * 0.001;
    const offsetX = Math.sin(time * 0.5) * 5;
    const offsetY = Math.cos(time * 0.3) * 3;

    // Aplicar una animación suave de "flotación" cuando no hay interacción
    floatingWindow.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  }

}