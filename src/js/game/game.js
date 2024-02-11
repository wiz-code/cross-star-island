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
} from './settings';

import FirstPersonControls from './controls';
import { Characters, Stages, Compositions } from './data';
import CollidableManager from './collidable-manager';
import CharacterManager from './character-manager';
import SceneManager from './scene-manager';
import Character from './character';
import Player from './player';
import Ammo from './ammo';
import { createStage } from './stages';

const { PI, floor } = Math;

const RAD_30 = (30 / 360) * PI * 2;

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

    this.data = {};
    this.data.stages = new Map(Stages);
    this.data.characters = new Map(Characters);
    this.data.compositions = new Map(Compositions);

    this.objects = new CollidableManager(this.scene.field, this.worldOctree);
    this.characters = new CharacterManager(
      this.scene.field,
      this.objects,
      this.worldOctree,
    );
    this.controls = null;

    this.player = null;
    this.stage = null;

    // const stage = createStage('firstStage');
    // scene.field.add(stage);

    /* const collisionObject = new CollisionObject(scene.field, worldOctree);
    const stone = CollisionObject.createStone(80, 1, 15);
    stone.object.position.set(-2200, 300, 0);
    stone.collider.center = new Vector3(-2200, 300, 0);
    collisionObject.add(stone);
    const ammo = new Ammo(scene.field, worldOctree);
    const player = new Player(camera.field, ammo, collisionObject, worldOctree);

    setInterval(() => {
      stone.object.position.set(-2000, 300, 0);
      stone.velocity = new Vector3(0, 0, 0);
      stone.collider.center = new Vector3(-2200, 300, 0);
    }, 10000);

    player.init('firstStage'); */

    // ゲーム管理変数
    this.ready = false;
    this.mode = 'loading'; // 'loading', 'opening', 'play', 'gameover'
    this.stageIndex = 0;
    this.checkPointIndex = 0;

//////////////////
    const data = this.data.stages.get('firstStage');
    const [checkPoint] = data.checkPoints
    const ammo = new Ammo('small-rounded');
    const ammos = new Map().set(ammo.name, ammo);
    this.objects.add('ammo', ammo);
    const player = new Player(this.camera.field, 'hero1', ammos);
    player.rotation.phi = checkPoint.direction;
    this.camera.field.rotation.y = checkPoint.direction;
    this.camera.field.rotation.x = -RAD_30;
    this.camera.field.getWorldDirection(player.direction);
    player.collider.start = checkPoint.position;
    player.collider.end = player.collider.start.clone();
    player.collider.end.y += player.data.height;

    this.setPlayer(player);
    this.ready = true;
    this.setMode('play');
//////////////

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
    if (this.player == null) {
      this.player = character;
      this.addCharacter(this.player);

      this.controls = new FirstPersonControls(
        this.scene.screen,
        this.camera.field,
        this.player,
        this.renderer.domElement,
      );
    }
  }

  setMode(mode) {
    this.mode = mode;

    switch (this.mode) {
      case 'loading': {}
      case 'initial': {}
      case 'play': {
        this.play();

        break;
      }

      default: {}
    }
  }

  play() {
    this.scenes.clear();
    this.scenes.add('field', this.scene.field, this.camera.field);
    this.scenes.add('screen', this.scene.screen, this.camera.screen);

    const stageNames = this.data.compositions.get('stage');
    const stageName = stageNames[this.stageIndex];

    if (this.stage != null) {
      this.worldOctree.clear();
    }

    this.stage = createStage(stageName);
    this.scene.field.add(this.stage);

    this.worldOctree.fromGraphNode(this.stage);
  }

  addCharacter(character) {
    this.characters.add(character);
  }

  removeCharacter(character) {
    if (this.player === character) {
      this.player = null;
      this.controls.dispose();
    }

    this.characters.remove(character);
  }

  setStage(stageIndex = 0) {
    // TODO: 前のステージを破棄する

    // 新しいステージを作成する
    const data = this.data.stages[stageIndex];

    if (data != null) {
      const [name] = data;
      /// //
    }
  }

  clearStage() {
    //
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

    for (let i = 0; i < GameSettings.stepsPerFrame; i += 1) {
      this.controls.update(deltaTime);
      this.characters.update(deltaTime);
      this.objects.update(deltaTime);
    }

    this.scenes.update();
    this.stats.update();
  }
}

export default Game;
