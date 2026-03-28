import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { ConfigProvider } from 'antd';
import App from './app/app';
import { apolloClient } from './apollo/apollo-client';
import { antdTheme } from './app/config/antd-theme.config';
import './styles/globals.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <ConfigProvider theme={antdTheme}>
          <App />
        </ConfigProvider>
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>,
);
