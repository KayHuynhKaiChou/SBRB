import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from './app/app';
import { antdTheme } from './app/config/antd-theme.config';
import './styles/globals.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={antdTheme}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
