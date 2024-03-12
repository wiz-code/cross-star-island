import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

const { floor } = Math;

const gltfLoader = new GLTFLoader();
gltfLoader.crossOrigin = 'anonymous'; /// /////////

gltfLoader.register((parser) => {
  return new VRMLoaderPlugin(parser);
});

class ModelLoader {
  #promise = null;

  #progress = null;

  #gltf = null;

  #status = 'unstarted';

  constructor(url, autoLoad = false) {
    this.url = url;

    if (autoLoad) {
      this.#promise = this.load(url);
    }
  }

  async load() {
    this.#promise = new Promise((resolve, reject) => {
      this.#status = 'loading';

      const result = gltfLoader.load(
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

      return result;
    });

    return this.#promise;
  }

  // const model = new ModelLoader('some_url').getPromise();
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
