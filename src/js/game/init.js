import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { debounce } from 'throttle-debounce';

import { FirstPersonControls } from './controls';
import { Scene, Camera, Renderer, Light, ResizeDelayTime } from './settings';
import { createGrid } from './grid';
import { createGround } from './ground';

const { floor } = Math;

const init = () => {
  const clock = new THREE.Clock();

  let windowHalfX = floor(Renderer.Size.width / 2);
  let windowHalfY = floor(Renderer.Size.height / 2);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(Scene.background);
  scene.fog = new THREE.Fog(Scene.Fog.color, Scene.Fog.near, Scene.Fog.far);

  const camera = new THREE.PerspectiveCamera(
    Camera.FOV,
    Camera.Aspect,
    Camera.near,
    Camera.far,
  );
  camera.rotation.order = Camera.order;
  camera.position.set(0, 0, 100);

  const light = {};

  light.fill = new THREE.HemisphereLight(
    Light.Hemisphere.groundColor,
    Light.Hemisphere.color,
    Light.Hemisphere.intensity,
  );
  light.fill.position.set(2, 1, 1);
  // scene.add(light.fill);

  light.directional = new THREE.DirectionalLight(
    Light.Directional.color,
    Light.Directional.intensity,
  );

  light.directional.castShadow = Light.Directional.castShadow;
  light.directional.shadow.camera.near = Light.Directional.near;
  light.directional.shadow.camera.far = Light.Directional.Shadow.far;
  light.directional.shadow.camera.right = Light.Directional.Shadow.right;
  light.directional.shadow.camera.left = Light.Directional.Shadow.left;
  light.directional.shadow.camera.top = Light.Directional.Shadow.top;
  light.directional.shadow.camera.bottom = Light.Directional.Shadow.bottom;
  light.directional.shadow.mapSize.width =
    Light.Directional.Shadow.MapSize.width;
  light.directional.shadow.mapSize.height =
    Light.Directional.Shadow.MapSize.height;
  light.directional.shadow.radius = Light.Directional.Shadow.radius;
  light.directional.shadow.bias = Light.Directional.Shadow.bias;

  light.directional.position.set(
    Light.Directional.Position.x,
    Light.Directional.Position.y,
    Light.Directional.Position.z,
  );
  // scene.add(light.directional);

  const grid = createGrid();
  scene.add(grid);

  const ground = createGround();
  scene.add(ground);

  const container = document.getElementById('container');

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setClearColor(new THREE.Color(0x000000));
  renderer.setPixelRatio(Renderer.pixelRatio);
  renderer.setSize(Renderer.Size.width, Renderer.Size.height);
  renderer.shadowMap.enabled = Renderer.ShadowMap.enabled;
  renderer.shadowMap.type = Renderer.ShadowMap.type;
  renderer.toneMapping = Renderer.ShadowMap.toneMapping;
  container.appendChild(renderer.domElement);

  const controls = new FirstPersonControls(camera, renderer.domElement);
  controls.movementSpeed = 100;
  controls.lookSpeed = 0.2;

  const stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild(stats.domElement);

  const onWindowResize = () => {
    const iw = window.innerWidth;
    const ih = window.innerHeight;
    windowHalfX = floor(iw / 2);
    windowHalfY = floor(ih / 2);

    camera.aspect = iw / ih;
    camera.updateProjectionMatrix();

    renderer.setSize(iw, ih);
    controls.handleResize();
  };

  const onResize = debounce(ResizeDelayTime, onWindowResize);

  window.addEventListener('resize', onResize);

  return {
    container,
    scene,
    camera,
    light,
    renderer,
    clock,
    controls,
    stats,
  };
};

export default init;
