import React, {
  lazy,
  Suspense,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import { Box, CircularProgress, CssBaseline } from '@mui/material';

import defaultTheme from './theme';
import systemSlice from './redux/systemSlice';

const TitlePage = lazy(() => import('./components/TitlePage'));
const GamePage = lazy(() => import('./components/GamePage'));

const { actions: systemActions } = systemSlice;
const theme = createTheme(defaultTheme);

const Wrapper = styled(Box)(({ theme }) => ({ height: '100vh' }));

function App({ indexPath }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const onFullscreenChange = () => {
      dispatch(
        systemActions.setIsFullscreen(document.fullscreenElement != null),
      );
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (document.fullscreenElement == null) {
      document.documentElement.requestFullscreen();
    } else if (typeof document.exitFullscreen === 'function') {
      document.exitFullscreen();
    }
  }, [document.fullscreenElement]);

  function Loading() {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }



  const gameLink = useMemo(() => {
    if (indexPath === '/') {
      return '/game';
    }

    return `${indexPath}/game`;
  }, [indexPath]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Wrapper>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route
              path={indexPath}
              element={
                <TitlePage
                  gameLink={gameLink}
                  toggleFullScreen={toggleFullScreen}
                />
              }
            />
            <Route
              path={gameLink}
              element={<GamePage indexPath={indexPath} toggleFullScreen={toggleFullScreen} />}
            />
          </Routes>
        </Suspense>
      </Wrapper>
    </ThemeProvider>
  );
}

App.propTypes = {
  //
};

export default App;
