import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

import {
  Container,
  Grid,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';

import Header from './Header';

const ColumnGrid = styled(Grid)(
  ({ theme }) => ({
    height: '100%',
    flexDirection: 'column',
  })
);

const Layout = ({ children = null } = {}) => {
  const theme = useTheme();

  useEffect(() => {
    //

    return () => {
      //
    };
  }, []);

  return (
    <ColumnGrid container>
      <Grid item>
        <Header />
      </Grid>
      <Grid item sx={{ flexGrow: 1 }}>
        <Container sx={{ height: '100%' }}>
          {children}
        </Container>
      </Grid>
    </ColumnGrid>
  );
};

Layout.propTypes = {
  //
};

export default Layout;
