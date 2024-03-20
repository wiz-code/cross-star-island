import React from 'react';
import PropTypes from 'prop-types';

import { AppBar, Toolbar, Typography } from '@mui/material';

import { Meta } from '../common';

const meta = new Map(Meta);
const siteName = meta.get('siteName');

function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {siteName}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

Header.propTypes = {};

export default Header;
