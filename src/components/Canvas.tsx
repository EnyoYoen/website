import { useEffect, useRef } from "react";
import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const Canvas3 = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let container: HTMLDivElement | null = mountRef.current;

    let stats: Stats;
    let camera: THREE.PerspectiveCamera,
      scene: THREE.Scene,
      renderer: THREE.WebGLRenderer;

    let mouseX = 0,
      mouseY = 0;

    let windowHalfX = container
      ? container.offsetWidth / 2
      : window.innerWidth / 2;
    let windowHalfY = container
      ? container.offsetHeight / 2
      : window.innerHeight / 2;

    function init() {
      if (!container) return;

      camera = new THREE.PerspectiveCamera(
        20,
        window.innerWidth / window.innerHeight,
        1,
        10000
      );
      camera.position.z = 1800;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);

      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(0, 0, 1);
      scene.add(light);

      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;

      const context = canvas.getContext("2d");
      if (!context) return;

      const gradient = context.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      );
      gradient.addColorStop(0.1, "rgba(210,210,210,1)");
      gradient.addColorStop(1, "rgba(255,255,255,1)");

      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      const shadowTexture = new THREE.CanvasTexture(canvas);
      const shadowMaterial = new THREE.MeshBasicMaterial({
        map: shadowTexture,
      });
      const shadowGeo = new THREE.PlaneGeometry(300, 300, 1, 1);

      let shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
      shadowMesh.position.y = -250;
      shadowMesh.rotation.x = -Math.PI / 2;
      scene.add(shadowMesh);

      shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
      shadowMesh.position.y = -250;
      shadowMesh.position.x = -400;
      shadowMesh.rotation.x = -Math.PI / 2;
      scene.add(shadowMesh);

      shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
      shadowMesh.position.y = -250;
      shadowMesh.position.x = 400;
      shadowMesh.rotation.x = -Math.PI / 2;
      scene.add(shadowMesh);

      const radius = 200;
      const geometry1 = new THREE.IcosahedronGeometry(radius, 1);
      const count = geometry1.attributes.position.count;
      geometry1.setAttribute(
        "color",
        new THREE.BufferAttribute(new Float32Array(count * 3), 3)
      );

      const geometry2 = geometry1.clone();
      const geometry3 = geometry1.clone();

      const color = new THREE.Color();
      const positions1 = geometry1.attributes.position;
      const positions2 = geometry2.attributes.position;
      const positions3 = geometry3.attributes.position;
      const colors1 = geometry1.attributes.color;
      const colors2 = geometry2.attributes.color;
      const colors3 = geometry3.attributes.color;

      for (let i = 0; i < count; i++) {
        color.setHSL(
          (positions1.getY(i) / radius + 1) / 2,
          1.0,
          0.5,
          THREE.SRGBColorSpace
        );
        colors1.setXYZ(i, color.r, color.g, color.b);

        color.setHSL(
          0,
          (positions2.getY(i) / radius + 1) / 2,
          0.5,
          THREE.SRGBColorSpace
        );
        colors2.setXYZ(i, color.r, color.g, color.b);

        color.setRGB(
          1,
          0.8 - (positions3.getY(i) / radius + 1) / 2,
          0,
          THREE.SRGBColorSpace
        );
        colors3.setXYZ(i, color.r, color.g, color.b);
      }

      const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: true,
        vertexColors: true,
        shininess: 0,
      });

      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true,
        transparent: true,
      });

      let mesh = new THREE.Mesh(geometry1, material);
      let wireframe = new THREE.Mesh(geometry1, wireframeMaterial);
      mesh.add(wireframe);
      mesh.position.x = -400;
      mesh.rotation.x = -Math.PI / 2;
      scene.add(mesh);

      mesh = new THREE.Mesh(geometry2, material);
      wireframe = new THREE.Mesh(geometry2, wireframeMaterial);
      mesh.add(wireframe);
      mesh.position.x = 400;
      scene.add(mesh);

      mesh = new THREE.Mesh(geometry3, material);
      wireframe = new THREE.Mesh(geometry3, wireframeMaterial);
      mesh.add(wireframe);
      scene.add(mesh);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      container.appendChild(renderer.domElement);

      stats = new Stats();
      container.appendChild(stats.dom);

      document.addEventListener("mousemove", onDocumentMouseMove);
      window.addEventListener("resize", onWindowResize);
    }

    function onWindowResize() {
      windowHalfX = container
        ? container.offsetWidth / 2
        : window.innerWidth / 2;
      windowHalfY = container
        ? container.offsetHeight / 2
        : window.innerHeight / 2;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onDocumentMouseMove(event: { clientX: number; clientY: number }) {
      mouseX = event.clientX - windowHalfX;
      mouseY = event.clientY - windowHalfY;
    }

    function animate() {
      render();
      stats.update();
    }

    function render() {
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;

      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    }

    init();

    return () => {
      if (container) {
        container.removeChild(renderer.domElement);
      }
      document.removeEventListener("mousemove", onDocumentMouseMove);
      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

  return <div ref={mountRef} />;
};

const Canvas2 = () => {
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

    const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
    const materials: { [key: string]: THREE.Material } = {};

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      1,
      200
    );
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.addEventListener("change", render);

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
            gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
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

    const raycaster = new THREE.Raycaster();

    const mouse = new THREE.Vector2();

    window.addEventListener("pointerdown", onPointerDown);

    /*const gui = new GUI();

    const bloomFolder = gui.addFolder("bloom");

    bloomFolder.add(params, "threshold", 0.0, 1.0).onChange(function (value) {
      bloomPass.threshold = Number(value);
      render();
    });

    bloomFolder.add(params, "strength", 0.0, 3).onChange(function (value) {
      bloomPass.strength = Number(value);
      render();
    });

    bloomFolder
      .add(params, "radius", 0.0, 1.0)
      .step(0.01)
      .onChange(function (value) {
        bloomPass.radius = Number(value);
        render();
      });

    const toneMappingFolder = gui.addFolder("tone mapping");

    toneMappingFolder
      .add(params, "exposure", 0.1, 2)
      .onChange(function (value) {
        renderer.toneMappingExposure = Math.pow(value, 4.0);
        render();
      });*/

    setupScene();

    function onPointerDown(event: { clientX: number; clientY: number }) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, false);
      if (intersects.length > 0) {
        const object = intersects[0].object;
        object.layers.toggle(BLOOM_SCENE);
        render();
      }
    }

    window.onresize = function () {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);

      bloomComposer.setSize(width, height);
      finalComposer.setSize(width, height);

      render();
    };

    function setupScene() {
      scene.traverse(disposeMaterial);
      scene.children.length = 0;

      const geometry = new THREE.IcosahedronGeometry(1, 15);

      for (let i = 0; i < 50; i++) {
        const color = new THREE.Color();
        color.setHSL(Math.random(), 0.7, Math.random() * 0.2 + 0.05);

        const material = new THREE.MeshBasicMaterial({ color: color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = Math.random() * 10 - 5;
        sphere.position.y = Math.random() * 10 - 5;
        sphere.position.z = Math.random() * 10 - 5;
        sphere.position.normalize().multiplyScalar(Math.random() * 4.0 + 2.0);
        sphere.scale.setScalar(Math.random() * Math.random() + 0.5);
        scene.add(sphere);

        if (Math.random() < 0.25) sphere.layers.enable(BLOOM_SCENE);
      }

      render();
    }

    function disposeMaterial(obj: THREE.Object3D) {
      if ((obj as any).material) {
        (obj as any).material.dispose();
      }
    }

    function render() {
      scene.traverse(darkenNonBloomed);
      bloomComposer.render();
      scene.traverse(restoreMaterial);

      // render the entire scene, then render bloom scene on top
      finalComposer.render();
    }

    function darkenNonBloomed(obj: THREE.Object3D) {
      if ((obj as any).isMesh && bloomLayer.test(obj.layers) === false) {
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

export { Canvas2, Canvas3 };
