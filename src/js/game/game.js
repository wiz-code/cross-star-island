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
import { Octree } from 'three/addons/math/Octree.js';
import { debounce } from 'throttle-debounce';

import {
  Game as GameSettings,
  Scene,
  Camera,
  Renderer,
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
import Loop from './loop';
import CollidableManager from './collidable-manager';
import CharacterManager from './character-manager';
import SceneManager from './scene-manager';
import Character from './character';
import Ammo from './ammo';
import Gun from './gun';
import Obstacle from './obstacle';
import Item from './item';
import createStage from './stages';

const { floor, exp } = Math;

const resistances = Object.entries(World.Resistance);
const dampingData = {};
const getDamping = (delta) => {
  for (let i = 0, l = resistances.length; i < l; i += 1) {
    const [key, value] = resistances[i];
    const result = exp(-value * delta) - 1;
    dampingData[key] = result;
  }

  return dampingData;
};

class Game {
  #elapsedTime = 0;

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
    this.sceneManager = new SceneManager(this.container, this.renderer);

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

    this.sceneManager.clear();
    this.sceneManager.add('field', this.scene.field, this.camera.field);
    this.sceneManager.add('screen', this.scene.screen, this.camera.screen);

    this.data = {};
    this.data.stages = new Map(Stages);
    this.data.characters = new Map(Characters);
    this.data.compositions = new Map(Compositions);
    this.data.ammos = new Map(AmmoData);
    this.data.guns = new Map(Guns);
    this.data.tweeners = new Map(Tweeners);

    this.objectManager = new CollidableManager(
      this.scene.field,
      this.worldOctree,
    );
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
      this.objectManager.add(ammo.list);
    });

    this.controls = null;
    this.player = null;
    this.stage = null;

    // ゲーム管理変数
    this.ready = false;
    this.mode = 'loading'; // 'loading', 'opening', 'play', 'gameover'
    this.stageIndex = 0;
    this.checkpointIndex = 0;

    /// ///////////////
    const player = new Character('hero-1');

    this.setPlayer(player);
    this.setMode('play');

    this.ready = true;
    this.loop = new Loop(this.update, this);

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

    this.nextCheckpoint = this.nextCheckpoint.bind(this);
    this.weaponUpgrade = this.weaponUpgrade.bind(this);
    this.objectManager.subscribe('nextCheckpoint', this.nextCheckpoint);
    this.objectManager.subscribe('weaponUpgrade', this.weaponUpgrade);
  }

  getElapsedTime() {
    return this.#elapsedTime;
  }

  resetTime() {
    this.#elapsedTime = 0;
  }

  setPlayer(character) {
    this.player = character;
    this.player.setFPV(this.camera.field);

    this.teleportCharacter = this.teleportCharacter.bind(this);
    this.player.subscribe('oob', this.teleportCharacter);

    const { gunTypes } = this.player.data;

    gunTypes.forEach((name, index) => {
      const gun = new Gun(name);
      const [ammoType] = gun.data.ammoTypes;
      const ammo = this.ammos.get(ammoType);
      gun.setAmmo(ammo);
      this.player.addGun(gun);

      if (index === 0) {
        this.player.setGunType(name);
      }
    });

    this.controls = new FirstPersonControls(
      this.scene.screen,
      this.camera.field,
      this.player,
      this.renderer.domElement,
    );
  }

  removePlayer() {
    if (this.player != null) {
      this.player.unsetFPV();
      this.player = null;
      this.controls.dispose();
    }
  }

  teleportCharacter(character) {
    const stageNameList = this.data.compositions.get('stage');
    const stageName = stageNameList[this.stageIndex];
    const stageData = this.data.stages.get(stageName);

    if (character.isFPV()) {
      const checkpoint = stageData.checkpoints[this.checkpointIndex];
      character.velocity.copy(new Vector3(0, 0, 0));
      character.setPosition(
        checkpoint.position,
        checkpoint.phi,
        checkpoint.theta,
      );
    }
  }

  weaponUpgrade() {
    if (this.player != null) {
      if (this.player.guns.has(this.player.gunType)) {
        const gun = this.player.guns.get(this.player.gunType);
        const { ammoTypes } = gun.data;
        const { name } = gun.ammo;
        const index = ammoTypes.indexOf(name);

        if (index > -1) {
          const ammoType = ammoTypes[index + 1];

          if (ammoType != null) {
            const ammo = this.ammos.get(ammoType);
            this.player.setAmmo(ammo);
          }
        }
      }
    }
  }

  nextCheckpoint() {
    this.checkpointIndex += 1;
  }

  setMode(mode) {
    this.mode = mode;

    switch (this.mode) {
      case 'loading': {
        break;
      }
      case 'initial': {
        break;
      }
      case 'play': {
        this.setStage();

        break;
      }

      default: {
        //
      }
    }
  }

  setStage(stageIndex) {
    const stageNameList = this.data.compositions.get('stage');

    const stageName =
      typeof stageIndex === 'number'
        ? stageNameList[stageIndex]
        : stageNameList[this.stageIndex];

    if (stageName == null) {
      return;
    }

    const stageData = this.data.stages.get(stageName);

    const { characters, obstacles, items } = stageData;
    const checkpoint = stageData.checkpoints[this.checkpointIndex];

    this.characterManager.clear();
    this.objectManager.removeAll('type', 'obstacle');
    this.objectManager.removeAll('type', 'item');

    characters.forEach((data) => {
      const character = new Character(data.name);
      const { gunTypes } = character.data;

      gunTypes.forEach((name, index) => {
        const gun = new Gun(name);
        let ammoType;

        if (data.ammoType != null) {
          ({ ammoType } = data);
        } else {
          [ammoType] = gun.data.ammoTypes;
        }

        const ammo = this.ammos.get(ammoType);
        gun.setAmmo(ammo);
        character.addGun(gun);

        if (index === 0) {
          character.setGunType(name);
        }
      });

      character.setOnUpdate(data.update);
      character.setPosition(data.position, data.phi, data.theta);

      if (data.tweeners != null) {
        data.tweeners.forEach(({ name, arg }) => {
          const tweener = this.data.tweeners.get(name);
          character.addTweener(tweener, arg);
        });
      }

      this.characterManager.add(character, data);
    });

    items.forEach((data) => {
      const item = new Item(data.name);
      item.collider.center.copy(data.position);

      if (item.tweeners != null) {
        item.tweeners.forEach(({ name, arg }) => {
          const tweener = this.data.tweeners.get(name);
          item.addTweener(tweener, arg);
        });
      }

      item.setOnUpdate(data.update);
      this.objectManager.add(item, data);
    });

    obstacles.forEach((data) => {
      const obstacle = new Obstacle(data.name);
      obstacle.collider.center.copy(data.position);

      if (data.tweeners != null) {
        data.tweeners.forEach(({ name, arg }) => {
          const tweener = this.data.tweeners.get(name);
          obstacle.addTweener(tweener, arg);
        });
      }

      obstacle.setOnUpdate(data.update);
      this.objectManager.add(obstacle, data);
    });

    this.player.setPosition(
      checkpoint.position,
      checkpoint.phi,
      checkpoint.theta,
    );
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
    if (this.player != null) {
      this.player.setActive(true);
      this.controls.enable(true);
    }

    this.clock.start();
    this.loop.start();
  }

  stop() {
    if (this.player != null) {
      this.player.setActive(false);
      this.controls.enable(false);
    }

    this.clock.stop();
    this.loop.stop();
  }

  restart(checkpoint) {}

  clear() {}

  update() {
    if (!this.ready) {
      return;
    }

    const deltaTime = this.clock.getDelta() / GameSettings.stepsPerFrame;
    const damping = getDamping(deltaTime);

    for (let i = 0; i < GameSettings.stepsPerFrame; i += 1) {
      this.#elapsedTime += deltaTime;
      this.controls.update(deltaTime);
      this.characterManager.update(deltaTime, this.#elapsedTime, damping);
      this.objectManager.update(deltaTime, this.#elapsedTime, damping);
    }

    this.sceneManager.update();
  }
}

export default Game;
