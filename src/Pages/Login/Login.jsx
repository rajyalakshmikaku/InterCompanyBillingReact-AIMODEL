import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, forgotPassword ,checkStatus } from '../../redux/LoginSlice';
import { useFormik } from 'formik';
import { LoginSchem } from '../../validations/LoginSchem';
import alertify from 'alertifyjs';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthLayout, Modal, Button } from '../../components/ui';
import { FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import './Login.css';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loginError, loading, forgotLoading, forgotError } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const formik1 = useFormik({
    initialValues: { username: '', password: '' },
    validationSchema: LoginSchem,
    onSubmit: (values) => {
      dispatch(login({ userName: values.username, Password: values.password }));
    },
  });

  const formik = useFormik({
  initialValues: { username: "", password: "" },
  validationSchema: LoginSchem,
  onSubmit: async (values) => {
    try {
      debugger
      // Login first
      await dispatch(
        login({
          userName: values.username,
          Password: values.password,
        })
      ).unwrap();
      console.log("Login Successfully");
      // Then call status check
      await dispatch(checkStatus()).unwrap();

      const normalizedRole = String(sessionStorage.getItem('roleName') || '')
        .toLowerCase()
        .replace(/\s+/g, '');

      navigate(normalizedRole === 'superadmin' ? "/quotationdashboard" : "/landingpage");
    } catch (err) {
      console.error(err);
    }
  },
});

  // useEffect(() => {
  //   if (user) navigate('/quotationdashboard');
  // }, [user, navigate]);



 const handleForgotSubmit = async (event) => {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  if (!forgotEmail.trim()) {
    setEmailError("Email is required");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(forgotEmail)) {
    setEmailError("Please enter a valid email address");
    return;
  }

  setEmailError("");

  try {
    const result = await dispatch(forgotPassword(forgotEmail)).unwrap();
    alertify.alert("Success", result.message || "Password reset code sent.");
    setShowForgotPopup(false);
    setForgotEmail("");
  } catch (error) {
    setEmailError(error?.message || "Failed to send reset email.");
  }
};

  const forgotMessage = "Enter your registered email to receive a password reset link.";
  const displayForgotError = emailError || forgotError;

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="lp-card"
      >
        {/* Header */}
        <div className="lp-header">
          <motion.div
            className="lp-icon-ring"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 18 }}
          >
            <FiLock size={24} color="#2E6C3B" />
          </motion.div>
          <h2 className="lp-title">Welcome Back!</h2>
          <p className="lp-subtitle">Sign in to continue to your Inter-Company Billing account</p>
        </div>

        {/* Form */}
        <form onSubmit={formik.handleSubmit} noValidate className="lp-form">
          {/* Username / Email field */}
          <div className="lp-field-group">
            <label className="lp-label">Email or Username</label>
            <div className={`lp-input-wrap ${focusedField === 'username' ? 'focused' : ''} ${formik.touched.username && formik.errors.username ? 'has-error' : ''}`}>
              <input
                type="text"
                name="username"
                placeholder="Enter your email or username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={(e) => { formik.handleBlur(e); setFocusedField(null); }}
                onFocus={() => setFocusedField('username')}
                className="lp-input"
                autoComplete="username"
              />
            </div>
            <AnimatePresence>
              {formik.touched.username && formik.errors.username && (
                <motion.span
                  className="lp-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {formik.errors.username}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Password field */}
          <div className="lp-field-group">
            <label className="lp-label">Password</label>
            <div className={`lp-input-wrap ${focusedField === 'password' ? 'focused' : ''} ${formik.touched.password && formik.errors.password ? 'has-error' : ''}`}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={(e) => { formik.handleBlur(e); setFocusedField(null); }}
                onFocus={() => setFocusedField('password')}
                className="lp-input lp-input--padded"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="lp-eye-btn"
                onClick={() => setShowPassword((p) => !p)}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
              </button>
            </div>
            <AnimatePresence>
              {formik.touched.password && formik.errors.password && (
                <motion.span
                  className="lp-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {formik.errors.password}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Forgot link */}
          <div className="lp-forgot-row">
            <button
              type="button"
              className="lp-forgot-link"
              onClick={() => setShowForgotPopup(true)}
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            className="lp-submit-btn"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            whileHover={{ boxShadow: '0 10px 28px rgba(46,108,59,0.38)' }}
          >
            {loading ? <span className="lp-spinner" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>

          {/* Login error */}
          <AnimatePresence>
            {loginError && !showForgotPopup && (
              <motion.div
                className="lp-alert-error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {loginError}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Footer link */}
        <p className="lp-footer-text">
          Don't have an account?{' '}
          <button type="button" className="lp-link-btn" onClick={() => navigate('/register')}>
            User Registration
          </button>
        </p>
      </motion.div>

      {/* Forgot Password Modal */}
      <Modal
        open={showForgotPopup}
        onClose={() => { setShowForgotPopup(false); setForgotEmail(''); setEmailError(''); }}
        title="Reset Password"
        actions={
          <Button
            type="button"
            variant="contained"
            sx={{ px: 4 }}
            onClick={handleForgotSubmit}
            loading={forgotLoading}
            disabled={forgotLoading}
          >
            Submit
          </Button>
        }
      >
        <form id="forgot-form" onSubmit={handleForgotSubmit}>
          <div className="lp-modal-description">{forgotMessage}</div>
          <div className="lp-field-group" style={{ marginBottom: 0 }}>
            <label className="lp-label">Email Address</label>
            <div className={`lp-input-wrap has-icon ${displayForgotError ? 'has-error' : ''}`}>
              <span className="lp-input-icon"><FiMail size={16} /></span>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={forgotEmail}
                onChange={(e) => { setForgotEmail(e.target.value); setEmailError(''); }}
                className="lp-input"
              />
            </div>
            {displayForgotError && <span className="lp-error">{displayForgotError}</span>}
          </div>
        </form>
      </Modal>
    </AuthLayout>
  );
};

export default Login;
