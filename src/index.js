import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './theme/global.css';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme/theme';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <App />
      </LocalizationProvider>
    </ThemeProvider>
  </Provider>
);



