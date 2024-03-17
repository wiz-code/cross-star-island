import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

import {
  Grid,
  Typography,
  Button,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';

import Layout from './Layout';
import { Meta } from '../common';

const meta = new Map(Meta);
const title = meta.get('title');
const description = meta.get('description');

const ColumnGrid = styled(Grid)(
  ({ theme }) => ({
    height: '100%',
    flexDirection: 'column',
  })
);

const Row = styled(Grid)(
  ({ theme }) => ({
    margin: theme.spacing(2, 0),
  })
);

const TitlePage = ({ toggleFullScreen }) => {
  const { isFullscreen } = useSelector((state) => state.system);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    //

    return () => {
      //
    };
  }, []);

  const playGame = (e) => {
    e.preventDefault();
    navigate('/game');
  };

  return (
    <Layout>
      <ColumnGrid container>
        <Row item sx={{ mt: theme.spacing(4) }}>
          <Typography variant="h1">{title}</Typography>
        </Row>
        <Row item sx={{ display: 'flex', gap: theme.spacing(1), flexGrow: 1 }}>
          <Typography variant="body1">{description}</Typography>
        </Row>
        <Row container item sx={{ gap: theme.spacing(1), justifyContent: 'center' }}>
          <Button variant="contained" component={Link} to="/game">
            {'ゲームを開始する'}
          </Button>
        </Row>
        <Row container item sx={{ mb: theme.spacing(4), gap: theme.spacing(1), justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="secondary" onClick={toggleFullScreen}>
            {!isFullscreen ? '全画面にする' : '全画面を解除'}
          </Button>
        </Row>
      </ColumnGrid>
    </Layout>
  );
};

TitlePage.propTypes = {
  //
};

export default TitlePage;
