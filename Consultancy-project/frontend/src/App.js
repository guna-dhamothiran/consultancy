import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/navbar";  // Use lowercase
import Login from "./Login/Login";
import Signup from "./Login/Signup";
import Production from "./Production/Production";
import Electrical from "./Electrical/ElectricalMaintenance";
import Admin from "./Admin/Admin";
import Home from "./Home/Home";   // ✅ Import the Home component

import "./App.css";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuth = (status) => {
    setIsAuthenticated(status);
  };

  return (
    <Router>
      <div className="app-container">
        {/* Navbar added here */}
        {isAuthenticated && <Navbar />}  

        <Routes>
          <Route path="/" element={<Login onAuth={() => handleAuth(true)} />} />
          <Route path="/signup" element={<Signup />} />

          <Route 
            path="/Home" 
            element={isAuthenticated ? <Home /> : <Navigate to="/" />} 
          />

          <Route 
            path="/production" 
            element={isAuthenticated ? <Production /> : <Navigate to="/" />} 
          />
          <Route 
            path="/electrical" 
            element={isAuthenticated ? <Electrical /> : <Navigate to="/" />} 
          />
           <Route 
              path="/Admin" 
              element={isAuthenticated ? <Admin /> : <Navigate to="/" />} 
            />
        
        </Routes>
        
      </div>
    </Router>
  );
};

export default App;
