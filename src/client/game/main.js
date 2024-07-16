import {
  Scene as ThreeScene,
  Fog,
  FogExp2,
  PerspectiveCamera,
  OrthographicCamera,
  WebGLRenderer,
  Color,
  Clock,
  AmbientLight,
} from 'three';
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';
import { debounce } from 'throttle-debounce';

import {
  Game as GameSettings,
  Scene,
  Camera,
  Renderer,
  World,
  Light,
} from './settings';
import FirstPersonControls from './controls';
import GamepadControls from './gamepad-controls';
import {
  GameStates,
  GameMethods,
  Characters,
  Stages,
  Compositions,
  Ammos,
  Guns,
  Sounds,
} from './data';
import { handlers, Tweeners, Updaters } from './handlers';
import CollidableManager from './collidable-manager';
import SceneManager from './scene-manager';
import ModelManager from './model-manager';
import EventManager from './event-manager';
import SoundManager from './sound-manager';
import ScoreManager from './score-manager';
import MovableManager from './movable-manager';
import GridProcessor from './grid-processor';
import Character from './character';
import Ammo from './ammo';
import Gun from './gun';
import Obstacle from './obstacle';
import Item from './item';
import Movable from './movable';
import TextureManager from './texture-manager';
import createStage from './stages';
import {
  leftToRightHandedQuaternion,
  addOffsetToPosition,
  disposeObject,
} from './utils';

const { floor, exp } = Math;

const resistances = Object.entries(World.Resistance);
const dampingData = {};
const getDamping = (delta) => {
  for (let i = 0, l = resistances.length; i < l; i += 1) {
    const [key, value] = resistances[i];
    // const result = exp(-value * delta) - 1;
    const result = value * delta;
    dampingData[key] = result;
  }

  return dampingData;
};
const canvas = document.createElement('canvas');
globalThis.gamepadIndex = -1;

class Game {
  #elapsedTime = 0;

  constructor(width, height, callbacks, params) {
    this.clock = new Clock();
    this.callbacks = callbacks;
    this.params = params;

    this.data = {};
    this.data.stages = new Map(Stages);
    this.data.characters = new Map(Characters);
    this.data.compositions = new Map(Compositions);
    this.data.ammos = new Map(Ammos);
    this.data.guns = new Map(Guns);
    this.data.sounds = new Map(Sounds);
    this.data.handlers = handlers;
    this.data.tweeners = new Map(Tweeners);
    this.data.updaters = new Map(Updaters);

    // ゲーム管理変数
    this.game = {};
    this.game.states = new Map(GameStates);
    const [sname] = this.data.compositions.get('stage'); /// ////////////
    this.game.states.set('stageName', sname);
    this.game.methods = new Map(GameMethods);
    this.game.methods.forEach((value, key, map) =>
      map.set(key, value.bind(this)),
    );
    this.game.ammos = new Map();
    this.game.characters = new Set();
    this.game.items = new Set();
    this.game.obstacles = new Set();

    this.loadingList = [];
    this.cache = { controls: null };

    this.windowHalf = {
      width: floor(width / 2),
      height: floor(height / 2),
    };

    this.container = document.getElementById('container');

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      preserveDrawingBuffer: true,
    });
    /*this.renderer = new WebGPURenderer({
      canvas,
      antialias: false,
      preserveDrawingBuffer: true,
    });*/
    this.renderer.autoClear = false;
    this.renderer.setClearColor(new Color(0x000000));
    this.renderer.setPixelRatio(Renderer.pixelRatio);
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    this.textureManager = new TextureManager();
    this.texture = this.textureManager.toObject();
    this.sceneManager = new SceneManager(this.container, this.renderer);

    this.scene = {};
    this.camera = {};

    this.scene.field = new ThreeScene();
    this.scene.field.background = new Color(Scene.background);
    /* this.scene.field.fog = new Fog(
      Scene.Fog.color,
      Scene.Fog.near,
      Scene.Fog.far,
    ); */
    this.scene.field.fog = new FogExp2(Scene.Fog.color, Scene.Fog.density);

    this.scene.screen = new ThreeScene();
    const indicators = SceneManager.createIndicators(this.texture);
    const { povSight, povSightLines, povIndicator, centerMark } = indicators;
    this.scene.screen.add(povSight);
    this.scene.screen.add(povSightLines);
    this.scene.screen.add(povIndicator.horizontal);
    this.scene.screen.add(povIndicator.vertical);
    this.scene.screen.add(centerMark);

    this.modelManager = new ModelManager(this.scene.field);
    this.eventManager = new EventManager(this.game);

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

    this.soundManager = new SoundManager(this.camera.field, this.scene.field);
    const promise = this.soundManager.loadSounds();
    this.scoreManager = new ScoreManager(this.game);
    this.movableManager = new MovableManager(this.game); /// ///////
    this.gridProcessor = new GridProcessor();/////////
    this.loadingList.push(promise);

    this.sceneManager.clear();
    this.sceneManager.add('field', this.scene.field, this.camera.field);
    this.sceneManager.add('screen', this.scene.screen, this.camera.screen);

    this.light = {};
    this.light.ambient = new AmbientLight(
      Light.Ambient.color,
      Light.Ambient.intensity,
    );
    this.scene.field.add(this.light.ambient);

    this.objectManager = new CollidableManager(
      this.game,
      this.scene.field,
      this.camera.field,
      this.eventManager,
      this.movableManager,
    );

    if (globalThis.gamepadIndex > -1) {
      this.controls = this.createGamepadControls(
        globalThis.gamepadIndex,
        indicators,
      );
    } else {
      this.controls = new FirstPersonControls(
        indicators,
        this.camera.field,
        this.renderer.domElement,
      );
    }

    this.game.stage = null;
    this.player = null;

    this.setMode('loading');

    const onGamepadConnected = (e) => {
      const { index } = e.gamepad;
      this.game.states.set('gamepad', true);
      globalThis.gamepadIndex = index;

      this.cache.controls = this.controls;

      this.player.unsetControls();
      this.controls = this.createGamepadControls(index, indicators);
      this.player.setControls(this.controls, this.camera.field);

      const stageName = this.game.states.get('stageName');
      const stageData = this.game.methods.get('getStageData')?.(stageName);

      const checkpointIndex = this.game.states.get('checkpointIndex');
      const checkpoint = stageData.checkpoints[checkpointIndex];
      const { offset } = stageData.sections[checkpointIndex];

      const position = addOffsetToPosition(checkpoint.position, offset);
      this.player.setPosition(position, checkpoint.phi, checkpoint.theta);
    };

    const onGamepadDisconnected = () => {
      this.player.unsetControls();

      if (this.cache.controls != null) {
        this.controls = this.cache.controls;
        this.player.setControls(this.cache.controls, this.camera.field);
      }
    };

    this.onGamepadConnected = onGamepadConnected.bind(this);
    this.onGamepadDisconnected = onGamepadDisconnected.bind(this);

    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);

    const onResize = function onResize() {
      const { width: containerWidth, height: containerHeight } =
        this.container.getBoundingClientRect();
      this.windowHalf.width = floor(containerWidth / 2);
      this.windowHalf.height = floor(containerHeight / 2);

      this.camera.field.aspect = containerWidth / containerHeight;
      this.camera.field.updateProjectionMatrix();

      this.camera.screen.left = -this.windowHalf.width;
      this.camera.screen.right = this.windowHalf.width;
      this.camera.screen.top = this.windowHalf.height;
      this.camera.screen.bottom = -this.windowHalf.height;
      this.camera.screen.updateProjectionMatrix();

      this.renderer.setSize(containerWidth, containerHeight);
      this.controls.handleResize();
    };

    this.onResize = debounce(GameSettings.resizeDelayTime, onResize.bind(this));

    window.addEventListener('resize', this.onResize);

    handlers.forEach((object) => {
      const {
        eventName,
        targetName,
        handler,
        condition,
        once = false,
      } = object;
      this.eventManager.addHandler(
        eventName,
        targetName,
        handler,
        condition,
        once,
      );
    });

    this.update = this.update.bind(this);

    if (this.loadingList.length > 0) {
      Promise.allSettled(this.loadingList).then((results) => {
        this.objectManager.setAlive(false);
        this.setMode('play');
        this.start();
      });
    } else {
      this.objectManager.setAlive(false);
      this.setMode('play');
      this.start();
    }
  }

  createGamepadControls(index, indicators) {
    const controls = new GamepadControls(
      index,
      indicators,
      this.camera.field,
      this.renderer.domElement,
    );

    return controls;
  }

  getElapsedTime() {
    return this.#elapsedTime;
  }

  resetTime() {
    this.#elapsedTime = 0;
  }

  createPlayer(name, ctype) {
    const player = new Character(this.game, name, ctype, false, this.texture);
    return player;
  }

  setCharacterWeapon(character, atype = '', gtype = '') {
    const { gunTypes } = character.data;

    gunTypes.forEach((gunType, gunIndex) => {
      const gun = new Gun(gunType);
      gun.data.ammoTypes.forEach((ammoType, ammoIndex) => {
        const ammo = this.game.ammos.get(ammoType);
        gun.ammos.set(ammoType, ammo);
      });

      if (atype !== '') {
        gun.setAmmoType(atype);
      } else {
        const [ammoType] = gun.data.ammoTypes;
        gun.setAmmoType(ammoType);
      }

      character.addGun(gun);
    });

    if (gtype !== '') {
      character.setGunType(gtype);
    } else {
      const [gunType] = gunTypes;
      character.setGunType(gunType);
    }
  }

  setMode(mode) {
    this.game.states.set('mode', mode);

    switch (mode) {
      case 'loading': {
        this.setStage();
        this.callbacks.setMode('loading');
        break;
      }

      case 'play': {
        this.callbacks.setMode('play');
        break;
      }

      case 'clear': {
        this.callbacks.setMode('clear');
        break;
      }

      default: {
        //
      }
    }
  }

  setStage(sname) {
    this.clearStage();

    const { name: playerName, ctype: characterType } =
      this.data.compositions.get('player');
    this.game.states.set('playerName', playerName);
    this.game.states.set('characterType', characterType);

    this.player = this.createPlayer(playerName, characterType);
    this.player.setControls(this.controls, this.camera.field);
    this.objectManager.add(this.player);
    this.eventManager.addSchedule(this.player, { spawnTime: 0 });

    const stageName = sname ?? this.game.states.get('stageName');
    const stageData = this.game.methods.get('getStageData')?.(stageName);

    this.game.stage = {};
    const { terrain, bvh, movableBVH, helper } = createStage(
      stageData,
      this.texture,
    );
    this.game.meshBVH = bvh;
    this.movableManager.setBVH(bvh);
    this.scene.field.add(terrain);
    this.scene.field.add(bvh);
    const grids = terrain.getObjectsByProperty('type', 'grid');
    this.gridProcessor.addList(grids);
    // this.helper = helper;this.scene.field.add(helper);//////////
    this.game.stage.terrain = terrain;

    const ammoNames = Array.from(this.data.ammos.keys());
    ammoNames.forEach((name) => {
      const ammo = new Ammo(name, this.texture);
      ammo.list.forEach((bullet) => {
        if (bullet.data.updaters != null) {
          bullet.data.updaters.forEach((param) => {
            const { state, update } = param;
            this.eventManager.addUpdater(bullet, state, update);
          });
        }
      });
      this.game.ammos.set(name, ammo);
      ammo.list.forEach((a) => this.objectManager.add(a));
    });

    const {
      characters = [],
      obstacles = [],
      items = [],
      movables = [],
    } = stageData;

    characters.forEach((data) => {
      const character = new Character(
        this.game,
        data.name,
        data.ctype,
        this.params.vrm,
        this.texture,
      );

      if (character.model != null) {
        this.loadingList.push(character.model);

        character.model.then(
          (gltf) => {
            this.modelManager.addModel(data.name, gltf);
            this.objectManager.add(character);

            const { vrm } = gltf.userData;

            vrm.lookAt.target = this.player.object;

            if (character.motions != null) {
              character.motions.then(
                (list) => {
                  for (let i = 0, l = list.length; i < l; i += 1) {
                    const motion = list[i];
                    this.modelManager.addMotion(data.name, motion, vrm);
                  }
                },
                (error) => {
                  console.error(error);
                },
              );
            }

            if (data.pose != null) {
              const { humanoid } = vrm;
              character
                .loadPoseData(data.pose)
                .then((json) => {
                  const poses = Object.entries(json.pose);

                  for (let i = 0, l = poses.length; i < l; i += 1) {
                    const [bone, { rotation }] = poses[i];
                    // ポーズデータが左手系のとき右手系に変換する処理
                    const rot = leftToRightHandedQuaternion(...rotation);
                    const object = humanoid.getNormalizedBoneNode(bone);
                    object.quaternion.copy(rot);
                    // object.quaternion.set.apply(object.quaternion, rotation);
                  }
                })
                .catch((error) => console.error(error));
            }

            return gltf;
          },
          (error) => console.error(error),
        );
      } else {
        this.objectManager.add(character);
      }

      this.setCharacterWeapon(character, data.ammoType);

      if (data.params != null) {
        character.setParams(data.params);
      }

      if (data.tweeners != null) {
        data.tweeners.forEach(({ name, state, args }) => {
          const tweener = this.data.tweeners.get(name);
          this.eventManager.addTween(character, state, tweener, args);
        });
      }

      if (data.updaters != null) {
        data.updaters.forEach(({ name, state }) => {
          const updater = this.data.updaters.get(name);
          this.eventManager.addUpdater(character, state, updater);
        });
      }

      if (data.schedule != null) {
        this.eventManager.addSchedule(character, data.schedule);
      }

      const { offset } = stageData.sections[data.params.section];
      const position = addOffsetToPosition(data.params.position, offset);
      character.setPosition(position, data.params.phi, data.params.theta);
      this.game.characters.add(character);
    });

    items.forEach((data) => {
      const item = new Item(data.name, this.texture);

      item.consumable = data.consumable ?? true;
      item.disableTime = data.disableTime ?? 1;

      if (data.params != null) {
        item.setParams(data.params);
      }

      if (data.tweeners != null) {
        data.tweeners.forEach(({ name, state, args }) => {
          const tweener = this.data.tweeners.get(name);
          this.eventManager.addTween(item, state, tweener, args);
        });
      }

      if (data.updaters != null) {
        data.updaters.forEach(({ name, state }) => {
          const updater = this.data.updaters.get(name);
          this.eventManager.addUpdater(item, state, updater);
        });
      }

      if (data.schedule != null) {
        this.eventManager.addSchedule(item, data.schedule);
      }

      const { offset } = stageData.sections[data.params.section];
      const position = addOffsetToPosition(data.params.position, offset);
      const { phi = 0, theta = 0 } = data.params;
      item.setPosition(position, phi, theta);
      this.objectManager.add(item, data);
      this.game.items.add(item);
    });

    obstacles.forEach((data) => {
      const obstacle = new Obstacle(data.name, this.texture);

      if (data.params != null) {
        obstacle.setParams({ ...data.params });
      }

      if (data.tweeners != null) {
        data.tweeners.forEach(({ name, state, args }) => {
          const tweener = this.data.tweeners.get(name);
          this.eventManager.addTween(obstacle, state, tweener, args);
        });
      }

      if (data.updaters != null) {
        data.updaters.forEach(({ name, state }) => {
          const updater = this.data.updaters.get(name);
          this.eventManager.addUpdater(obstacle, state, updater);
        });
      }

      if (data.schedule != null) {
        this.eventManager.addSchedule(obstacle, data.schedule);
      }

      const { offset } = stageData.sections[data.params.section];
      const position = addOffsetToPosition(data.params.position, offset);
      obstacle.setPosition(position);
      this.objectManager.add(obstacle, data);
      this.game.obstacles.add(obstacle);
    });

    movables.forEach((data) => {
      const { name } = data;
      const movable = new Movable(name);
      movable.setGeometry(bvh.geometry);
      this.movableManager.addObject(movable);

      if (data.params != null) {
        movable.setParams({ ...data.params });
      }

      if (data.tweeners != null) {
        data.tweeners.forEach(({ name, state, args }) => {
          const tweener = this.data.tweeners.get(name);
          this.eventManager.addTween(movable, state, tweener, args);
        });
      }
    });

    const checkpointIndex = this.game.states.get('checkpointIndex');
    const checkpoint = stageData.checkpoints[checkpointIndex];
    const { offset } = stageData.sections[checkpointIndex];

    const position = addOffsetToPosition(checkpoint.position, offset);
    this.player.setPosition(position, checkpoint.phi, checkpoint.theta);
    this.setCharacterWeapon(this.player);
  }

  clearStage() {
    if (this.game.stage != null) {
      this.objectManager.clearList();
      this.movableManager.clearBVH();

      this.scene.field.clear();
      this.game.meshBVH = null;
      this.game.stage = null;
    }

    this.game.states.set('time', 0);
    this.game.states.set('falls', 0);
    this.game.states.set('hits', 0);
    this.game.states.set('push-away', 0);
    this.game.states.set('no-checkpoint', 0);

    this.callbacks.setScore(null);

    this.game.ammos.clear();
    this.game.characters.clear();
    this.game.items.clear();
    this.game.obstacles.clear();
  }

  nextStage() {
    const stageName = this.game.states.get('stageName');
    const stageNames = this.data.compositions.get('stage');
    const index = stageNames.indexOf(stageName);

    const nextStageName = stageNames[index + 1];

    if (nextStageName != null) {
      this.setStage(nextStageName);
      this.game.states.set('stageName', nextStageName);
    }
  }

  rewindStage() {
    const stageNames = this.data.compositions.get('stage');
    const [first] = stageNames;
    this.setStage(first);
    this.game.states.set('stageName', first);
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('gamepadconnected', this.onGamepadConnected);
    window.removeEventListener(
      'gamepaddisconnected',
      this.onGamepadDisconnected,
    );

    this.objectManager.dispose();
    this.controls.dispose();
    this.scene.screen.traverse(disposeObject);

    this.clearStage();
    this.scene.screen.clear();
    this.modelManager.clear();

    this.textureManager.disposeAll();
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }

  start() {
    this.clock.start();
    this.renderer.setAnimationLoop(this.update);
  }

  stop() {
    this.clock.stop();
    this.renderer.setAnimationLoop(null);
  }

  restart(checkpoint) {}

  clear() {}

  update() {
    const deltaTime = this.clock.getDelta();
    const delta = deltaTime / GameSettings.stepsPerFrame;
    const damping = getDamping(delta);

    this.controls.input();

    for (let i = 0; i < GameSettings.stepsPerFrame; i += 1) {
      this.#elapsedTime += delta;
      this.controls.update(delta);
      this.objectManager.update(delta, this.#elapsedTime, damping);
    }

    this.modelManager.update(deltaTime);
    this.eventManager.update(deltaTime, this.#elapsedTime);
    this.objectManager.updatePos();
    this.sceneManager.update();

    this.movableManager.update();
    this.gridProcessor.update(deltaTime);
    // this.helper.update();/////////////

    this.callbacks.setElapsedTime(this.#elapsedTime);
    this.game.states.set('time', this.#elapsedTime);
  }
}

export default Game;
