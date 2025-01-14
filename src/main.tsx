import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import CustomHeader from "./Header.tsx";

Amplify.configure(outputs);

// Define a custom theme
const customTheme = {
  name: 'custom-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          '10': '#3B82F6',
          '20': '#F97316',
          '40': '#3B82F6',
          '60': '#3B82F6',
          '80': '#F97316',
          '90': '#F97316',
        },
      },
      background: {
        primary: {
          value: '#ffffff', // Background color
        },
        secondary: {
          value: '#ffffff', // Secondary background color
        },
      },
      font: {
        primary: {
          value: '#000000', // Primary font color
        },
        secondary: {
          value: '#000000', // Secondary font color
        },
      },
    },
    components: {
      button: {
        primary: {
          backgroundColor: { value: '#3B82F6' }, // Primary button background color
          color: { value: '#ffffff' }, // Primary button text color
        },
        secondary: {
          backgroundColor: { value: '#3B82F6' }, // Secondary button background color
          color: { value: '#ffffff' }, // Secondary button text color
        },
        tertiary: {
          value: '#888888', // Tertiary font color
        },
      },
    },
  },
};

const container = document.getElementById("root");
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <ThemeProvider theme={customTheme}>
        <Authenticator components={{ Header: CustomHeader }}>
          <App />
        </Authenticator>
      </ThemeProvider>
    </React.StrictMode>
  );
}