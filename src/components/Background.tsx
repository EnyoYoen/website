import { useEffect, useRef } from "react";
import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

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

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      1,
      200
    );
    camera.position.set(30, 50, 30);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 0.8;
    controls.panSpeed = 0.8;

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

    let planets: {
      planet: THREE.Mesh;
      distance: number;
      angle: number;
      angleVelocity: number;
    }[] = [];

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

      const planetNumber = 5;
      const labels = ["Mercury", "Venus", "Earth", "Mars", "Jupiter"];

      let distance = 5;
      let scale = 1;

      for (let i = 0; i < planetNumber; i++) {
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
      controls.update();

      const time = performance.now() * 0.05;
      for (let i = 0; i < planets.length; i++) {
        const { planet, distance, angleVelocity } = planets[i];
        const angle = planets[i].angle;
        planet.position.set(
          Math.cos(angle + angleVelocity * time) * distance,
          0,
          Math.sin(angle + angleVelocity * time) * distance
        );
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
