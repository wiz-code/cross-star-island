import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { debounce } from 'throttle-debounce';

import FirstPersonControls from './controls';
import {
  Game,
  Scene,
  Camera,
  Renderer,
  Stages,
  Light,
  PlayerSettings,
  ResizeDelayTime,
  Grid,
  Ground,
} from './settings';
import { createGrid, createFineGrid } from './grid';
import { createGround } from './ground';
import { createStage } from './stages';

import CollisionObject from './object';
import Ammo from './ammo.old';
import Player from './player.old';

const { floor } = Math;

const init = () => {
  const clock = new THREE.Clock();

  let windowHalfX = floor(Renderer.Size.width / 2);
  let windowHalfY = floor(Renderer.Size.height / 2);

  const scene = {};

  scene.field = new THREE.Scene();
  scene.field.background = new THREE.Color(Scene.background);
  scene.field.fog = new THREE.Fog(
    Scene.Fog.color,
    Scene.Fog.near,
    Scene.Fog.far,
  );

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
    1000,
  );

  const container = document.getElementById('container');

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.autoClear = false;
  renderer.setClearColor(new THREE.Color(0x000000));
  renderer.setPixelRatio(Renderer.pixelRatio);
  renderer.setSize(Renderer.Size.width, Renderer.Size.height);
  // renderer.shadowMap.enabled = Renderer.ShadowMap.enabled;
  // renderer.shadowMap.type = Renderer.ShadowMap.type;
  // renderer.toneMapping = Renderer.ShadowMap.toneMapping;
  container.appendChild(renderer.domElement);

  const light = {};

  /* light.fill = new THREE.HemisphereLight(
    Light.Hemisphere.groundColor,
    Light.Hemisphere.color,
    Light.Hemisphere.intensity,
  );
  light.fill.position.set(2, 1, 1);
  scene.add(light.fill);

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
  scene.add(light.directional); */

  const worldOctree = new Octree();

  const stage = createStage('firstStage');
  scene.field.add(stage);

  worldOctree.fromGraphNode(stage);

  const collisionObject = new CollisionObject(scene.field, worldOctree);
  const stone = CollisionObject.createStone(80, 1, 15);
  stone.object.position.set(-2200, 300, 0);
  stone.collider.center = new THREE.Vector3(-2200, 300, 0);
  collisionObject.add(stone);
  const ammo = new Ammo(scene.field, worldOctree);
  const player = new Player(camera.field, ammo, collisionObject, worldOctree);

  setInterval(() => {
    stone.object.position.set(-2000, 300, 0);
    stone.velocity = new THREE.Vector3(0, 0, 0);
    stone.collider.center = new THREE.Vector3(-2200, 300, 0);
  }, 10000);

  player.init('firstStage');

  const controls = new FirstPersonControls(
    scene.screen,
    camera.field,
    player,
    renderer.domElement,
  );

  /* let helper = new THREE.Box3Helper(worldBox, 0xffff00);
  scene.add(helper);
  const helper = new OctreeHelper(worldOctree);
  helper.visible = false;
  scene.field.add(helper); */

  // helpers
  const axesHelper = new THREE.AxesHelper(180);
  scene.field.add(axesHelper);

  const stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = 'auto';
  stats.domElement.style.bottom = 0;
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

  const onResize = debounce(Game.ResizeDelayTime, onWindowResize);

  window.addEventListener('resize', onResize);

  return {
    container,
    scene,
    camera,
    controls,
    light,
    renderer,
    clock,
    collisionObject,
    ammo,
    player,
    stats,
  };
};

export default init;
