import React from 'react';
import { useLocation } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const location = useLocation();
  const accessMessage = location.state?.accessMessage;

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero__copy">
          <div className="landing-brand">
            <img src="/files/assets/images/ITSALOGO.png" alt="Inter-Company Billing logo" />
          </div>
          {accessMessage ? (
            <div className="landing-access-card">
              <h1>Access restricted</h1>
              <p>{accessMessage}</p>
            </div>
          ) : (
            <>
              <h1>
                <span>Welcome</span>
                <span>To</span>
                <span>Inter Company Billing</span>
              </h1>
              <p className="landing-hero__text">Your workspace is ready.</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
