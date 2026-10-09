import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import './Layout.css';
import 'alertifyjs/build/css/alertify.css';

const Layout = () => {
  return (
    <div className="app-shell">
      <TopNavbar />
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
