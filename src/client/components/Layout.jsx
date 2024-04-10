import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

import { Container, Box } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';

import Header from './Header';

function Layout({ children = null } = {}) {
  const theme = useTheme();

  useEffect(() => {
    //

    return () => {
      //
    };
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Header />
      <Container maxWidth="md" sx={{ height: '100%' }}>{children}</Container>
    </Box>
  );
}

Layout.propTypes = {
  //
};

export default Layout;
