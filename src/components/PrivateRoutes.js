import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const normalizeScreenName = (screenName) =>
  String(screenName || '').replace(/^\//, '').toLowerCase();

const PrivateRoute = ({ children, requiredScreen }) => {
  const { user } = useSelector((state) => state.auth); // adjust to match your redux slice

  // Check if user is logged in
  if (!user) {
    return <Navigate to="/" replace />; // redirect to login
  }

  if (requiredScreen) {
    const roleName = sessionStorage.getItem('roleName') || user.role || '';
    const isSuperAdmin = roleName.toLowerCase().replace(/\s+/g, '') === 'superadmin';
    const screenList = user.screenList || JSON.parse(sessionStorage.getItem('screenList') || '[]');
    const hasScreenAccess = screenList.some(
      (screen) =>
        screen.status === 'Y' &&
        normalizeScreenName(screen.screenName) === normalizeScreenName(requiredScreen),
    );

    if (!isSuperAdmin && !hasScreenAccess) {
      return (
        <Navigate
          to="/landingpage"
          replace
          state={{ accessMessage: 'You do not have access to this screen.' }}
        />
      );
    }
  }

  return children;
};

export default PrivateRoute;
