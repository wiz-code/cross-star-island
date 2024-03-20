import {
  Scene as ThreeScene,
  Fog,
  PerspectiveCamera,
  OrthographicCamera,
  WebGLRenderer,
  Color,
  Clock,
  Vector3,
  AmbientLight,
  Float32BufferAttribute,
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
import ModelManager from './model-manager';
import Character from './character';
import Ammo from './ammo';
import Gun from './gun';
import Obstacle from './obstacle';
import Item from './item';
import TextureManager from './texture-manager';
import createStage from './stages';
import { leftToRightHandedQuaternion } from './utils';

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

  constructor(width, height) {
    this.clock = new Clock();
    this.worldOctree = new Octree();

    this.windowHalf = {
      width: floor(width / 2),
      height: floor(height / 2),
    };

    this.container = document.getElementById('container');

    this.renderer = new WebGLRenderer({ canvas, antialias: false });
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
    this.scene.field.fog = new Fog(
      Scene.Fog.color,
      Scene.Fog.near,
      Scene.Fog.far,
    );

    this.scene.screen = new ThreeScene();

    this.modelManager = new ModelManager(this.scene.field);

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

    this.textureManager = new TextureManager();
    this.texture = this.textureManager.toObject();

    this.light = {};
    this.light.ambient = new AmbientLight(
      Light.Ambient.color,
      Light.Ambient.intensity,
    );
    this.scene.field.add(this.light.ambient);

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
      const ammo = new Ammo(name, this.texture);
      this.ammos.set(name, ammo);
      this.objectManager.add(ammo.list);
    });

    this.controls = null;
    this.player = null;
    this.stage = null;

    // ゲーム管理変数
    this.loadingList = [];
    this.mode = 'loading'; // 'loading', 'opening', 'play', 'gameover'
    this.stageIndex = 0;
    this.checkpointIndex = 0;

    /// ///////////////
    const heroName = 'hero-1';

    this.setPlayer(heroName);
    this.setMode('play');

    /// ///////////

    // this.loop = new Loop(this.update, this);
    this.update = this.update.bind(this);

    if (this.loadingList.length > 0) {
      Promise.all(this.loadingList).then(
        (result) => {
          this.start();
        },
        (error) => {
          console.error(error);
        },
      );
    } else {
      this.start();
    }

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

  setPlayer(characterName) {
    this.player = new Character(characterName, this.texture);
    this.controls = new FirstPersonControls(
      this.scene.screen,
      this.camera.field,
      this.renderer.domElement,
      this.texture,
    );
    this.player.setFPV(this.camera.field, this.controls);
    this.controls.setRotationComponentListener(this.player);

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

  teleportCharacter(character) {
    const stageNameList = this.data.compositions.get('stage');
    const stageName = stageNameList[this.stageIndex];
    const stageData = this.data.stages.get(stageName);

    if (character.isFPV()) {
      const checkpoint = stageData.checkpoints[this.checkpointIndex];
      character.velocity.copy(new Vector3());
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
    this.clearStage();

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
      const character = new Character(data.name, this.texture);
      const { gunTypes } = character.data;

      if (character.model != null) {
        this.loadingList.push(character.model);

        character.model.then(
          (gltf) => {
            this.modelManager.addModel(data.name, gltf);
            character.setPosition(data.position, data.phi, data.theta);
            this.characterManager.add(character, data);
            // vrm.expressionManager.setValue('blink', 1);

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
                    const rot = leftToRightHandedQuaternion.apply(
                      null,
                      rotation,
                    );
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
      }

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

      if (character.object != null) {
        this.characterManager.add(character, data);
      }
    });

    items.forEach((data) => {
      const item = new Item(data.name, this.texture);
      item.setPosition(data.position);

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
      const obstacle = new Obstacle(data.name, this.texture);
      obstacle.setPosition(data.position);

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

    this.stage = createStage(stageName, this.texture);
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
    if (this.player != null) {
      this.player.setActive(true);
      this.controls.enable(true);
    }

    this.clock.start();
    this.renderer.setAnimationLoop(this.update);
  }

  stop() {
    if (this.player != null) {
      this.player.setActive(false);
      this.controls.enable(false);
    }

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
    this.sceneManager.update();
  }
}

export default Game;
