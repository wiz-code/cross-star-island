import { formatDistance, parseISO } from 'date-fns';

const { floor, max } = Math;
const key = 'cross-star-island-scores';

class ScoreManager {
  constructor() {
    this.scores = [];
    this.load();
  }

  calcScore(time, fall, hit, pushAway, checkpointIndex) {
    const score = {};
    const data = { bonus: 1000 };

    if (time <= 60) {
      data.time = 1000;
    } else {
      data.time = max(floor(500 - time), 0);
    }

    data.fall = fall * -50;
    data.hit = hit * 1;
    data.pushAway = pushAway * 100;
    data.noCheckpoint = 900 - checkpointIndex * 300; //最大でもチェックポイント３つの場合
    score.data = data;

    score.sum = Object.values(data).reduce((acc, cur) => acc + cur);
    const date = new Date().toISOString();

    this.addScore({ value: score.sum, date });

    const highscore = this.getHighscore();

    if (highscore != null) {
      const distance = this.formatDistance(highscore.date);
      score.highscore = { value: highscore.value, distance };
    } else {
      score.highscore = null;
    }

    return score;
  }

  addScore(score) {
    this.scores.push(score);
    this.save();
  }

  clearScores() {
    this.scores.length = 0;
  }

  getHighscore() {
    if (this.scores.length === 0) {
      return null;
    }

    let highscore = 0;
    let highscoreIndex = 0;

    this.scores.forEach((score, index) => {
      if (score.value > highscore) {
        highscore = score.value;
        highscoreIndex = index;
      }
    });

    return this.scores[highscoreIndex];
  }

  formatDistance(date) {
    return formatDistance(new Date(), parseISO(date));
  }

  load() {
    const data = localStorage.getItem(key);

    if (data != null) {
      this.scores = JSON.parse(data);
    }
  }

  save() {
    const json = JSON.stringify(this.scores);
    localStorage.setItem(key, json);
  }

  update() {
    //
  }
}

export default ScoreManager;
