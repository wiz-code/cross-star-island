import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';

import store from './redux/store';

import App from './App';

const container = document.getElementById('app');
const root = createRoot(container);


const filename = '/index.html';
let pathname = location.pathname;
let indexPath = '/';

if (pathname.includes(filename)) {
  const lastIndex = pathname.lastIndexOf(filename);
  pathname = pathname.substring(0, lastIndex);
  indexPath = filename;
}

root.render(
  <Provider store={store}>
    <Router basename={pathname}>
      <App indexPath={indexPath} />
    </Router>
  </Provider>,
);
