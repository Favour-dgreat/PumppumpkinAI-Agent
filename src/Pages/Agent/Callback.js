import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import logo from '../../Assets/Images/logo.png';
import loading from '../../Assets/Images/rolling.gif';

const BACKEND_URL = process.env.REACT_APP_BACKEND_API_URL;

const TwitterCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const oauthToken = searchParams.get('oauth_token');
      const oauthVerifier = searchParams.get('oauth_verifier');

      if (!oauthToken || !oauthVerifier) {
        setStatus('error');
        setError('Missing OAuth parameters');
        return;
      }

      try {
        const response = await axios.get(
          `${BACKEND_URL}/auth/callback`,
          {
            params: {
              oauth_token: oauthToken,
              oauth_verifier: oauthVerifier,
            },
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data?.data) {
          // Store user data and token
          localStorage.setItem('access_token', response.data.data.access_token);
          localStorage.setItem('user', JSON.stringify(response.data.data.user));

          setStatus('success');
          // Redirect after successful authentication
          setTimeout(() => navigate('/agent'), 1500);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setStatus('error');
        setError(
          error.response?.data?.data?.message ||
          error.message ||
          'An error occurred during authentication'
        );
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 relative">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Logo" className="h-16" />
          </div>
          <div className="text-center">
            {status === 'processing' && (
              <>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Authenticating...
                </h2>
                <p className="text-gray-400">
                  Please wait while we complete your authentication
                </p>
              </>
            )}

            {status === 'success' && (
              <>
               <img src={loading} alt="Loading" className="h-12 w-12 mx-auto mb-4" />

                <h2 className="text-xl font-semibold text-white mb-2">
                  Authentication Successful!
                </h2>
                <p className="text-gray-400">
                  Redirecting you to the dashboard...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="bg-red-500 rounded-full p-2 w-12 h-12 mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Authentication Failed
                </h2>
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => window.location.href = '/agent?twitterAuthError=true'}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                >
                  Return to Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwitterCallback;
