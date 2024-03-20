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
import { Button, Box } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';

import Game from '../game/main';
import Layout from './Layout';
import { Meta } from '../common';
import systemSlice from '../redux/systemSlice';

const { actions: systemActions } = systemSlice;

const meta = new Map(Meta);

const GameContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  overflow: 'clip',
}));

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

  useEffect(() => {
    if (game == null && ref.current != null) {
      const { width, height } = ref.current.getBoundingClientRect();
      dispatch(systemActions.setGameStarted(true));
      const gameObject = new Game(width, height);
      setGame(gameObject);
    }

    if (game != null) {
      return () => {
        // TODO: クリーンアップ処理
        game.stop();
        game.dispose();
        setGame(null);
        dispatch(systemActions.setGameStarted(false));
      };
    }
  }, [game, ref.current]);

  return (
    <>
      <GameContainer id="container" ref={ref} />
      <Controls toggleFullScreen={toggleFullScreen} />
    </>
  );
}

GamePage.propTypes = {
  //
};

export default GamePage;
