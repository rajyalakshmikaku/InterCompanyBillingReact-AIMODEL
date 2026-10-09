import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AxiosInstance } from '../../services/api';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AuthLayout, Button, Alert } from '../../components/ui';

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();

  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState('');
  const [activated, setActivated] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // --------------------------------------------------
  // Get email from URL
  // --------------------------------------------------
  useEffect(() => {
    const emailFromUrl = searchParams.get('email');

    if (emailFromUrl) {
      setEmail(emailFromUrl);
    } else {
      setMessage('Invalid activation link.');
      setStatus('error');
      setCheckingStatus(false);
    }
  }, [searchParams]);


  // --------------------------------------------------
  // Check existing activation status
  // --------------------------------------------------
  useEffect(() => {
    if (!email) {
      return;
    }

    const checkActivationStatus = async () => {
      try {
        setCheckingStatus(true);

        const response = await AxiosInstance.get(
          '/checkactivationstatus',
          {
            params: {
              email: email
            }
          }
        );

        console.log('Activation status:', response.data);

        // Your API returns:
        // response.data.activation
        //
        // Example:
        // "Active"

        if (
          response.data.activation &&
          response.data.activation.toLowerCase() === 'active'
        ) {
          // Account is already activated
          setActivated(true);
          setStatus('success');
          setMessage(
            response.data.message ||
            'Your account is already activated.'
          );
        } else {
          // Account is inactive
          setActivated(false);
          setStatus('');
          setMessage('');
        }

      } catch (error) {
        console.error(
          'Error checking activation status:',
          error
        );

        setStatus('error');

        setMessage(
          error.response?.data?.message ||
          'Unable to check account activation status.'
        );
      } finally {
        setCheckingStatus(false);
      }
    };

    checkActivationStatus();

  }, [email]);


  // --------------------------------------------------
  // Activate account
  // --------------------------------------------------
  const handleActivation = async () => {
    try {
      setMessage('Activating your account...');
      setStatus('pending');

      const response = await AxiosInstance.post(
        '/saveactivationstatus',
        null,
        {
          params: {
            email: email
          }
        }
      );

      console.log('Activation response:', response.data);

      setMessage(
        response.data.message ||
        'Your account has been activated successfully.'
      );

      setStatus('success');

      // Hide Activate Account button
      setActivated(true);

    } catch (error) {
      console.error('Activation error:', error);

      setMessage(
        error.response?.data?.message ||
        'Activation failed. Please try again or contact support.'
      );

      setStatus('error');
    }
  };


  // --------------------------------------------------
  // Alert severity
  // --------------------------------------------------
  const severity =
    status === 'success'
      ? 'success'
      : status === 'error'
        ? 'error'
        : 'info';


  return (
    <AuthLayout>
      <Box>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            mb: 0.5
          }}
        >
          Activate your account
        </Typography>


        {email && (
          <Typography
            variant="body1"
            sx={{ mb: 1 }}
          >
            Hi, <strong>{email}</strong>
          </Typography>
        )}


        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          {activated
            ? 'Your account is already activated.'
            : 'Please click the button below to activate your account.'
          }
        </Typography>


        {/* --------------------------------------------
            Show API message
        --------------------------------------------- */}
        {message && (
          <Alert severity={severity}>
            {message}
          </Alert>
        )}


        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            mt: 3
          }}
        >

          {/* --------------------------------------------
              CHECKING STATUS
          --------------------------------------------- */}
          {checkingStatus && (
            <Typography color="text.secondary">
              Checking account status...
            </Typography>
          )}


          {/* --------------------------------------------
              SHOW ACTIVATE BUTTON
              ONLY WHEN ACCOUNT IS NOT ACTIVE
          --------------------------------------------- */}
          {!checkingStatus &&
            !activated &&
            email &&
            status !== 'pending' && (
              <Button
                variant="contained"
                onClick={handleActivation}
                sx={{
                  px: 4,
                  py: 1.1
                }}
              >
                Activate Account
              </Button>
            )
          }


          {/* --------------------------------------------
              ACCOUNT ALREADY ACTIVE
          --------------------------------------------- */}
          {!checkingStatus && activated && (
            <>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: 'success.main',
                  alignSelf: 'center'
                }}
              >
                Account already activated.
              </Typography>

              <Button
                href="/"
                variant="outlined"
                sx={{
                  px: 4,
                  py: 1.1
                }}
              >
                Go to Login
              </Button>
            </>
          )}

        </Box>

      </Box>
    </AuthLayout>
  );
};

export default ActivateAccount;