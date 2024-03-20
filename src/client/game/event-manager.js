import Publisher from './publisher';

class EventManager extends Publisher {
  constructor(characterManager) {
    this.characterManager = characterManager;
    this.schedules = new Map();
  }

  add() {}

  remove() {}

  clear() {}

  dispatch(name, type) {}

  update(deltaTime, lapsedTime) {}
}

export default EventManager;

// イベント種類
// oob, キャラ接触, アイテム取得

// イベント登録・解除

// イベント状態　待機・準備・開始・終了
