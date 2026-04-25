import { ApolloProvider } from '@apollo/client';
import { ConfigProvider } from 'antd';
import { NotificationProvider } from '@sbrb/shared-apollo-client';
import type { ReactNode } from 'react';
import { apolloClient } from '../apollo/apollo-client';
import { antdTheme } from './config/antd-theme.config';

/**
 * Web-specific provider stack. Desktop apps can compose their own stack,
 * re-using `<NotificationProvider>` from `@sbrb/shared-apollo-client`.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <ConfigProvider theme={antdTheme}>
        <NotificationProvider>{children}</NotificationProvider>
      </ConfigProvider>
    </ApolloProvider>
  );
}
