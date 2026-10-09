import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRoutes from './PrivateRoutes';
import PublicRoutes from './PublicRoutes';
import Login from '../Pages/Login/Login';
import Layout from '../Layout/Layout';
import Dashboard from '../Pages/Dashboard';
// import more private pages if needed

function NavigationRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoutes />}>
          <Route path="/" element={<Login />} />
        </Route>

        {/* Private Routes */}
        <Route element={<PrivateRoutes />}>
          <Route element={<Layout />}>
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
            {/* Add more private pages here */}
            {/* <Route path="/reports" element={<Reports />} /> */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default NavigationRoutes;
