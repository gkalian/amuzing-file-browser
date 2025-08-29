// Client entry point: mounts React app with Mantine theme and notifications
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { App } from './App';
import './i18n';

const theme = createTheme({
  fontFamily:
    "Manrope, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <MantineProvider defaultColorScheme="auto" theme={theme}>
    <Notifications
      position="top-right"
      style={{ top: 50, right: 12, zIndex: 1000, pointerEvents: 'auto', display: 'inline-block', width: 'max-content' }}
    />
    <App />
  </MantineProvider>
);
