import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import './App.css';
import Navigation from './components/Navigation';
import PublicMap from './components/PublicMap';
import AdminMap from './components/AdminMap';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navigation />
          <Box sx={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<PublicMap />} />
              <Route path="/admin" element={<AdminMap />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
