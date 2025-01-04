import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../../Assets/Images/logo.png';
import loading from '../../Assets/Images/rolling.gif';

const fetchData = async (oauthToken, oauthVerifier, signal) => {
  const backendApiUrl = process.env.REACT_APP_BACKEND_API_URL;
  const response = await fetch(
    `${backendApiUrl}/auth/callback?oauth_token=${oauthToken}&oauth_verifier=${oauthVerifier}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to initialise Twitter Login');
  }
  
  const result = await response.json();
  return result.data;
};

const Loading = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoize the URL parameters
  const authParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      oauthToken: params.get('oauth_token'),
      oauthVerifier: params.get('oauth_verifier'),
    };
  }, [location.search]);

  // Memoize the validation check
  const isValidAuth = useMemo(() => {
    return Boolean(authParams.oauthToken && authParams.oauthVerifier);
  }, [authParams]);

  // Memoize the authentication function
  const authenticate = useCallback(async (controller) => {
    if (!isValidAuth || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      const data = await fetchData(
        authParams.oauthToken, 
        authParams.oauthVerifier,
        controller.signal
      );
      
      const { access_token, user } = data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = '/agent';
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isValidAuth, isLoading, authParams]);

  useEffect(() => {
    const controller = new AbortController();
    
    authenticate(controller);

    return () => {
      controller.abort();
    };
  }, [authenticate]);

  // Memoize the error message
  const errorMessage = useMemo(() => {
    if (!error) return null;
    return 'An error occurred during authentication. Please try again.';
  }, [error]);

  return (
    <div className="main-page" style={{ background: 'rgba(21, 32, 49, 1)', opacity: '5' }}>
      <div className="popup-overlay">
        <div className="popup" onClick={(e) => e.stopPropagation()}>
          <div className="popup-content">
            <img src={logo} alt="Logo" style={{ width: '100%' }} />
            <p className="ii">
              {error ? 'Authentication failed' : 'Authenticating your account'}
            </p>
          </div>
          <div className="popup-actions">
            <button
              style={{ fontSize: '20px' }}
              className="authorize-btn"
              disabled={isLoading}
            >
              {isLoading && <img src={loading} style={{ width: '10%' }} alt="Loading" />}
            </button>
          </div>
        </div>
      </div>
      <h1>{error ? 'Error' : 'Loading...'}</h1>
      <p>{errorMessage || 'Please wait while we authenticate with Twitter.'}</p>
    </div>
  );
};

export default Loading;
