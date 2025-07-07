import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import PublicMap from './components/PublicMap';
import AdminMap from './components/AdminMap';

function App() {
  return (
    <Router>
      <div className="h-full flex flex-col">
        <Navigation />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<PublicMap />} />
            <Route path="/admin" element={<AdminMap />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
