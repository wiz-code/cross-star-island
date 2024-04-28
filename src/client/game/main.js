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
  AxesHelper, /// //////////
} from 'three';
import { Octree } from 'three/addons/math/Octree.js';
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
import {
  GlobalStates,
  GlobalMethods,
  Characters,
  Stages,
  Compositions,
  Ammos,
  Guns,
  Sounds,
} from './data';
import { handlers, Tweeners, Updaters } from './handlers';
import CollidableManager from './collidable-manager';
import CharacterManager from './character-manager';
import SceneManager from './scene-manager';
import ModelManager from './model-manager';
import EventManager from './event-manager';
import SoundManager from './sound-manager';
import Character from './character';
import Ammo from './ammo';
import Gun from './gun';
import Obstacle from './obstacle';
import Item from './item';
import TextureManager from './texture-manager';
import createStage from './stages';
import { leftToRightHandedQuaternion, addOffsetToPosition } from './utils';

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
const canvas = document.createElement('canvas');

const disposeObject = (object) => {
  if (object?.dispose !== undefined) {
    object.dispose();
  }

  if (object.geometry?.dispose !== undefined) {
    object.geometry.dispose();
  }

  if (object.material?.dispose !== undefined) {
    object.material.dispose();
  }
};

class Game {
  #elapsedTime = 0;

  constructor(width, height, callbacks) {
    this.clock = new Clock();
    this.worldOctree = new Octree();
    this.callbacks = callbacks;

    // ゲーム管理変数
    this.game = {};
    this.game.states = new Map(GlobalStates);
    this.game.methods = new Map(GlobalMethods);
    this.game.ammos = new Map();
    this.game.characters = new Set();
    this.game.items = new Set();
    this.game.obstacles = new Set();
    this.loadingList = [];

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
    this.renderer.autoClear = false;
    this.renderer.setClearColor(new Color(0x000000));
    this.renderer.setPixelRatio(Renderer.pixelRatio);
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);
    this.sceneManager = new SceneManager(this.container, this.renderer);

    this.scene = {};
    this.camera = {};

    this.scene.field = new ThreeScene();
    this.scene.field.background = new Color(Scene.background);
    /*this.scene.field.fog = new Fog(
      Scene.Fog.color,
      Scene.Fog.near,
      Scene.Fog.far,
    );*/
    this.scene.field.fog = new FogExp2(
      Scene.Fog.color,
      Scene.Fog.density
    );

    this.scene.screen = new ThreeScene();

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
    this.loadingList.push(promise);
    this.game.methods.forEach((value, key) => {
      const method = value.bind(this.soundManager);
      this.game.methods.set(key, method);
    });

    this.sceneManager.clear();
    this.sceneManager.add('field', this.scene.field, this.camera.field);
    this.sceneManager.add('screen', this.scene.screen, this.camera.screen);

    this.textureManager = new TextureManager();
    this.texture = this.textureManager.toObject();

    this.light = {};
    this.light.ambient = new AmbientLight(
      Light.Ambient.color,
      Light.Ambient.intensity,
    );
    this.scene.field.add(this.light.ambient);

    this.data = {};
    this.data.characters = new Map(Characters);
    this.data.compositions = new Map(Compositions);
    this.data.ammos = new Map(Ammos);
    this.data.guns = new Map(Guns);
    this.data.sounds = new Map(Sounds);
    this.data.handlers = handlers;
    this.data.tweeners = new Map(Tweeners);
    this.data.updaters = new Map(Updaters);

    this.objectManager = new CollidableManager(
      this.scene.field,
      this.worldOctree,
    );
    this.characterManager = new CharacterManager(
      this.game,
      this.scene.field,
      this.objectManager,
      this.eventManager,
      this.worldOctree,
    );

    this.controls = null;
    this.player = null;
    this.game.stage = null;

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

    /// ///////////////
    const playerName = 'player-1';
    const characterType = 'hero-1';
    this.game.states.set('playerName', playerName);
    this.game.states.set('characterType', characterType);

    this.setMode('play');

    const axesHelper = new AxesHelper(50);
    this.scene.field.add(axesHelper);
    /// ///////////

    this.update = this.update.bind(this);

    if (this.loadingList.length > 0) {
      Promise.allSettled(this.loadingList).then((results) => {
        this.start();
      });
    } else {
      this.start();
    }
  }

  getElapsedTime() {
    return this.#elapsedTime;
  }

  resetTime() {
    this.#elapsedTime = 0;
  }

  setPlayer(name, ctype) {
    this.player = new Character(this.game, name, ctype, this.texture);
    this.controls = new FirstPersonControls(
      this.scene.screen,
      this.camera.field,
      this.renderer.domElement,
      this.texture,
    );
    this.player.setFPV(this.camera.field, this.controls);
    this.controls.setRotationComponentListener(this.player);

    const { gunTypes } = this.player.data;

    gunTypes.forEach((gname, gunIndex) => {
      const gun = new Gun(gname);
      gun.data.ammoTypes.forEach((ammoType, ammoIndex) => {
        const ammo = this.game.ammos.get(ammoType);
        gun.ammos.set(ammoType, ammo);

        if (ammoIndex === 0) {
          gun.setAmmoType(ammoType);
        }
      });
      this.player.addGun(gun);

      if (gunIndex === 0) {
        this.player.setGunType(gname);
      }
    });

    this.characterManager.add(this.player);
  }

  removePlayer() {
    if (this.player != null) {
      this.player.unsetFPV();
      this.player.dispose();
      this.controls.dispose();
      this.player = null;
      this.controls = null;
    }
  }

  setMode(mode) {
    this.game.states.set('mode', mode);

    switch (mode) {
      case 'unstarted': {
        //
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
    this.clearStage();

    const index = stageIndex ?? this.game.states.get('stageIndex');

    if (index == null) {
      return;
    }

    const stageData = Stages[index];

    this.game.stage = {};
    const terrain = createStage(index, this.texture);
    this.scene.field.add(terrain);
    this.worldOctree.fromGraphNode(terrain);
    this.game.stage.terrain = terrain;

    this.characterManager.clear();
    this.objectManager.clear();

    const ammoNames = Array.from(this.data.ammos.keys());
    ammoNames.forEach((name) => {
      const ammo = new Ammo(name, this.texture);
      ammo.list.forEach((bullet) => {
        if (bullet.data.updaters != null) {
          bullet.data.updaters.forEach((param) => {
            if (typeof param === 'string') {
              const updater = this.data.updaters.get(param);
              this.eventManager.addUpdater(
                bullet,
                updater.state,
                updater.update,
                updater.args,
              );
            } else {
              const { state, update, args } = param;
              this.eventManager.addUpdater(bullet, state, update, args);
            }
          });
        }
      });
      this.game.ammos.set(name, ammo);
      this.objectManager.add(ammo.list);
    });

    const { characters, obstacles, items } = stageData;

    characters.forEach((data) => {
      const character = new Character(
        this.game,
        data.name,
        data.ctype,
        this.texture,
      );
      const { gunTypes } = character.data;

      if (character.model != null) {
        this.loadingList.push(character.model);

        character.model.then(
          (gltf) => {
            this.modelManager.addModel(data.name, gltf);
            this.characterManager.add(character);

            const { vrm } = gltf.userData;

            if (this.player != null) {
              vrm.lookAt.target = this.player.object;
            }

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
        this.characterManager.add(character);
      }

      gunTypes.forEach((name, gunIndex) => {
        const gun = new Gun(name);
        gun.data.ammoTypes.forEach((ammoType) => {
          const ammo = this.game.ammos.get(ammoType);
          gun.ammos.set(ammoType, ammo);
        });

        const { ammoType } = data;
        gun.setAmmoType(ammoType);
        character.addGun(gun);

        if (gunIndex === 0) {
          character.setGunType(name);
        }
      });

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
        data.updaters.forEach((param) => {
          if (typeof param === 'string') {
            const updater = this.data.updaters.get(param);
            this.eventManager.addUpdater(
              character,
              updater.state,
              updater.update,
              updater.args,
            );
          } else {
            const { state, update, args } = param;
            this.eventManager.addUpdater(character, state, update, args);
          }
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
        data.updaters.forEach((param) => {
          if (typeof param === 'string') {
            const updater = this.data.updaters.get(param);
            this.eventManager.addUpdater(
              item,
              updater.state,
              updater.update,
              updater.args,
            );
          } else {
            const { state, update, args } = param;
            this.eventManager.addUpdater(item, state, update, args);
          }
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
        data.updaters.forEach((param) => {
          if (typeof param === 'string') {
            const updater = this.data.updaters.get(param);
            this.eventManager.addUpdater(
              obstacle,
              updater.state,
              updater.update,
              updater.args,
            );
          } else {
            const { state, update, args } = param;
            this.eventManager.addUpdater(obstacle, state, update, args);
          }
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

    const checkpointIndex = this.game.states.get('checkpointIndex');
    const checkpoint = stageData.checkpoints[checkpointIndex];
    const { offset } = stageData.sections[checkpointIndex];

    const playerName = this.game.states.get('playerName');
    const characterType = this.game.states.get('characterType');
    this.setPlayer(playerName, characterType);

    const position = addOffsetToPosition(checkpoint.position, offset);

    this.player.setPosition(position, checkpoint.phi, checkpoint.theta);
  }

  clearStage() {
    if (this.game.stage != null) {
      this.scene.field.clear();
      this.worldOctree.clear();
      this.game.stage = null;
    }

    this.game.ammos.clear();
    this.game.characters.clear();
    this.game.items.clear();
    this.game.obstacles.clear();
  }

  nextStage() {
    const index = this.game.states.get('stageIndex');
    const currentIndex = index + 1;
    this.setStage(currentIndex);
    this.game.states.set('stageIndex', currentIndex);
  }

  rewindStage() {
    const index = this.game.states.get('stageIndex');
    const currentIndex = index - 1;
    this.setStage(currentIndex);
    this.game.states.set('stageIndex', currentIndex);
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
    this.removePlayer();

    this.scene.field.traverse(disposeObject);
    this.scene.screen.traverse(disposeObject);

    this.clearStage();
    this.scene.screen.clear();
    this.modelManager.clear();

    this.textureManager.disposeAll();
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }

  start() {
    this.callbacks.setGameStarted(true);
    this.clock.start();
    this.renderer.setAnimationLoop(this.update);

    if (this.player != null) {
      // this.player.setAlive(true);
      this.eventManager.addSchedule(this.player, { spawnTime: 0.5 });
      this.controls.enable(true);
    }
  }

  stop() {
    if (this.player != null) {
      this.player.setAlive(false);
      this.controls.enable(false);
    }

    this.callbacks.setGameStarted(false);
    this.clock.stop();
    this.renderer.setAnimationLoop(null);
  }

  restart(checkpoint) {}

  clear() {}

  update() {
    const deltaTime = this.clock.getDelta();
    const delta = deltaTime / GameSettings.stepsPerFrame;
    const damping = getDamping(delta);

    for (let i = 0; i < GameSettings.stepsPerFrame; i += 1) {
      this.#elapsedTime += delta;
      this.controls.update(delta);
      this.characterManager.update(delta, this.#elapsedTime, damping);
      this.objectManager.update(delta, this.#elapsedTime, damping);
    }

    this.modelManager.update(deltaTime);
    this.eventManager.update(deltaTime, this.#elapsedTime);
    this.sceneManager.update();
  }
}

export default Game;
