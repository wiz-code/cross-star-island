import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { yellow } from '@mui/material/colors';

import Game from '../game/main';
import Layout from './Layout';
import { Meta } from '../common';
import systemSlice from '../redux/systemSlice';
import gameSlice from '../redux/gameSlice';

const { actions: systemActions } = systemSlice;
const { actions: gameActions } = gameSlice;

const font = {
  monospaced: '"MS Gothic","TakaoGothic","Noto Sans CJK JP",Monospace',
  proportional: '"Helvetica Neue", Arial, Roboto, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", "メイリオ", Meiryo, "ＭＳ Ｐゴシック", "MS PGothic", sans-serif',
};

const meta = new Map(Meta);

const Progress = () => (
  <Box
    sx={{
      position: 'absolute',
      left: 'calc(50% - 24px)',
      top: 'calc(50% - 24px)',
    }}
  >
    <CircularProgress />
  </Box>
);

const GameContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  position: 'absolute',
  overflow: 'clip',
}));

const ScoreItem = styled(Box)(({ theme }) => ({
  color: '#fff',
  fontSize: '2.8rem',
  position: 'absolute',
  fontFamily: font.proportional,
  textShadow: '0 0 8px rgb(0, 0, 0, 0.4)',
  left: '20%',
  top: 0,
}));
const ScoreValue = styled(Box)(({ theme }) => ({
  color: '#fff',
  fontSize: '2.8rem',
  fontStyle: 'italic',
  textAlign: 'right',
  textShadow: '0 0 16px rgb(0, 0, 0, 0.4)',
  position: 'absolute',
  fontFamily: font.proportional,
  right: '20%',
  top: 0,
}));

function DisplayTime() {
  const { mode, elapsedTime } = useSelector((state) => state.game);

  if (mode === 'play' || mode === 'clear') {
    return (
      <Box
        sx={{
          width: 'fit-content',
          position: 'relative',
          left: 'calc(50% - 50px)',

          color: '#fff',
          fontSize: '2.5rem',
          fontFamily: font.monospaced,
        }}
      >
        {elapsedTime}
      </Box>
    );
  }

  return null;
}

function DisplayScore() {
  const { mode, elapsedTime, score } = useSelector((state) => state.game);
  const theme = useTheme();

  if (mode !== 'clear') {
    return null;
  }

  const { data, sum, newRecord, highscore } = score;
  const highscoreData = highscore != null ? `${highscore.value} ${highscore.distance}` : '--';

  return (
    <Box sx={{
      width: '100%',
      height: '80%',
      position: 'relative',
      top: '0%',
    }}>
      <ScoreItem sx={{ top: '10%' }}>CLEAR BONUS</ScoreItem>
      <ScoreValue sx={{ top: '10%' }}>{data.bonus}</ScoreValue>
      <ScoreItem sx={{ top: '20%' }}>TIME</ScoreItem>
      <ScoreValue sx={{ top: '20%' }}>{data.time}</ScoreValue>
      <ScoreItem sx={{ top: '30%' }}>FALLS</ScoreItem>
      <ScoreValue sx={{ top: '30%' }}>{data.falls}</ScoreValue>
      <ScoreItem sx={{ top: '40%' }}>HITS</ScoreItem>
      <ScoreValue sx={{ top: '40%' }}>{data.hits}</ScoreValue>
      <ScoreItem sx={{ top: '50%' }}>PUSH AWAY</ScoreItem>
      <ScoreValue sx={{ top: '50%' }}>{data.pushAway}</ScoreValue>
      <ScoreItem sx={{ top: '60%' }}>NO CHECKPOINT</ScoreItem>
      <ScoreValue sx={{ top: '60%' }}>{data.noCheckpoint}</ScoreValue>
      <ScoreItem sx={{ top: '75%' }}>SCORE</ScoreItem>
      <ScoreValue sx={{ top: '75%', color: yellow[500] }}>
        {!newRecord ? sum : (
          <>
            <Typography variant="h4" sx={{ px: theme.spacing(2), display: 'inline' }}>New record!!</Typography>
            {sum}
          </>
        )}</ScoreValue>
      <ScoreItem sx={{ top: '85%' }}>HIGH SCORE</ScoreItem>
      <ScoreValue sx={{ top: '85%' }}>
        {highscore != null ? (
          <>
            <Typography variant="h4" sx={{ px: theme.spacing(2), display: 'inline' }}>
              {`${highscore.distance} ago`}
            </Typography>
            {highscore.value}
          </>
        ) : '--'}
      </ScoreValue>
    </Box>
  );
}

function Controls({ indexPath, toggleFullScreen, clearRecords }) {
  const { mode, fps } = useSelector((state) => state.game);
  const { isFullscreen } = useSelector((state) => state.system);
  const dispatch = useDispatch();
  const navicate = useNavigate();
  const theme = useTheme();

  const jumpToTitlePage = useCallback(() => {
    navicate(indexPath);
  }, []);

  const visibleFPS = useCallback(() => {
    dispatch(gameActions.visibleFPS(!fps));
  }, [fps]);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: theme.spacing(1),
        position: 'absolute',
        right: theme.spacing(2),
        bottom: theme.spacing(2),
      }}
    >
      {mode === 'clear' ? (
        <Button variant="contained" size="small" color="info" onClick={jumpToTitlePage}>タイトル画面に戻る</Button>
      ): null}
      {mode === 'clear' ? (
        <Button variant="outlined" size="small" color="error" onClick={clearRecords}>記録を全削除</Button>
      ): null}
      <Button variant="outlined" size="small" onClick={visibleFPS}>
        {!fps ? 'FPSを表示' : 'FPSを非表示'}
      </Button>
      <Button variant="outlined" size="small" onClick={toggleFullScreen}>
        {!isFullscreen ? '全画面にする' : '全画面を解除'}
      </Button>
    </Box>
  );
}

function GamePage({ indexPath, toggleFullScreen }) {
  const { mode, fps } = useSelector((state) => state.game);
  const [game, setGame] = useState(null);
  const dispatch = useDispatch();
  const theme = useTheme();
  const ref = useRef(null);

  useEffect(() => {
    //

    return () => {
      //
    };
  }, []);

  useEffect(() => {
    if (game == null) {
      return;
    }

    game.sceneManager.enableStats(fps);
  }, [game, fps]);

  const setElapsedTime = useCallback((time) => {
    dispatch(gameActions.setElapsedTime(time));
  }, []);

  const setScore = useCallback((score) => {
    dispatch(gameActions.setScore(score));
  }, []);

  const setMode = useCallback((mode) => {
    dispatch(gameActions.setMode(mode));
  }, []);

  const clearRecords = useCallback(() => {
    if (game == null) {
      return;
    }

    game.scoreManager.clearScores()
  }, [game]);

  useEffect(() => {
    if (game == null) {
      const { width, height } = ref.current.getBoundingClientRect();
      const gameObject = new Game(
        width,
        height,
        {
          setMode,
          setScore,
          setElapsedTime,
        }
      );
      setGame(gameObject);
    }

    if (game != null) {
      return () => {
        // TODO: クリーンアップ処理
        game.stop();
        game.dispose();
        setMode('unstarted');
        setGame(null);
      };
    }
  }, [game]);

  return (
    <>
      <GameContainer id="container" ref={ref} />
      {mode === 'loading' ? <Progress /> : null}
      <Box sx={{ width: '100%', height: '100%', position: 'absolute', top: 0 }}>
        <DisplayTime />
        <DisplayScore />
        <Controls
          indexPath={indexPath}
          toggleFullScreen={toggleFullScreen}
          clearRecords={clearRecords}
        />
      </Box>
    </>
  );
}

GamePage.propTypes = {
  //
};

export default GamePage;
