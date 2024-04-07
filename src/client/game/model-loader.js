import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation';

const { floor } = Math;

const gltfLoader = new GLTFLoader();
gltfLoader.crossOrigin = 'anonymous'; /// /////////

gltfLoader.register((parser) => {
  return new VRMLoaderPlugin(parser);
});

gltfLoader.register((parser) => {
  return new VRMAnimationLoaderPlugin(parser);
});

class ModelLoader {
  #promise = null;

  #progress = null;

  #gltf = null;

  #status = 'unstarted';

  constructor(name, dataType = 'vrm') {
    this.url = `assets/${dataType}/${name}.${dataType}`;
  }

  async load() {
    this.#promise = new Promise((resolve, reject) => {
      this.#status = 'loading';

      gltfLoader.load(
        this.url,
        (gltf) => {
          this.#status = 'success';

          this.#gltf = gltf;

          if (this.#gltf.userData.vrm != null) {
            VRMUtils.removeUnnecessaryVertices(this.#gltf.scene);
            VRMUtils.removeUnnecessaryJoints(this.#gltf.scene);
          }

          resolve(this.#gltf);
        },
        (progress) => this.setProgress(progress),
        (error) => {
          this.#status = 'failed';
          reject(error);
        },
      );
    });

    return this.#promise;
  }

  getPromise() {
    return this.#promise;
  }

  isSucceeded() {
    return this.#status === 'success';
  }

  getProgress() {
    if (this.#progress == null) {
      return 0;
    }

    const progress =
      floor((this.#progress.loaded / this.#progress.total) * 100) / 100;
    return progress;
  }

  setProgress(progress) {
    this.#progress = progress;
  }
}

export default ModelLoader;
