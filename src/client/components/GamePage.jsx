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

const GameContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
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
  const { gameStarted } = useSelector((state) => state.system);
  const { elapsedTime } = useSelector((state) => state.game);

  const time = gameStarted ? elapsedTime : '';

  return (
    <Box
      sx={{
        color: '#fff',
        textAlign: 'right',
        fontSize: '2.5rem',
        position: 'absolute',
        fontFamily: font.monospaced,
        left: 'calc(50% - 50px)',
        top: 0,
      }}
    >
      {time}
    </Box>
  );
}

function DisplayScore() {
  const { elapsedTime, score } = useSelector((state) => state.game);
  const theme = useTheme();

  if (score == null) {
    return null;
  }

  const { data, sum, highscore } = score;
  const highscoreData = highscore != null ? `${highscore.value} ${highscore.distance}` : '--';

  return (
    <>
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
      <ScoreValue sx={{ top: '75%', color: yellow[500] }}>{sum}</ScoreValue>
      <ScoreItem sx={{ top: '85%' }}>HIGH SCORE</ScoreItem>
      <ScoreValue sx={{ top: '85%' }}>
        {highscore != null ? (
          <>
            <Typography variant="h4" sx={{ px: theme.spacing(2), display: 'inline' }}>
              {`${highscore.distance} before`}
            </Typography>
            {highscore.value}
          </>
        ) : '--'}
      </ScoreValue>
    </>
  );
}


function Controls({ toggleFullScreen }) {
  const { isFullscreen } = useSelector((state) => state.system);
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'absolute',
        right: theme.spacing(2),
        bottom: theme.spacing(2),
      }}
    >
      <Button variant="outlined" onClick={toggleFullScreen}>
        {!isFullscreen ? '全画面にする' : '全画面を解除'}
      </Button>
    </Box>
  );
}

function GamePage({ toggleFullScreen }) {
  const { gameStarted } = useSelector((state) => state.system);
  const [game, setGame] = useState(null);
  const dispatch = useDispatch();
  const navicate = useNavigate();
  const theme = useTheme();
  const ref = useRef(null);

  useEffect(() => {
    //

    return () => {
      //
    };
  }, []);

  const setGameStarted = useCallback((bool) => {
    dispatch(systemActions.setGameStarted(bool));
  }, []);

  const setElapsedTime = useCallback((time) => {
    dispatch(gameActions.setElapsedTime(time));
  }, []);

  const setScore = useCallback((score) => {
    dispatch(gameActions.setScore(score));
  }, []);

  useEffect(() => {
    if (game == null) {
      const { width, height } = ref.current.getBoundingClientRect();
      const gameObject = new Game(
        width,
        height,
        {
          setGameStarted,
          setElapsedTime,
          setScore,
        }
      );
      setGame(gameObject);
    }

    if (game != null) {
      return () => {
        // TODO: クリーンアップ処理
        game.stop();
        game.dispose();
        setGame(null);
      };
    }
  }, [game]);

  return (
    <>
      {!gameStarted ? (
        <Box
          sx={{
            position: 'absolute',
            left: 'calc(50% - 24px)',
            top: 'calc(50% - 24px)',
          }}
        >
          <CircularProgress />
        </Box>
      ) : null}
      <GameContainer id="container" ref={ref} />
      <DisplayTime />
      <DisplayScore />
      <Controls toggleFullScreen={toggleFullScreen} />
    </>
  );
}

GamePage.propTypes = {
  //
};

export default GamePage;
