import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import MainPage from './Pages/MainPage/MainPage.js'; // Assuming you have a MainPage component
import Agent from './Pages/Agent/Agent.js'; // Assuming you have an AuthPage component
import Footer from './Pages/Footer/Footer.js';
import AdminDashboard from './Pages/AdminDashboard/AdminDashboard.js';
import CharacterCreation from './Pages/Agent/CharacterCreation.js';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/test" element={<CharacterCreation />} />


          {/* Add more routes here as needed */}
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
