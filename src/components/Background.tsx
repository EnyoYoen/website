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

function isBackgroundZoomed() {
  return zoom;
}

// Zoom Transition function
function BackgroundPlanetTransition(planetIndex: number) {
  if (planetIndex < 0 || planetIndex >= planetCount || zoom) {
    return;
  }

  zoom = true;
  transitionTime = performance.now();

  const targetPlanet = planets[planetIndex].planet;
  const targetPosition = targetPlanet.position.clone();

  camera.lookAt(targetPosition);
  camera.updateProjectionMatrix();

  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.2;
  controls.target.copy(targetPosition);
  controls.update();

  /*let planetVertexShader = planetVert;
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

  const proceduralPlanet = new THREE.Mesh(
    new THREE.SphereGeometry(1, 128, 128),
    material
  );
  proceduralPlanet.geometry.computeTangents();
  proceduralPlanet.position.copy(targetPosition);
  scene.add(proceduralPlanet);*/

  for (let i = 0; i < trajectories.length; i++) {
    gsap.to(trajectories[i].material, {
      duration: 2,
      opacity: 0,
      onUpdate: () => {
        (trajectories[i].material as THREE.Material).transparent = true;
      },
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

  controls.enableZoom = true;
  controls.enablePan = true;
  controls.autoRotate = false;
  controls.target = new THREE.Vector3(0, 0, 0);
  controls.update();

  for (let i = 0; i < trajectories.length; i++) {
    scene.add(trajectories[i]);
    gsap.to(trajectories[i].material, {
      duration: 2,
      opacity: 1,
      onUpdate: () => {
        (trajectories[i].material as THREE.Material).transparent = false;
      },
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
const Background = () => {
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

      const ambientLight = new THREE.AmbientLight(0x606060, 3); // soft white light
      scene.add(ambientLight);

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

      const labels = ["Mercury", "Venus", "Earth", "Mars", "Jupiter"];

      let distance = 5;
      let scale = 1;

      for (let i = 0; i < planetCount; i++) {
        const color = new THREE.Color();
        color.setHSL(Math.random(), 0.7, Math.random() * 0.2 + 0.05);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const planet = new THREE.Mesh(geometry, material);
        planet.castShadow = true;
        planet.receiveShadow = true;

        distance += (2 + (Math.random() * 5 + scale)) * 0.6;
        const angle = Math.random() * Math.PI * 2;
        const angleVelocity = Math.random() * 0.01 + 0.01;
        scale = Math.random() * 0.5 + 0.5;

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
          amplitude: { value: 1.19 },
          sharpness: { value: 2.6 },
          offset: { value: -0.016 },
          period: { value: 0.6 },
          persistence: { value: 0.484 },
          lacunarity: { value: 1.8 },
          octaves: { value: 10 },
          undulation: { value: 0.0 },
          ambientIntensity: { value: 0.02 },
          diffuseIntensity: { value: 1 },
          specularIntensity: { value: 2 },
          shininess: { value: 10 },
          lightDirection: { value: new THREE.Vector3(1, 1, 1) },
          lightColor: { value: new THREE.Color(0xffffff) },
          bumpStrength: { value: 1.0 },
          bumpOffset: { value: 0.001 },
          color1: { value: new THREE.Color(0.014, 0.117, 0.279) },
          color2: { value: new THREE.Color(0.08, 0.527, 0.351) },
          color3: { value: new THREE.Color(0.62, 0.516, 0.372) },
          color4: { value: new THREE.Color(0.149, 0.254, 0.084) },
          color5: { value: new THREE.Color(0.15, 0.15, 0.15) },
          transition2: { value: 0.071 },
          transition3: { value: 0.215 },
          transition4: { value: 0.372 },
          transition5: { value: 1.2 },
          blend12: { value: 0.152 },
          blend23: { value: 0.152 },
          blend34: { value: 0.104 },
          blend45: { value: 0.168 },
        });

        atmosphereParams.push({
          particles: { value: 4000 },
          minParticleSize: { value: 50 },
          maxParticleSize: { value: 100 },
          radius: { value: planetParams[i].radius.value + 1 },
          thickness: { value: 1.5 },
          density: { value: 0 },
          opacity: { value: 0.35 },
          scale: { value: 8 },
          color: { value: new THREE.Color(0xffffff) },
          speed: { value: 0.03 },
          lightDirection: planetParams[i].lightDirection,
        });

        const ringGeometry = new THREE.RingGeometry(
          distance - 0.04,
          distance + 0.04,
          64
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xaaaaaa,
          side: THREE.DoubleSide,
        });
        const trajectory = new THREE.Mesh(ringGeometry, ringMaterial);
        trajectory.rotation.x = -Math.PI / 2;
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

  return <div ref={mountRef} />;
};

export default Background;
export {
  BackgroundPlanetTransition,
  BackgroundMenuTransition,
  isBackgroundZoomed,
};
