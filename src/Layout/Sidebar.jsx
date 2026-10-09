import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaUserCircle,
} from 'react-icons/fa';
import './Sidebar.css';
import { allRoutes, GROUP_ORDER } from './sidebarRoutes';


// Each route carries the section group + icon used to render the
// grouped, icon-based navigation. The access-control filtering below
// still decides which of these actually appear for the logged-in role.
const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

const groupVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.25, ease: 'easeOut' },
  }),
};

const Sidebar = () => {
  const sidebarRef = useRef();
  const [allowedRoutes, setAllowedRoutes] = useState([]);

  const userName = sessionStorage.getItem('Name') || sessionStorage.getItem('roleName') || 'User';
  const roleName = sessionStorage.getItem('roleName') || '';

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
    
    useEffect(() => {
  const screenList = JSON.parse(sessionStorage.getItem('screenList')) || [];
  const currentRole = sessionStorage.getItem('roleName') || '';

  const isSuperAdmin =
    currentRole.toLowerCase().replace(/\s+/g, '') === 'superadmin';

  const allowedPaths = screenList
    .filter(screen => screen.status === 'Y')
    .map(screen => screen.screenName.trim().toLowerCase());

  // Normal users: only show screens assigned to them
  const filtered = allRoutes.filter(route =>
    allowedPaths.includes(route.path.toLowerCase())
  );

  // Super Admin only screens
  if (isSuperAdmin) {
    const superAdminOnlyRoutes = [
      '/bulk-upload',
      '/screenmapping',
      '/userverification',
      '/deleted',
      '/aichat',
    ];

    superAdminOnlyRoutes.forEach(path => {
      const route = allRoutes.find(
        r => r.path.toLowerCase() === path
      );

      if (route && !filtered.some(r => r.path.toLowerCase() === path)) {
        filtered.push(route);
      }
    });
  }

  setAllowedRoutes(filtered);
}, []);
  const groupedRoutes = GROUP_ORDER
    .map(group => ({
      group,
      items: allowedRoutes.filter(route => route.group === group),
    }))
    .filter(section => section.items.length > 0);

  return (
    <motion.aside
      className="sidebar"
      ref={sidebarRef}
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      <nav className="sidebar-nav custom-scrollbar">
        {groupedRoutes.map(({ group, items }, groupIndex) => (
          <motion.div
            className="menu-group"
            key={group}
            custom={groupIndex}
            variants={groupVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="menu-group-title">{group}</p>
            <ul className="menu">
              {items.map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    className={({ isActive }) => (isActive ? 'active menu-link' : 'menu-link')}
                  >
                    <span className="menu-icon-wrapper">
                      <Icon className="menu-icon" />
                    </span>
                    <span className="menu-label">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </nav>

      <div className="sidebar-profile">
        <div className="sidebar-profile-avatar-ring">
          <span className="sidebar-profile-initials">{initials || <FaUserCircle size={20} />}</span>
        </div>
        <div className="sidebar-profile-meta">
          <span className="sidebar-profile-name">{userName}</span>
          {roleName && <span className="sidebar-profile-role">{roleName}</span>}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;