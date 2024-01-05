import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { debounce } from 'throttle-debounce';

import { FirstPersonControls } from './controls';
import { Scene, Camera, Renderer, Light, Controls, PlayerSettings, ResizeDelayTime } from './settings';
import { createGrid } from './grid';
import { createGround } from './ground';
import { createSight, createPovIndicator } from './screen';
import Player from './player';

const { floor } = Math;

const init = () => {
  const clock = new THREE.Clock();

  let windowHalfX = floor(Renderer.Size.width / 2);
  let windowHalfY = floor(Renderer.Size.height / 2);

  const scene = {};

  scene.field = new THREE.Scene();
  scene.field.background = new THREE.Color(Scene.background);
  scene.field.fog = new THREE.Fog(Scene.Fog.color, Scene.Fog.near, Scene.Fog.far);

  scene.screen = new THREE.Scene();

  const camera = {};

  camera.field = new THREE.PerspectiveCamera(
    Camera.FOV,
    Camera.Aspect,
    Camera.near,
    Camera.far,
  );
  camera.field.rotation.order = Camera.order;
  camera.field.position.set(0, 0, 0);

  camera.screen = new THREE.OrthographicCamera(
    -windowHalfX,
    windowHalfX,
    windowHalfY,
    -windowHalfY,
    0.1,
    1000
  );


  const container = document.getElementById('container');

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.autoClear = false;
  renderer.setClearColor(new THREE.Color(0x000000));
  renderer.setPixelRatio(Renderer.pixelRatio);
  renderer.setSize(Renderer.Size.width, Renderer.Size.height);
  //renderer.shadowMap.enabled = Renderer.ShadowMap.enabled;
  //renderer.shadowMap.type = Renderer.ShadowMap.type;
  //renderer.toneMapping = Renderer.ShadowMap.toneMapping;
  container.appendChild(renderer.domElement);

  const grid = createGrid();
  scene.field.add(grid);

  const ground = createGround();
  scene.field.add(ground);

  const povSight = createSight();
  scene.screen.add(povSight);

  const povIndicator = createPovIndicator();
  scene.screen.add(povIndicator);

  const controls = new FirstPersonControls(camera.field, renderer.domElement, povSight, povIndicator);
  controls.movementSpeed = Controls.movementSpeed;
  controls.lookSpeed = Controls.lookSpeed;
  //controls.lookVertical = false;//////

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



  /*const direction = new THREE.Vector3();
  direction.normalize();
  const origin = new THREE.Vector3();
  const length = 100;
  const hex = 0xffffff;
  const arrow = new THREE.ArrowHelper(direction, origin, length, hex);
  scene.add(arrow);*/

  //worldOctree.fromGraphNode(grid);
  const worldOctree = new Octree();
  worldOctree.fromGraphNode(ground);
  const player = new Player(camera.field, controls, worldOctree);

  ////
  //let helper = new THREE.Box3Helper(worldBox, 0xffff00);
  //scene.add(helper);
  const helper = new OctreeHelper(worldOctree);
	helper.visible = false;
	scene.field.add( helper );


  // helpers
  const axesHelper = new THREE.AxesHelper(180);
  scene.field.add(axesHelper);

  const stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild(stats.domElement);

  const onWindowResize = () => {
    const iw = window.innerWidth;
    const ih = window.innerHeight;
    windowHalfX = floor(iw / 2);
    windowHalfY = floor(ih / 2);

    camera.field.aspect = iw / ih;
    camera.field.updateProjectionMatrix();

    camera.screen.left = -windowHalfX;
    camera.screen.right = windowHalfX;
    camera.screen.top = windowHalfY;
    camera.screen.bottom = -windowHalfY;
    camera.screen.updateProjectionMatrix();

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
    player,
    controls,
    stats,
  };
};

export default init;
