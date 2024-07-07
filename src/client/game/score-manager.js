import { formatDistance, parseISO } from 'date-fns';

const { floor, max } = Math;
const key = 'cross-star-island-scores';
const maxRecords = 100;

class ScoreManager {
  constructor(game) {
    this.game = game;
    this.scores = [];
    this.load();
  }

  calcScore(time, falls, hits, pushAway, checkpointIndex, punishment = false) {
    const score = {};
    const data = { bonus: 1000 };
    data.bonus = !punishment ? data.bonus : 0;

    const stageName = this.game.states.get('stageName');
    const stageData = this.game.methods.get('getStageData')?.(stageName);
    const checkpointNum = stageData.checkpoints.length;

    if (time <= 50) {
      data.time = 5000;
    } else {
      data.time = max(floor(3000 - time * 10), 0);
    }

    data.falls = falls * -100;
    data.hits = hits * 5;
    data.pushAway = pushAway * 400;
    data.noCheckpoint = checkpointNum * 1000 - (checkpointIndex + 1) * 1000;
    score.data = data;

    score.sum = Object.values(data).reduce((acc, cur) => acc + cur);
    const date = new Date().toISOString();

    score.newRecord = this.scores.every((record) => score.sum > record.value);

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

    if (this.scores.length > maxRecords) {
      this.scores.slice(maxRecords - this.scores.length);
    }

    this.save();
  }

  clearScores() {
    this.scores.length = 0;
    this.save();
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
