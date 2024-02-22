import {
  Scene as ThreeScene,
  Fog,
  PerspectiveCamera,
  OrthographicCamera,
  WebGLRenderer,
  Color,
  Clock,
  Vector3,
} from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { Octree } from 'three/addons/math/Octree.js';
import { debounce } from 'throttle-debounce';

import {
  Game as GameSettings,
  Scene,
  Camera,
  Renderer,
  Light,
  PlayerSettings,
  Grid,
  Ground,
  World,
} from './settings';

import FirstPersonControls from './controls';
import {
  Characters,
  Stages,
  Compositions,
  Tweeners,
  Ammo as AmmoData,
  Guns,
} from './data';
import CollidableManager from './collidable-manager';
import CharacterManager from './character-manager';
import SceneManager from './scene-manager';
import Character from './character';
import Ammo from './ammo';
import Gun from './gun';
import Obstacle from './obstacle';
import { createStage } from './stages';

const { floor, exp } = Math;

const resistances = Object.entries(World.Resistance);
const damping = {};
const getDamping = (delta) => {
  for (let i = 0, l = resistances.length; i < l; i += 1) {
    const [key, value] = resistances[i];
    const result = exp(-value * delta) - 1;
    damping[key] = result;
  }

  return damping;
};

class Game {
  constructor() {
    this.clock = new Clock();
    this.worldOctree = new Octree();

    this.windowHalf = {
      width: floor(window.innerWidth / 2),
      height: floor(window.innerHeight / 2),
    };

    this.container = document.getElementById('container');

    this.renderer = new WebGLRenderer({ antialias: false });
    this.renderer.autoClear = false;
    this.renderer.setClearColor(new Color(0x000000));
    this.renderer.setPixelRatio(Renderer.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.shadowMap.enabled = Renderer.ShadowMap.enabled;
    // renderer.shadowMap.type = Renderer.ShadowMap.type;
    // renderer.toneMapping = Renderer.ShadowMap.toneMapping;
    this.container.appendChild(this.renderer.domElement);

    this.scenes = new SceneManager(this.renderer);

    this.scene = {};
    this.camera = {};

    this.scene.field = new ThreeScene();
    this.scene.field.background = new Color(Scene.background);
    this.scene.field.fog = new Fog(
      Scene.Fog.color,
      Scene.Fog.near,
      Scene.Fog.far,
    );

    this.scene.screen = new ThreeScene();

    this.camera.field = new PerspectiveCamera(
      Camera.FOV,
      Camera.Aspect,
      Camera.near,
      Camera.far,
    );
    this.camera.field.rotation.order = Camera.order;
    this.camera.field.position.set(0, 0, 0);

    this.camera.screen = new OrthographicCamera(
      -this.windowHalf.width,
      this.windowHalf.width,
      this.windowHalf.height,
      -this.windowHalf.height,
      0.1,
      1000,
    );

    this.scenes.clear();
    this.scenes.add('field', this.scene.field, this.camera.field);
    this.scenes.add('screen', this.scene.screen, this.camera.screen);

    this.data = {};
    this.data.stages = new Map(Stages);
    this.data.characters = new Map(Characters);
    this.data.compositions = new Map(Compositions);
    this.data.ammos = new Map(AmmoData);
    this.data.guns = new Map(Guns);
    this.data.tweeners = new Map(Tweeners);

    this.objectManager = new CollidableManager(this.scene.field, this.worldOctree);
    this.characterManager = new CharacterManager(
      this.scene.field,
      this.objectManager,
      this.worldOctree,
    );

    this.ammos = new Map();
    const ammoNames = Array.from(this.data.ammos.keys());
    ammoNames.forEach((name) => {
      const ammo = new Ammo(name);
      this.ammos.set(name, ammo);
      this.objectManager.add('ammo', ammo);
    });

    this.guns = new Map();
    const gunNames = Array.from(this.data.guns.keys());
    gunNames.forEach((name) => {
      const gun = new Gun(name);
      const [ammoType] = gun.data.ammoTypes;
      const ammo = this.ammos.get(ammoType);
      gun.setAmmo(ammo);
      this.guns.set(name, gun);
    });

    // これらはステージごとに毎回生成破棄を実行する
    this.characters = new Map();
    this.obstacles = new Map();

    this.controls = null;
    this.player = null;
    this.stage = null;

    // ゲーム管理変数
    this.ready = false;
    this.mode = 'loading'; // 'loading', 'opening', 'play', 'gameover'
    this.stageIndex = 0;
    this.checkPointIndex = 0;

    /// ///////////////
    const player = new Character('player1', 'hero-1');

    this.setPlayer(player);
    this.setMode('play');

    this.ready = true;
    /// ///////////

    const onResize = function onResize() {
      const iw = window.innerWidth;
      const ih = window.innerHeight;
      this.windowHalf.width = floor(iw / 2);
      this.windowHalf.height = floor(ih / 2);

      this.camera.field.aspect = iw / ih;
      this.camera.field.updateProjectionMatrix();

      this.camera.screen.left = -this.windowHalf.width;
      this.camera.screen.right = this.windowHalf.width;
      this.camera.screen.top = this.windowHalf.height;
      this.camera.screen.bottom = -this.windowHalf.height;
      this.camera.screen.updateProjectionMatrix();

      this.renderer.setSize(iw, ih);

      if (this.ready) {
        this.controls.handleResize();
      }
    };

    this.onResize = debounce(GameSettings.resizeDelayTime, onResize.bind(this));

    window.addEventListener('resize', this.onResize);

    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.top = 'auto';
    this.stats.domElement.style.bottom = 0;
    this.container.appendChild(this.stats.domElement);
  }

  setPlayer(character) {
    this.player = character;
    this.player.setFPV(this.camera.field);

    const [gunType] = this.player.data.gunTypes;
    const gun = this.guns.get(gunType);
    this.player.setGun(gun);

    this.controls = new FirstPersonControls(
      this.scene.screen,
      this.camera.field,
      this.player,
      this.renderer.domElement,
    );
  }

  removePlayer(character) {
    if (this.player != null) {
      this.player.unsetFPV();
      this.player = null;
      this.controls.dispose();
    }
  }

  setMode(mode) {
    this.mode = mode;

    switch (this.mode) {
      case 'loading': {
      }
      case 'initial': {
      }
      case 'play': {
        this.setStage();

        break;
      }

      default: {
      }
    }
  }

  setStage(stageIndex) {
    const stageNameList = this.data.compositions.get('stage');

    const stageName = typeof stageIndex === 'number' ? stageNameList[stageIndex] : stageNameList[this.stageIndex];

    if (stageName == null) {
      return;
    }

    const stageData = this.data.stages.get(stageName);

    const { characters, obstacles } = stageData;
    const checkPoint = stageData.checkPoints[this.stageIndex];

    this.characters.clear();
    this.characterManager.clear();
    this.obstacles.clear();
    this.objectManager.clear('obstacle');

    characters.forEach((data, index) => {
      const id = `character-${index}`;
      const character = new Character(id, data.name, this.ammos);
      const [gunType] = character.data.gunTypes;
      const gun = this.guns.get(gunType);
      character.setGun(gun);
      character.setOnUpdate(data.update);
      character.setPosition(data.position, data.direction);
      this.characters.set(id, character);
      this.characterManager.add(character);
    });

    obstacles.forEach((data, index) => {
      const id = `obstacle-${index}`;
      const obstacle = new Obstacle(data.name);
      obstacle.collider.center.copy(data.position);
      data.tweeners.forEach((tweenerName) => {
        obstacle.addTweener(this.data.tweeners.get(tweenerName));
      });
      this.obstacles.set(id, obstacle);
      this.objectManager.add('obstacle', obstacle);
    });

    this.player.setPosition(checkPoint.position, checkPoint.direction);
    this.characterManager.add(this.player);

    this.clearStage();

    this.stage = createStage(stageName);
    this.scene.field.add(this.stage);
    this.worldOctree.fromGraphNode(this.stage);
  }

  clearStage() {
    if (this.stage != null) {
      this.scene.field.clear();
      this.worldOctree.clear();
    }
  }

  nextStage() {
    const currentIndex = this.stageIndex + 1;
    this.setStage(currentIndex);
  }

  rewindStage() {
    const currentIndex = this.stageIndex - 1;
    this.setStage(currentIndex);
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
  }

  start() {
    this.checkPointIndex = 0;
  }

  restart(checkPoint) {}

  clear() {}

  update() {
    if (!this.ready) {
      return;
    }

    const deltaTime = this.clock.getDelta() / GameSettings.stepsPerFrame;
    const damping = getDamping(deltaTime);

    for (let i = 0; i < GameSettings.stepsPerFrame; i += 1) {
      this.controls.update(deltaTime);
      this.characterManager.update(deltaTime, damping);
      this.objectManager.update(deltaTime, damping);
    }

    this.scenes.update();
    this.stats.update();
  }
}

export default Game;
