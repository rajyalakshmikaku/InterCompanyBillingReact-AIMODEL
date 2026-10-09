import React from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../theme/tokens';

const DEFAULT_FEATURES = [
  { icon: '📋', text: 'Quotations & approvals' },
  { icon: '🧾', text: 'Invoicing & credit notes' },
  { icon: '🏢', text: 'Customers & companies' },
  { icon: '📊', text: 'Audit logs & reports' },
  { icon: '🔐', text: 'Role-based access control' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const floatVariants = (delay = 0, duration = 6) => ({
  animate: {
    y: [0, -18, 0],
    x: [0, 8, 0],
    transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' },
  },
});

const AuthLayout = ({
  appName = 'Inter-Company Billing',
  tagline = 'Integrated Billing & Quotation Management',
  features = DEFAULT_FEATURES,
  logoSrc = '/files/assets/images/ITSALOGO.png',
  topRight,
  children,
  contentMaxWidth = 460,
}) => {
  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Left Brand Panel ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '42%',
          position: 'relative',
          overflow: 'hidden',
          minWidth: 360,
        }}
        className="auth-left-panel"
      >
        {/* Animated gradient background */}
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(145deg, ${colors.brandDark} 0%, ${colors.brand} 40%, #52b969 70%, ${colors.brandDark} 100%)`,
            backgroundSize: '400% 400%',
          }}
        />

        {/* Animated mesh grid */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Animated gradient waves */}
        <motion.div
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-10%',
            width: '120%',
            height: '60%',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Floating background orbs */}
        <motion.div
          variants={floatVariants(0, 7)}
          animate="animate"
          style={{
            position: 'absolute', top: '8%', right: '10%',
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            filter: 'blur(2px)',
          }}
        />
        <motion.div
          variants={floatVariants(1.5, 9)}
          animate="animate"
          style={{
            position: 'absolute', bottom: '12%', left: '5%',
            width: 260, height: 260, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
            filter: 'blur(4px)',
          }}
        />
        <motion.div
          variants={floatVariants(3, 11)}
          animate="animate"
          style={{
            position: 'absolute', top: '45%', right: '-5%',
            width: 160, height: 160, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          }}
        />
        <motion.div
          variants={floatVariants(0.8, 8)}
          animate="animate"
          style={{
            position: 'absolute', top: '60%', left: '40%',
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            filter: 'blur(8px)',
          }}
        />

        {/* Small floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -40, 0],
              x: [0, (i % 2 === 0 ? 20 : -20), 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 6 + i * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
            style={{
              position: 'absolute',
              width: 8 + i * 2,
              height: 8 + i * 2,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.4)',
              filter: 'blur(1px)',
              top: `${15 + i * 12}%`,
              left: `${10 + i * 15}%`,
            }}
          />
        ))}

        {/* Decorative accent ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', bottom: '-80px', right: '-80px',
            width: 320, height: 320, borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.12)',
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', bottom: '-60px', right: '-60px',
            width: 220, height: 220, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />

        {/* Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ position: 'relative', zIndex: 1, padding: '0 52px', color: '#fff' }}
        >
          {/* Logo */}
          <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
            <motion.img
              src={logoSrc}
              alt="ITSA Logo"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              style={{
                height: 68,
                padding: '10px 16px',
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.95)',
                display: 'block',
                objectFit: 'contain',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              }}
            />
          </motion.div>

          {/* App name */}
          <motion.h1
            variants={itemVariants}
            style={{
              margin: '0 0 8px',
              fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              lineHeight: 1.15,
            }}
          >
            {appName}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            variants={itemVariants}
            style={{ margin: '0 0 40px', opacity: 0.82, fontSize: '0.97rem', lineHeight: 1.5 }}
          >
            {tagline}
          </motion.p>

          {/* Divider */}
          <motion.div
            variants={itemVariants}
            style={{
              width: 48, height: 3, borderRadius: 2,
              background: 'rgba(255,255,255,0.5)', marginBottom: 28,
            }}
          />

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ x: 6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, flexShrink: 0,
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: '0.92rem', opacity: 0.93, fontWeight: 500 }}>
                  {f.text}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Bottom badge */}
          <motion.div
            variants={itemVariants}
            style={{
              marginTop: 48,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 999,
              padding: '8px 18px',
              fontSize: '0.78rem',
              opacity: 0.85,
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7DFFAA', flexShrink: 0, boxShadow: '0 0 6px #7DFFAA' }} />
            Secure & encrypted platform
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right Content Panel ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '32px 40px',
          overflowY: 'auto',
          background: '#f5f7f6',
          minHeight: '100vh',
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.line} transparent`,
        }}
      >
        {topRight && (
          <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 2 }}>{topRight}</div>
        )}
        <div style={{ width: '100%', maxWidth: contentMaxWidth }}>{children}</div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .auth-left-panel { display: none !important; }
        }
        @media (max-width: 600px) {
          .auth-right-panel { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
