import React, { useState, useEffect, useCallback } from 'react';
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
  const deltaTime = this.clock.getDelta();

  for (let i = 0; i < StepsPerFrame; i += 1) {
    this.controls.update(deltaTime);
    this.player.update(deltaTime);
    this.renderer.render(this.scene, this.camera);
    this.stats.update();
  }

};

function App() {
  console.log('App::rendered');
  const [objects, setObjects] = useState(null);
  const [rendering, setRendering] = useState(null);

  useEffect(() => {
    const data = init();
    setObjects(data);
  }, []);

  useEffect(() => {
    if (objects != null) {
      const loop = new Loop(update, objects);
      setRendering(loop);
    }
  }, [objects]);

  const started = rendering != null && rendering.isActive();

  const start = useCallback(() => {
    if (rendering != null) {
      rendering.start();
    }
  }, [rendering]);

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
        <Box sx={{ position: 'absolute', right: 0 }}>
          <Button variant="contained" onClick={start}>
            {started ? '停止する' : '開始する'}
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
