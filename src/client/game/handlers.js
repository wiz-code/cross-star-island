import { Vector3 } from 'three';
import { Tween, Group } from '@tweenjs/tween.js';
import { States, Compositions, Stages } from './data';

const { random } = Math;

const getRandomInclusive = (min, max) => random() * (max - min) + min;

const stages = new Map(Stages);
const compositions = new Map(Compositions);

export const handlers = [
  {
    eventName: 'oob',
    targetName: 'teleport-character',
    condition(states, character) {
      return character.isFPV();
    },
    handler(states, character) {
      const stageIndex = states.get('stageIndex');
      const stageNameList = compositions.get('stage');
      const stageName = stageNameList[stageIndex];
      const stageData = stages.get(stageName);

      const checkpointIndex = states.get('checkpointIndex');
      const checkpoint = stageData.checkpoints[checkpointIndex];
      character.velocity.copy(new Vector3());
      character.setPosition(
        checkpoint.position,
        checkpoint.phi,
        checkpoint.theta,
      );
    },
  },
  {
    eventName: 'get-item',
    targetName: 'weapon-upgrade',
    handler(states, character) {
      if (character.guns.has(character.gunType)) {
        const gun = character.guns.get(character.gunType);
        const { ammoTypes } = gun.data;
        const { name } = gun.ammo;
        const index = ammoTypes.indexOf(name);

        if (index > -1) {
          const ammoType = ammoTypes[index + 1];

          if (ammoType != null) {
            character.setAmmoType(ammoType);
          }
        }
      }
    },
  },
  {
    eventName: 'get-item',
    targetName: 'checkpoint',
    handler(states) {
      const checkpointIndex = states.get('checkpointIndex');
      states.set('checkpointIndex', checkpointIndex + 1);
    },
  },
  {
    eventName: 'collision',
    targetName: 'girl-1',
    once: true,
    handler(states, c1, c2) {
      alert('ゴール！　おめでとう！');
    },
  },
];

export const Tweeners = [
  [
    'rolling-stone-1',
    (target, arg) => {
      const time = arg ?? 0;

      const group = new Group();
      const tween = new Tween(target.collider.center, group);
      tween
        .onEveryStart(() => {
          const posZ = getRandomInclusive(-80, 80);
          target.collider.center.set(-2100, 300, posZ);
          target.velocity.copy(new Vector3(0, 0, 0));
        })
        .delay(10000)
        .repeat(Infinity)
        .start(time);

      return group;
    },
  ],
  [
    'avoidance-1',
    (target, arg) => {
      const time = arg ?? 0;
      let prevValue = 0;
      const offset = { z: 0 };
      const update = ({ z }) => {
        target.collider.start.z += z - prevValue;
        target.collider.end.copy(target.collider.start);
        target.collider.end.y += target.data.height + target.data.radius;
        prevValue = z;
      };

      const group = new Group();
      const tween1 = new Tween(offset, group)
        .to({ z: -40 }, 1000)
        .onUpdate(update);
      const tween2 = new Tween(offset, group)
        .to({ z: 0 }, 1000)
        .onUpdate(update);

      tween1.chain(tween2).start(time);
      tween2.chain(tween1);

      return group;
    },
  ],
];

export const Updaters = [
  [
    'rolling-stone-1',
    {
      state: States.alive,
      update(deltaTime) {
        this.object.rotation.z -= deltaTime * this.data.rotateSpeed;
      },
    },
  ],
  [
    'item-ring-1',
    {
      state: States.alive,
      update(deltaTime) {
        const rotateSpeed = deltaTime * this.data.rotateSpeed;
        this.object.rotation.y -= rotateSpeed;
        this.object.rotation.z -= rotateSpeed * 2;
      },
    },
  ],
  [
    'bullet-fire-1',
    {
      state: States.alive,
      update(deltaTime) {
        this.params.elapsedTime += deltaTime;

        if (this.params.elapsedTime > this.params.fireInterval) {
          this.params.elapsedTime = 0;
          this.fire();
        }
      },
    },
  ],
];
