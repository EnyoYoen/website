import { useEffect, useRef } from "react";
import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { gsap } from "gsap";

import { noiseShader, planetFrag, planetVert } from "./Shaders";

interface PlanetParams {
  [uniform: string]: { value: any };
  type: { value: number };
  radius: { value: number };
  amplitude: { value: number };
  sharpness: { value: number };
  offset: { value: number };
  period: { value: number };
  persistence: { value: number };
  lacunarity: { value: number };
  octaves: { value: number };
  undulation: { value: number };
  ambientIntensity: { value: number };
  diffuseIntensity: { value: number };
  specularIntensity: { value: number };
  shininess: { value: number };
  lightDirection: { value: THREE.Vector3 };
  lightColor: { value: THREE.Color };
  bumpStrength: { value: number };
  bumpOffset: { value: number };
  color1: { value: THREE.Color };
  color2: { value: THREE.Color };
  color3: { value: THREE.Color };
  color4: { value: THREE.Color };
  color5: { value: THREE.Color };
  transition2: { value: number };
  transition3: { value: number };
  transition4: { value: number };
  transition5: { value: number };
  blend12: { value: number };
  blend23: { value: number };
  blend34: { value: number };
  blend45: { value: number };
}

interface AtmosphereParams {
  particles: { value: number };
  minParticleSize: { value: number };
  maxParticleSize: { value: number };
  radius: { value: number };
  thickness: { value: number };
  density: { value: number };
  opacity: { value: number };
  scale: { value: number };
  color: { value: THREE.Color };
  speed: { value: number };
  lightDirection: { value: THREE.Vector3 };
}

// Global variables for transitions
const planetCount = 5;
const projectsPlanetIndex = 1;

let zoom = false;
let timeOffset = 0;
let transitionTime = 0;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;
let planets: {
  planet: THREE.Mesh;
  distance: number;
  angle: number;
  angleVelocity: number;
}[] = [];
let trajectories: THREE.Mesh[] = [];
let planetParams: PlanetParams[] = [];
let atmosphereParams: AtmosphereParams[] = [];
let oceanColors: THREE.Color[] = [];
let proceduralPlanet: THREE.Mesh | null = null;
let proceduralOcclusionMaterial: THREE.ShaderMaterial | null = null;
let oceanSphere: THREE.Mesh | null = null;
let spaceBackgroundTexture: THREE.CubeTexture | null = null;
let zoomedPlanetIndex: number | null = null;
let projectPins: THREE.Mesh[] = [];
let projectPinDirections: THREE.Vector3[] = [];
let sunMesh: THREE.Mesh | null = null;
let mainLight: THREE.PointLight | null = null;
let fillAmbientLight: THREE.AmbientLight | null = null;

const projectPinCount = 4;

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 91.3458) * 43758.5453;
  return x - Math.floor(x);
}

function makeHslColor(h: number, s: number, l: number) {
  return new THREE.Color().setHSL(
    ((h % 1) + 1) % 1,
    THREE.MathUtils.clamp(s, 0, 1),
    THREE.MathUtils.clamp(l, 0, 1)
  );
}

function generatePlanetPalette(index: number) {
  const h = pseudoRandom(index + 1.37);
  const hueDrift = pseudoRandom(index + 4.91) * 0.1 - 0.05;
  const satBoost = 0.08 + pseudoRandom(index + 7.2) * 0.12;
  const lightJitter = pseudoRandom(index + 3.1) * 0.05;

  const layer1 = makeHslColor(h - 0.08 + hueDrift, 0.5 + satBoost, 0.14 + lightJitter * 0.4);
  const layer2 = makeHslColor(h - 0.03, 0.62 + satBoost * 0.7, 0.26 + lightJitter * 0.6);
  const layer3 = makeHslColor(h + 0.02, 0.7 + satBoost * 0.6, 0.4 + lightJitter * 0.8);
  const layer4 = makeHslColor(h + 0.06, 0.56 + satBoost * 0.35, 0.58 + lightJitter);
  const layer5 = makeHslColor(h + 0.1, 0.22 + satBoost * 0.15, 0.82 + lightJitter * 0.8);

  const oceanHue = h - 0.14 + hueDrift * 0.5;
  const ocean = makeHslColor(oceanHue, 0.72 + satBoost * 0.4, 0.3 + lightJitter * 0.35);

  return {
    ocean,
    layers: [layer1, layer2, layer3, layer4, layer5] as const,
  };
}

function clearProjectPins() {
  if (!proceduralPlanet) {
    projectPins = [];
    return;
  }

  for (let i = 0; i < projectPins.length; i++) {
    const pin = projectPins[i];
    proceduralPlanet.remove(pin);
    pin.geometry.dispose();
    (pin.material as THREE.Material).dispose();
  }
  projectPins = [];
}

function generateRandomProjectPinDirections(count: number) {
  const candidateCount = 512;
  const candidates: THREE.Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < candidateCount; i++) {
    const y = 1 - (i / (candidateCount - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    candidates.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
  }

  const directions: THREE.Vector3[] = [];
  const selected = new Set<number>();

  const firstIndex = Math.floor(Math.random() * candidateCount);
  selected.add(firstIndex);
  directions.push(candidates[firstIndex].clone());

  while (directions.length < count && selected.size < candidateCount) {
    const weights: Array<{ idx: number; weight: number }> = [];
    let totalWeight = 0;

    for (let i = 0; i < candidateCount; i++) {
      if (selected.has(i)) {
        continue;
      }

      let minDistSq = Number.POSITIVE_INFINITY;
      for (let j = 0; j < directions.length; j++) {
        const distSq = candidates[i].distanceToSquared(directions[j]);
        if (distSq < minDistSq) {
          minDistSq = distSq;
        }
      }

      const weight = Math.pow(minDistSq + 1e-6, 1.5);
      totalWeight += weight;
      weights.push({ idx: i, weight });
    }

    let pick = Math.random() * totalWeight;
    let chosenIndex = -1;
    for (let i = 0; i < weights.length; i++) {
      pick -= weights[i].weight;
      if (pick <= 0) {
        chosenIndex = weights[i].idx;
        break;
      }
    }

    if (chosenIndex < 0) {
      chosenIndex = weights[weights.length - 1].idx;
    }

    selected.add(chosenIndex);
    directions.push(candidates[chosenIndex].clone());
  }

  return directions;
}

function createProjectPins(planetIndex: number) {
  if (!proceduralPlanet) {
    return;
  }

  clearProjectPins();

  const radius = planetParams[planetIndex].radius.value;
  const maxTerrainHeight = Math.max(
    0,
    planetParams[planetIndex].amplitude.value +
      planetParams[planetIndex].offset.value
  );
  const seaLevelRadius = radius + maxTerrainHeight * 0.4;
  const pinDistance = seaLevelRadius + 0.003;
  const planetTint = planetParams[planetIndex].color3.value.clone();
  const redAnchor = new THREE.Color(0xd63f4f);
  const emissiveAnchor = new THREE.Color(0xff4e5f);
  projectPinDirections = generateRandomProjectPinDirections(projectPinCount);

  for (let i = 0; i < projectPinDirections.length; i++) {
    const normal = projectPinDirections[i].clone().normalize();
    const variation = i / Math.max(1, projectPinDirections.length - 1);
    const pinColor = planetTint.clone().lerp(redAnchor, 0.58 + variation * 0.12);
    const pinEmissive = pinColor.clone().lerp(emissiveAnchor, 0.55);

    const pinGeometry = new THREE.ConeGeometry(0.08, 0.42, 14);
    pinGeometry.rotateX(Math.PI);
    pinGeometry.translate(0, 0.21, 0);
    const pin = new THREE.Mesh(
      pinGeometry,
      new THREE.MeshStandardMaterial({
        color: pinColor,
        emissive: pinEmissive,
        emissiveIntensity: 2.2,
        roughness: 0.2,
        metalness: 0.25,
        depthWrite: false,
      })
    );
    pin.position.copy(normal.clone().multiplyScalar(pinDistance));
    pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    proceduralPlanet.add(pin);
    projectPins.push(pin);
  }
}

function BackgroundFocusProjectPin(projectIndex: number) {
  if (
    !zoom ||
    zoomedPlanetIndex !== projectsPlanetIndex ||
    !proceduralPlanet ||
    projectIndex < 0 ||
    projectIndex >= projectPinDirections.length
  ) {
    return;
  }

  const currentQuat = proceduralPlanet.quaternion.clone();
  const pinDirection = projectPinDirections[projectIndex].clone();
  const worldPinDirection = pinDirection.applyQuaternion(currentQuat).normalize();
  const targetDirection = camera.position
    .clone()
    .sub(proceduralPlanet.position)
    .normalize();
  const delta = new THREE.Quaternion().setFromUnitVectors(
    worldPinDirection,
    targetDirection
  );
  const targetQuat = delta.multiply(currentQuat);

  const anim = { t: 0 };
  gsap.to(anim, {
    duration: 0.8,
    t: 1,
    ease: "power2.inOut",
    onUpdate: () => {
      proceduralPlanet?.quaternion.slerpQuaternions(currentQuat, targetQuat, anim.t);
    },
  });
}

function BackgroundProjectDiveTransition(
  projectIndex: number,
  onEnterPlanet?: () => void
) {
  if (
    !zoom ||
    zoomedPlanetIndex !== projectsPlanetIndex ||
    !proceduralPlanet ||
    projectIndex < 0 ||
    projectIndex >= projectPinDirections.length
  ) {
    onEnterPlanet?.();
    return;
  }

  clearProjectPins();
  BackgroundFocusProjectPin(projectIndex);
  controls.autoRotate = false;

  const targetPosition = proceduralPlanet.position.clone();
  const toCenter = targetPosition.clone().sub(camera.position).normalize();
  const nearSurface = targetPosition.clone().add(toCenter.clone().multiplyScalar(1.35));
  const insidePlanet = targetPosition.clone().add(toCenter.clone().multiplyScalar(0.06));

  let entered = false;

  gsap.timeline().to(camera.position, {
    duration: 2.8,
    x: nearSurface.x,
    y: nearSurface.y,
    z: nearSurface.z,
    ease: "power1.inOut",
    onUpdate: () => {
      camera.lookAt(targetPosition);
      camera.updateProjectionMatrix();
    },
  }).to(camera.position, {
    duration: 1.4,
    x: insidePlanet.x,
    y: insidePlanet.y,
    z: insidePlanet.z,
    ease: "power3.in",
    onStart: () => {
      if (!entered) {
        entered = true;
        scene.background = new THREE.Color(0x000000);
        if (proceduralPlanet) {
          proceduralPlanet.visible = true;
        }
        if (oceanSphere) {
          oceanSphere.visible = false;
        }
        onEnterPlanet?.();
      }
    },
    onUpdate: () => {
      camera.lookAt(targetPosition);
      camera.updateProjectionMatrix();
    },
  });
}

// Zoom Transition function
function BackgroundPlanetTransition(planetIndex: number) {
  if (planetIndex < 0 || planetIndex >= planetCount || zoom) {
    return;
  }

  zoom = true;
  transitionTime = performance.now();

  const targetPlanet = planets[planetIndex].planet;
  targetPlanet.removeFromParent();
  const targetPosition = targetPlanet.position.clone();
  zoomedPlanetIndex = planetIndex;

  camera.lookAt(targetPosition);
  camera.updateProjectionMatrix();

  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.2;
  controls.target.copy(targetPosition);
  controls.update();

  let planetVertexShader = planetVert;
  let planetFragmentShader = planetFrag;
  planetVertexShader = planetVertexShader.replace(
    "void main(){",
    `${noiseShader}
     void main(){`
  );
  planetFragmentShader = planetFragmentShader.replace(
    "void main(){",
    `${noiseShader}
     void main(){`
  );

  const material = new THREE.ShaderMaterial({
    uniforms: planetParams[planetIndex],
    vertexShader: planetVertexShader,
    fragmentShader: planetFragmentShader,
  });

  proceduralOcclusionMaterial = new THREE.ShaderMaterial({
    uniforms: planetParams[planetIndex],
    vertexShader: planetVertexShader,
    fragmentShader: `void main(){
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }`,
  });

  proceduralPlanet = new THREE.Mesh(
    new THREE.SphereGeometry(1, 128, 128),
    material
  );
  proceduralPlanet.geometry.computeTangents();
  proceduralPlanet.position.copy(targetPosition);
  scene.add(proceduralPlanet);

  if (planetIndex === projectsPlanetIndex) {
    createProjectPins(planetIndex);
  }

  const baseRadius = planetParams[planetIndex].radius.value;
  const maxTerrainHeight = Math.max(
    0,
    planetParams[planetIndex].amplitude.value +
      planetParams[planetIndex].offset.value
  );
  const seaLevelRadius = baseRadius + maxTerrainHeight * 0.4;
  oceanSphere = new THREE.Mesh(
    new THREE.SphereGeometry(seaLevelRadius, 96, 96),
    new THREE.MeshStandardMaterial({
      color: oceanColors[planetIndex] ?? new THREE.Color(0.08, 0.34, 0.78),
      transparent: true,
      opacity: 0.45,
      roughness: 0.08,
      metalness: 0.05,
      depthWrite: false,
    })
  );
  oceanSphere.position.copy(targetPosition);
  scene.add(oceanSphere);
  targetPlanet.visible = false;

  for (let i = 0; i < trajectories.length; i++) {
    const ringMaterial = trajectories[i].material as THREE.Material & {
      transparent?: boolean;
      depthWrite?: boolean;
    };
    ringMaterial.transparent = true;
    ringMaterial.depthWrite = false;

    gsap.to(trajectories[i].material, {
      duration: 1.5,
      opacity: 0,
      onComplete: () => {
        scene.remove(trajectories[i]);
      },
      ease: "power2.inOut",
    });
  }

  for (let i = 0; i < planets.length; i++) {
    if (i === planetIndex) continue;
    gsap.to(planets[i].planet.scale, {
      duration: 2,
      x: 0,
      y: 0,
      z: 0,
      ease: "power2.inOut",
    });
  }

  /*const targetQuaternion = targetPlanet.quaternion.clone().normalize();
  const startQuaternion = camera.quaternion.clone().normalize();
  gsap.to(
    {},
    {
      duration: 2,
      onUpdate: function () {
        camera.quaternion
          .copy(startQuaternion)
          .slerp(targetQuaternion, this.progress());
      },
    }
  );*/

  gsap.to(camera.position, {
    duration: 2,
    x: targetPosition.x + 5,
    y: targetPosition.y + 2,
    z: targetPosition.z + 5,
    onUpdate: () => {
      camera.lookAt(targetPosition);
      camera.updateProjectionMatrix();
    },
    ease: "power2.inOut",
  });
}

function BackgroundMenuTransition() {
  zoom = false;
  timeOffset += performance.now() - transitionTime;

  if (spaceBackgroundTexture) {
    scene.background = spaceBackgroundTexture;
  }

  if (zoomedPlanetIndex !== null) {
    planets[zoomedPlanetIndex].planet.visible = true;
    scene.add(planets[zoomedPlanetIndex].planet);
    zoomedPlanetIndex = null;
  }

  if (proceduralPlanet) {
    const currentMaterial = proceduralPlanet.material as THREE.Material;
    clearProjectPins();
    scene.remove(proceduralPlanet);
    proceduralPlanet.geometry.dispose();
    if (
      currentMaterial !== proceduralOcclusionMaterial
    ) {
      currentMaterial.dispose();
    }
    proceduralPlanet = null;
  }

  if (proceduralOcclusionMaterial) {
    proceduralOcclusionMaterial.dispose();
    proceduralOcclusionMaterial = null;
  }

  if (oceanSphere) {
    scene.remove(oceanSphere);
    oceanSphere.geometry.dispose();
    (oceanSphere.material as THREE.Material).dispose();
    oceanSphere = null;
  }

  controls.enableZoom = true;
  controls.enablePan = true;
  controls.autoRotate = false;
  controls.target = new THREE.Vector3(0, 0, 0);
  controls.update();

  for (let i = 0; i < trajectories.length; i++) {
    scene.add(trajectories[i]);
    const ringMaterial = trajectories[i].material as THREE.Material & {
      transparent?: boolean;
      depthWrite?: boolean;
    };
    ringMaterial.transparent = true;
    ringMaterial.depthWrite = false;

    gsap.to(trajectories[i].material, {
      duration: 2,
      opacity: 1,
      ease: "power2.inOut",
    });
  }

  for (let i = 0; i < planets.length; i++) {
    gsap.to(planets[i].planet.scale, {
      duration: 2,
      x: 1,
      y: 1,
      z: 1,
      ease: "power2.inOut",
    });
  }

  gsap.to(camera.position, {
    duration: 2,
    x: 30,
    y: 50,
    z: 30,
    onUpdate: () => {
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    },
    ease: "power2.inOut",
  });
}

// Background component with Three.js
interface BackgroundProps {
  darkMode: boolean;
}

const Background = ({ darkMode }: BackgroundProps) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const BLOOM_SCENE = 1;

    const bloomLayer = new THREE.Layers();
    bloomLayer.set(BLOOM_SCENE);

    const params = {
      threshold: 0,
      strength: 1,
      radius: 0.5,
      exposure: 1,
    };

    const stats = new Stats();
    document.body.appendChild(stats.dom);

    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const materials: { [key: string]: THREE.Material } = {};

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      1,
      200
    );
    camera.position.set(30, 50, 30);
    camera.lookAt(0, 0, 0);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 0.8;
    controls.panSpeed = 0.8;
    controls.minZoom = 1;
    controls.maxZoom = 3;

    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = params.threshold;
    bloomPass.strength = params.strength;
    bloomPass.radius = params.radius;

    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);

    const mixPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: `varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }`,
        fragmentShader: `uniform sampler2D baseTexture;
            uniform sampler2D bloomTexture;
            varying vec2 vUv;
            void main() {
              gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) * 0.2 );
            }`,
        defines: {},
      }),
      "baseTexture"
    );
    mixPass.needsSwap = true;

    const outputPass = new OutputPass();

    const finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(renderScene);
    finalComposer.addPass(mixPass);
    finalComposer.addPass(outputPass);

    setupScene();

    window.addEventListener("resize", () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);

      bloomComposer.setSize(width, height);
      finalComposer.setSize(width, height);

      render();
    });

    function setupScene() {
      scene.traverse(disposeMaterial);
      scene.children.length = 0;

      const color = 0xffffff;
      const intensity = 600;
      const light = new THREE.PointLight(color, intensity);
      light.castShadow = true;
      scene.add(light);
      mainLight = light;

      const ambientLight = new THREE.AmbientLight(0x606060, 3); // soft white light
      scene.add(ambientLight);
      fillAmbientLight = ambientLight;

      const geometry = new THREE.IcosahedronGeometry(1, 15);

      const sunColor = new THREE.Color(0xffcc00);
      const sunMaterial = new THREE.MeshBasicMaterial({ color: sunColor });
      const textureLoader = new THREE.TextureLoader();
      const sunTexture = textureLoader.load(
        "/src/assets/images/raster/sun.jpg"
      );
      sunMaterial.map = sunTexture;
      sunMaterial.needsUpdate = false;
      const sun = new THREE.Mesh(geometry, sunMaterial);
      sun.position.set(0, 0, 0);
      sun.scale.setScalar(3);
      sun.layers.enable(BLOOM_SCENE);
      scene.add(sun);
      sunMesh = sun;

      const labels = ["Mercury", "Venus", "Earth", "Mars", "Jupiter"];
      const minOrbitClearance = 0.35;
      const keplerReferenceDistance = 8;
      const keplerReferenceAngularVelocity = 0.05;
      const keplerRandomness = 0.2;

      let distance = 5;
      let scale = 1;
      oceanColors = [];

      for (let i = 0; i < planetCount; i++) {
        const paletteIndex = i === 1 ? 4 : i === 4 ? 1 : i;
        const palette = generatePlanetPalette(paletteIndex);
        const [layer1, layer2, layer3, layer4, layer5] = palette.layers;
        oceanColors.push(palette.ocean.clone());

        const color = layer3.clone();
        const material = new THREE.MeshStandardMaterial({ color: color });
        const planet = new THREE.Mesh(geometry, material);
        planet.castShadow = true;
        planet.receiveShadow = true;

        distance += (2 + (Math.random() * 5 + scale)) * 0.6;
        const angle = Math.random() * Math.PI * 2;
        const normalizedDistance = Math.max(distance, 0.001) / keplerReferenceDistance;
        const keplerAngularVelocity =
          keplerReferenceAngularVelocity * Math.pow(normalizedDistance, -1.5);
        const jitter = 1 + (Math.random() * 2 - 1) * keplerRandomness;
        let angleVelocity = keplerAngularVelocity * jitter;
        scale = Math.random() * 0.5 + 0.5;

        if (i === projectsPlanetIndex) {
          scale = 1.25;
          angleVelocity *= 0.85;
        }

        if (i > 0) {
          const previousPlanet = planets[i - 1];
          const previousScale = previousPlanet.planet.scale.x;
          const orbitGap = distance - previousPlanet.distance;
          const minimumOrbitGap = previousScale + scale + minOrbitClearance;

          if (orbitGap < minimumOrbitGap) {
            distance = previousPlanet.distance + minimumOrbitGap;
          }
        }

        planet.position.set(
          Math.cos(angle) * distance,
          0,
          Math.sin(angle) * distance
        );
        planet.scale.setScalar(scale);

        planets.push({ planet, distance, angle, angleVelocity });

        planetParams.push({
          type: { value: 2 },
          radius: { value: scale },
          amplitude: { value: 0.59 },
          sharpness: { value: 0.96 },
          offset: { value: -0.016 },
          period: { value: 0.6 },
          persistence: { value: 0.484 },
          lacunarity: { value: 1.8 },
          octaves: { value: 8 },
          undulation: { value: 0.0 },
          ambientIntensity: { value: 0.02 },
          diffuseIntensity: { value: 1 },
          specularIntensity: { value: 2 },
          shininess: { value: 10 },
          lightDirection: { value: new THREE.Vector3(1, 1, 1) },
          lightColor: { value: new THREE.Color(0xffffff) },
          bumpStrength: { value: 1.0 },
          bumpOffset: { value: 0.001 },
          color1: { value: layer1.clone() },
          color2: { value: layer2.clone() },
          color3: { value: layer3.clone() },
          color4: { value: layer4.clone() },
          color5: { value: layer5.clone() },
          transition2: { value: 0.075 },
          transition3: { value: 0.18 },
          transition4: { value: 0.34 },
          transition5: { value: 0.62 },
          blend12: { value: 0.03 },
          blend23: { value: 0.045 },
          blend34: { value: 0.055 },
          blend45: { value: 0.065 },
        });

        atmosphereParams.push({
          particles: { value: 4000 },
          minParticleSize: { value: 50 },
          maxParticleSize: { value: 100 },
          radius: {
            value:
              planetParams[i].radius.value +
              Math.max(
                0,
                planetParams[i].amplitude.value + planetParams[i].offset.value
              ) +
              0.16,
          },
          thickness: { value: 1.5 },
          density: { value: 0 },
          opacity: { value: 0.2 },
          scale: { value: 8 },
          color: { value: new THREE.Color(0.45, 0.72, 1.0) },
          speed: { value: 0.03 },
          lightDirection: planetParams[i].lightDirection,
        });

        const ringGeometry = new THREE.TorusGeometry(distance, 0.04, 12, 128);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xaaaaaa,
          transparent: true,
          opacity: 1,
          depthWrite: false,
        });
        const trajectory = new THREE.Mesh(ringGeometry, ringMaterial);
        trajectory.rotation.x = Math.PI / 2;
        trajectories.push(trajectory);

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context) {
          context.font = "48px Arial";
          context.fillStyle = "white";
          context.fillText(labels[i], 0, 56);
        }
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(0, 1.5, 0);
        //sprite.scale.set(5, 2.5, 1);
        //planet.add(sprite);

        scene.add(planet);
        scene.add(trajectory);
      }

      const loader = new THREE.CubeTextureLoader();
      const texture = loader.load([
        "src/assets/images/raster/space_xp.png",
        "src/assets/images/raster/space_xn.png",
        "src/assets/images/raster/space_yp.png",
        "src/assets/images/raster/space_yn.png",
        "src/assets/images/raster/space_zp.png",
        "src/assets/images/raster/space_zn.png",
      ]);
      texture.mapping = THREE.CubeRefractionMapping;
      spaceBackgroundTexture = texture;
      scene.background = texture;

      render();
    }

    function disposeMaterial(obj: THREE.Object3D) {
      if ((obj as any).material) {
        (obj as any).material.dispose();
      }
    }

    function animate() {
      if (!zoom) {
        controls.update();

        const time = (performance.now() - timeOffset) * 0.05;
        for (let i = 0; i < planets.length; i++) {
          const { planet, distance, angleVelocity } = planets[i];
          const angle = planets[i].angle;
          planet.position.set(
            Math.cos(angle + angleVelocity * time) * distance,
            0,
            Math.sin(angle + angleVelocity * time) * distance
          );
        }
      }

      render();
    }

    function render() {
      stats.update();

      scene.traverse(darkenNonBloomed);
      bloomComposer.render();
      scene.traverse(restoreMaterial);

      // render the entire scene, then render bloom scene on top
      finalComposer.render();
    }

    function darkenNonBloomed(obj: THREE.Object3D) {
      if (
        ((obj as any).isMesh && bloomLayer.test(obj.layers) === false) ||
        (obj as any).isLine
      ) {
        materials[obj.uuid] = (obj as any).material;
        if (obj === proceduralPlanet && proceduralOcclusionMaterial) {
          (obj as any).material = proceduralOcclusionMaterial;
          return;
        }

        (obj as any).material = darkMaterial;
      }
    }

    function restoreMaterial(obj: THREE.Object3D) {
      if (materials[obj.uuid]) {
        (obj as THREE.Mesh).material = materials[obj.uuid];
        delete materials[obj.uuid];
      }
    }
  }, []);

  useEffect(() => {
    if (!sunMesh || !mainLight || !fillAmbientLight) {
      return;
    }

    const sunMaterial = sunMesh.material as THREE.MeshBasicMaterial;
    const targetSunScale = darkMode ? 2.4 : 3.0;
    const targetMainIntensity = darkMode ? 150 : 600;
    const targetAmbientIntensity = darkMode ? 0.8 : 3.0;
    const targetLightColor = darkMode
      ? new THREE.Color(0xbdd7ff)
      : new THREE.Color(0xffffff);
    const targetSunTint = darkMode
      ? new THREE.Color(0x876c00)
      : new THREE.Color(0xffcc00);

    gsap.to(mainLight, {
      duration: 0.7,
      intensity: targetMainIntensity,
      ease: "power2.inOut",
    });

    gsap.to(fillAmbientLight, {
      duration: 0.7,
      intensity: targetAmbientIntensity,
      ease: "power2.inOut",
    });

    gsap.to(sunMesh.scale, {
      duration: 0.7,
      x: targetSunScale,
      y: targetSunScale,
      z: targetSunScale,
      ease: "power2.inOut",
    });

    gsap.to(mainLight.color, {
      duration: 0.7,
      r: targetLightColor.r,
      g: targetLightColor.g,
      b: targetLightColor.b,
      ease: "power2.inOut",
    });

    gsap.to(sunMaterial.color, {
      duration: 0.7,
      r: targetSunTint.r,
      g: targetSunTint.g,
      b: targetSunTint.b,
      ease: "power2.inOut",
    });
  }, [darkMode]);

  return <div ref={mountRef} />;
};

export default Background;
export {
  BackgroundPlanetTransition,
  BackgroundMenuTransition,
  BackgroundFocusProjectPin,
  BackgroundProjectDiveTransition,
};
