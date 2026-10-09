import React, { useState, useRef, useEffect } from 'react';
import './TopNavbar.css';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown, FaUserCircle, FaUserEdit, FaKey, FaSignOutAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const TopNavbar = () => {
  const navigate = useNavigate();
  const Name = sessionStorage.getItem('Name') || 'User';
  const roleName = sessionStorage.getItem('roleName');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/', { replace: true });
    // window.location.reload();
  };

  const handleEditProfile = () => {
    navigate('/editprofile');
    setDropdownOpen(false);
  };

  const handleChangePassword = () => {
    navigate('/changepassword');
    setDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = Name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const menuItems = [
    ...(roleName !== 'SuperAdmin' && roleName !== 'Super Admin'
      ? [{ label: 'Edit Profile', icon: FaUserEdit, onClick: handleEditProfile }]
      : []),
    { label: 'Change Password', icon: FaKey, onClick: handleChangePassword },
    { label: 'Logout', icon: FaSignOutAlt, onClick: handleLogout, danger: true },
  ];

  return (
    <header className="top-navbar">
      <div className="navbar-brand">
        <div className="logo-ring">
          <img src="/files/assets/images/ITSALOGO.png" alt="Logo" className="logo-img" />
        </div>
        <div className="brand-text">
          <span className="navbar-product">Inter-Company Billing</span>
          <span className="navbar-tagline">Enterprise Portal</span>
        </div>
      </div>

      <div className="navbar-actions">
        <div
          className="user-dropdown"
          ref={dropdownRef}
          onClick={() => setDropdownOpen((prev) => !prev)}
        >
          <div className="user-avatar-ring">
            <span className="user-avatar-initials">{initials || <FaUserCircle />}</span>
          </div>
          <span className="user-meta">
            <span className="user-name">{Name}</span>
            {roleName && <span className="user-role">{roleName}</span>}
          </span>
          <motion.span
            className="user-caret"
            animate={{ rotate: dropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FaChevronDown size={12} />
          </motion.span>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                className="dropdown-menu"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div className="dropdown-header">
                  <div className="dropdown-avatar">{initials}</div>
                  <div className="dropdown-header-meta">
                    <span className="dropdown-header-name">{Name}</span>
                    {roleName && <span className="dropdown-header-role">{roleName}</span>}
                  </div>
                </div>
                <div className="dropdown-divider" />
                {menuItems.map(({ label, icon: Icon, onClick, danger }) => (
                  <div
                    key={label}
                    className={`dropdown-item ${danger ? 'dropdown-item--danger' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
