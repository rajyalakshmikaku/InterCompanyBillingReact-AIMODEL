import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRoles, registerUser, fetchActiveUrl } from '../../redux/RegistrationSlice';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';
import { useFormik } from 'formik';
import RegistrationSchema from '../../validations/RegistrationSchema';
import HelpModal from '../../components/Common/HelpModal';
import { fetchCompaniesListwithoutRole } from '../../redux/CustomerSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthLayout } from '../../components/ui';
import { FiUser, FiPhone, FiBriefcase, FiLock, FiMapPin, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import './Registration.css';

const BRAND_FEATURES = [
  { icon: '📋', text: 'Quotations & approvals' },
  { icon: '🧾', text: 'Invoicing & credit notes' },
  { icon: '🏢', text: 'Customers & companies' },
  { icon: '🔐', text: 'Role-based access control' },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' } }),
};

const RegField = ({ label, required, error, touched, children }) => (
  <div className="rp-field-group">
    <label className="rp-label">
      {label}{required && <span className="rp-req">*</span>}
    </label>
    {children}
    <AnimatePresence>
      {touched && error && (
        <motion.span
          className="rp-error"
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.18 }}
        >
          {error}
        </motion.span>
      )}
    </AnimatePresence>
  </div>
);

const RegSection = ({ icon: Icon, title, index, children }) => (
  <motion.div
    className="rp-section"
    custom={index}
    variants={sectionVariants}
    initial="hidden"
    animate="visible"
  >
    <div className="rp-section-header">
      <span className="rp-section-icon"><Icon size={14} /></span>
      <span className="rp-section-title">{title}</span>
    </div>
    <div className="rp-section-body">{children}</div>
  </motion.div>
);

function Registration() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const companies = useSelector((state) => state.Customers.comapnieswithoutRole);
  const { roles, activeurl } = useSelector((state) => state.registration);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchActiveUrl());
    dispatch(fetchCompaniesListwithoutRole());
  }, [dispatch]);

  const redirectUrl = `${activeurl?.[0] || ''}activation`;

  console.log('redirectUrl',redirectUrl);
  const formik = useFormik({
    // initialValues: {
    //   role: '', title: '', name: '', surname: '', gender: '',
    //   email: '', username: '', mobile: '', address: '',
    //   company: '', customerAccount: '', password: '', confirmPassword: '',
    // },
     initialValues: {
       title: '', name: '', surname: '', gender: '',
      email: '', username: '', mobile: '', address: '',
     customerAccount: '', password: '', confirmPassword: '',
    },
    validationSchema: RegistrationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        setSubmitting(true);
        const response = await dispatch(registerUser({ ...values, activationlink: redirectUrl })).unwrap();
        //alertify.alert('Success', response?.message || 'User registered successfully.');
        alertify.alert(
          'Success',
          response?.message || 'User registered successfully.',
          function () {
            navigate('/');
          }
        );
        resetForm();
      } catch (error) {
        console.error('Registration error:', error);
        alertify.alert('error', typeof error === 'string' ? error : error?.message || 'Registration failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleRoleChange = (e) => {
    formik.handleChange(e);
  };

  const selectedRole = roles.find((r) => r.id === Number(formik.values.role));
  const isCustomerRole = selectedRole?.roleName === 'Customer';

  const f = formik;

  return (
    <AuthLayout
      features={BRAND_FEATURES}
      contentMaxWidth={700}
    >
      <motion.div
        className="rp-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* Card Header */}
        <div className="rp-header">
          <h2 className="rp-title">Create Account</h2>
          <p className="rp-subtitle">Register a new account to get started with Inter-Company Billing</p>
        </div>

        <form onSubmit={f.handleSubmit} noValidate>

          {/* Personal Information */}
          <RegSection icon={FiUser} title="Personal Information" index={0}>
            <div className="rp-grid rp-grid--2">
              <RegField label="Title" required error={f.errors.title} touched={f.touched.title}>
                <select
                  name="title"
                  value={f.values.title}
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  className={`rp-select ${f.touched.title && f.errors.title ? 'rp-has-error' : ''}`}
                >
                  <option value="">Select Title</option>
                  <option value="Miss">Miss</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                </select>
              </RegField>

              <RegField label="Gender" required error={f.errors.gender} touched={f.touched.gender}>
                <select
                  name="gender"
                  value={f.values.gender}
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  className={`rp-select ${f.touched.gender && f.errors.gender ? 'rp-has-error' : ''}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Others">Others</option>
                </select>
              </RegField>

              <RegField label="Name" required error={f.errors.name} touched={f.touched.name}>
                <input
                  name="name"
                  type="text"
                  placeholder="First name"
                  value={f.values.name}
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  onInput={(e) => { e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, ''); }}
                  className={`rp-input ${f.touched.name && f.errors.name ? 'rp-has-error' : ''}`}
                />
              </RegField>

              <RegField label="Surname" required error={f.errors.surname} touched={f.touched.surname}>
                <input
                  name="surname"
                  type="text"
                  placeholder="Last name"
                  value={f.values.surname}
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  className={`rp-input ${f.touched.surname && f.errors.surname ? 'rp-has-error' : ''}`}
                />
              </RegField>
            </div>
          </RegSection>

          {/* Contact Information */}
          <RegSection icon={FiPhone} title="Contact Information" index={1}>
            <div className="rp-grid rp-grid--2">
              <RegField label="Email" required error={f.errors.email} touched={f.touched.email}>
                <input
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={f.values.email}
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  className={`rp-input ${f.touched.email && f.errors.email ? 'rp-has-error' : ''}`}
                />
              </RegField>

              <RegField label="Mobile" required error={f.errors.mobile} touched={f.touched.mobile}>
                <input
                  name="mobile"
                  type="text"
                  placeholder="10-digit number"
                  value={f.values.mobile}
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  maxLength={10}
                  className={`rp-input ${f.touched.mobile && f.errors.mobile ? 'rp-has-error' : ''}`}
                />
              </RegField>
            </div>
          </RegSection>

          {/* Company Information */}
          {/* <RegSection icon={FiBriefcase} title="Company Information" index={2}>
            <div className="rp-grid rp-grid--2">
              <RegField label="Role Type" required error={f.errors.role} touched={f.touched.role}>
                <select
                  name="role"
                  value={f.values.role}
                  onChange={handleRoleChange}
                  onBlur={f.handleBlur}
                  className={`rp-select ${f.touched.role && f.errors.role ? 'rp-has-error' : ''}`}
                >
                  <option value="">Select Role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.roleName}</option>
                  ))}
                </select>
              </RegField>

              <RegField label="Company" required error={f.errors.company} touched={f.touched.company}>
                <select
                  name="company"
                  value={f.values.company}
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  className={`rp-select ${f.touched.company && f.errors.company ? 'rp-has-error' : ''}`}
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </RegField>

              {isCustomerRole && (
                <div className="rp-col-full">
                  <RegField label="Customer Account No" required error={f.errors.customerAccount} touched={f.touched.customerAccount}>
                    <input
                      name="customerAccount"
                      type="text"
                      placeholder="Account number"
                      value={f.values.customerAccount}
                      onChange={f.handleChange}
                      onBlur={f.handleBlur}
                      className={`rp-input ${f.touched.customerAccount && f.errors.customerAccount ? 'rp-has-error' : ''}`}
                    />
                  </RegField>
                </div>
              )}
            </div>
          </RegSection> */}

          {/* Account Information */}
          <RegSection icon={FiLock} title="Account Information" index={3}>
            <div className="rp-grid rp-grid--3">
              <RegField label="Username" required error={f.errors.username} touched={f.touched.username}>
                <input
                  name="username"
                  type="text"
                  placeholder="Choose a username"
                  value={f.values.username}
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  className={`rp-input ${f.touched.username && f.errors.username ? 'rp-has-error' : ''}`}
                />
              </RegField>

              <RegField label="Password" required error={f.errors.password} touched={f.touched.password}>
                <div className="rp-password-wrap">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create password"
                    value={f.values.password}
                    onChange={f.handleChange}
                    onBlur={f.handleBlur}
                    className={`rp-input rp-input--eye ${f.touched.password && f.errors.password ? 'rp-has-error' : ''}`}
                  />
                  <button type="button" className="rp-eye-btn" onClick={() => setShowPassword((p) => !p)} tabIndex={-1}>
                    {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </RegField>

              <RegField label="Confirm Password" required error={f.errors.confirmPassword} touched={f.touched.confirmPassword}>
                <div className="rp-password-wrap">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={f.values.confirmPassword}
                    onChange={f.handleChange}
                    onBlur={f.handleBlur}
                    className={`rp-input rp-input--eye ${f.touched.confirmPassword && f.errors.confirmPassword ? 'rp-has-error' : ''}`}
                  />
                  <button type="button" className="rp-eye-btn" onClick={() => setShowConfirmPassword((p) => !p)} tabIndex={-1}>
                    {showConfirmPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </RegField>
            </div>
          </RegSection>

          {/* Address */}
          <RegSection icon={FiMapPin} title="Address" index={4}>
            <RegField label="Address" required error={f.errors.address} touched={f.touched.address}>
              <textarea
                name="address"
                placeholder="Enter your full address"
                value={f.values.address}
                onChange={f.handleChange}
                onBlur={f.handleBlur}
                rows={3}
                className={`rp-textarea ${f.touched.address && f.errors.address ? 'rp-has-error' : ''}`}
              />
            </RegField>
          </RegSection>

          {/* Actions */}
          <div className="rp-actions">
            <motion.button
              type="button"
              className="rp-btn rp-btn--cancel"
              onClick={() => navigate('/')}
              whileTap={{ scale: 0.97 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              className="rp-btn rp-btn--submit"
              disabled={f.isSubmitting}
              whileTap={{ scale: 0.97 }}
              whileHover={{ boxShadow: '0 10px 28px rgba(46,108,59,0.38)' }}
            >
              {f.isSubmitting ? <span className="rp-spinner" /> : <FiArrowRight size={16} />}
              {f.isSubmitting ? 'Creating...' : 'Create Account'}
            </motion.button>
          </div>
        </form>

        {/* Footer link */}
        <p className="rp-footer-text">
          Already have an account?{' '}
          <button type="button" className="rp-link-btn" onClick={() => navigate('/')}>
            Login
          </button>
        </p>
      </motion.div>

      <HelpModal
        show={showHelp}
        title="Registration - Help & Overview"
        screenName="Registration"
        onClose={() => setShowHelp(false)}
      />
    </AuthLayout>
  );
}

export default Registration;