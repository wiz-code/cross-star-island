import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import propTypes from 'prop-types';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Container,
  Grid,
  Button,
  Box,
  TextField,
  Typography,
  CssBaseline,
} from '@mui/material';

import * as THREE from 'three'; /// //////////////
import init from './game/init';
import Loop from './game/loop';
import { StepsPerFrame } from './game/settings';

const theme = createTheme({
  typography: {
    fontFamily: [
      '"Helvetica Neue"',
      'Arial',
      '"メイリオ"',
      'Meiryo',
      '"ヒラギノ角ゴ ProN W3"',
      '"Hiragino Kaku Gothic ProN"',
      '"ヒラギノ角ゴシック"',
      '"Hiragino Sans"',
      '"Roboto"',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.25rem',
      fontWeight: 'bolder',
      lineHeight: 1.2,
      letterSpacing: '0.05rem',
      fontFeatureSettings: '"palt" 1',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 'bolder',
      lineHeight: 1.2,
      letterSpacing: '0.04rem',
      fontFeatureSettings: '"palt" 1',
    },
    h3: {
      fontSize: '1.6rem',
      fontWeight: 'bolder',
      lineHeight: 1.2,
      letterSpacing: '0.03rem',
      fontFeatureSettings: '"palt" 1',
    },
    h4: {
      fontSize: '1.35rem',
      fontWeight: 'bolder',
      lineHeight: 1.3,
      letterSpacing: '0.03rem',
      fontFeatureSettings: '"palt" 1',
    },
    h5: {
      fontSize: '1.15rem',
      fontWeight: 'bolder',
      lineHeight: 1.3,
      letterSpacing: '0.02rem',
      fontFeatureSettings: '"palt" 1',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 'bolder',
      lineHeight: 1.3,
      letterSpacing: '0.02rem',
      fontFeatureSettings: '"palt" 1',
    },
    body1: {
      lineHeight: 1.7,
    },
    body2: {
      lineHeight: 1.7,
    },
    subtitle1: {
      lineHeight: 1.5,
    },
    subtitle2: {
      lineHeight: 1.5,
    },
  },
});

const update = function () {
  const deltaTime = this.clock.getDelta() / StepsPerFrame;

  for (let i = 0; i < StepsPerFrame; i += 1) {
    this.controls.update(deltaTime);

    this.ammo.update(deltaTime);
    this.player.update(deltaTime);
  }

  this.renderer.clear();
  this.renderer.render(this.scene.field, this.camera.field);
  this.renderer.render(this.scene.screen, this.camera.screen);

  this.stats.update();
};

function App() {
  console.log('App::rendered');
  const [objects, setObjects] = useState(null);
  const [rendering, setRendering] = useState(null);
  const [started, setStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const data = init();
    setObjects(data);

    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement != null);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (objects != null) {
      const loop = new Loop(update, objects);
      setRendering(loop);
    }
  }, [objects]);

  const togglePlay = useCallback(() => {
    if (rendering != null) {
      if (!started) {
        rendering.start();
        setStarted(true);
      } else {
        rendering.stop();
        setStarted(false);
      }
    }
  }, [rendering, started]);

  const toggleFullScreen = useCallback(() => {
    if (document.fullscreenElement == null) {
      document.documentElement.requestFullscreen();
    } else if (typeof document.exitFullscreen == 'function') {
      document.exitFullscreen();
    }
  }, [document.fullscreenElement]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* <Container>
        <Grid container>
          <Grid item xs={12}>

          </Grid>
        </Grid>
      </Container>} */}
      <Box id="container" sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', gap: theme.spacing(1), position: 'absolute', top: theme.spacing(2), right: theme.spacing(2) }}>
          <Button variant="contained" onClick={togglePlay}>
            {started ? '停止する' : '開始する'}
          </Button>
          <Button variant="contained" onClick={toggleFullScreen}>
            {!isFullscreen ? '全画面にする' : '全画面を解除'}
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

App.propTypes = {
  //
};

export default App;
