import { AnimationMixer } from 'three';
import { VRMUtils } from '@pixiv/three-vrm';

import ModelLoader from './model-loader';

class ModelManager {
  constructor(scene) {
    this.models = new Map();
    this.mixers = new Map();
    this.actions = new Map();
    this.animations = new Map();
  }

  addModel(gltf) {
    if (gltf.userData.vrm != null) {
      const model = gltf.userData.vrm;
      this.models.set(name, model);
      const mixer = new AnimationMixer(model.scene);
      this.mixers.set(name, mixer);

      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);

        if (this.actions.has(name)) {
          this.actions.set(name, new Set());
        }

        const actionSet = this.actions.get(name);
        actionSet.add(action);
      });

      return model;
    }
    if (gltf.userData.vrmAnimations != null) {
      //
    }
  }

  removeModel(name) {
    if (this.models.has(name)) {
      const model = this.models.get(name);
      VRMUtils.deepDispose(model.scene);
      this.models.delete(name);
    }
  }

  setTransform(name, param) {
    if (this.models.has(name)) {
      const model = this.models.get(name);

      if (param.position != null) {
        model.scene.position.set(
          param.position.x,
          param.position.y,
          param.position.z,
        );
      }

      if (typeof param.scale === 'number') {
        model.scene.scale.setScalar(param.scale);
      } else if (param.scale != null) {
        model.scene.scale.set(param.scale.x, param.scale.y, param.scale.z);
      }

      if (param.rotation != null) {
        model.scene.rotation.x = param.rotation.x;
        model.scene.rotation.y = param.rotation.y;
        model.scene.rotation.z = param.rotation.z;
      }
    }
  }

  clear() {
    if (this.models.size > 0) {
      for (const model of this.models.values()) {
        VRMUtils.deepDispose(model.scene);
      }

      this.models.clear();
    }

    if (this.mixers.size > 0) {
      this.mixers.clear();
    }
  }

  update(deltaTime) {
    const models = Array.from(this.models.values());
    const mixers = Array.from(this.mixers.values());

    for (let i = 0, l = models.length; i < l; i += 1) {
      const model = models[i];
      model.update(deltaTime);
    }

    for (let i = 0, l = mixers.length; i < l; i += 1) {
      const mixer = mixers[i];
      mixer.update(deltaTime);
    }
  }
}

export default ModelManager;
