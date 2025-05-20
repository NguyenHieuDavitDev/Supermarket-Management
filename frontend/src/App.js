import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Store from "./components/Store";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard/*" element={<Dashboard />} />
      <Route path="/store/*" element={<Store />} />
      <Route path="/" element={<Navigate to="/store" replace />} />
    </Routes>
  );
}

export default App;
