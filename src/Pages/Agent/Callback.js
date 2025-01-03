import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const fetchData = async (oauthToken, oauthVerifier) => {
    const response = await fetch(`https://pumpkinai.icademics.com/auth/callback?oauth_token=${oauthToken}&oauth_verifier=${oauthVerifier}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  
      if (!response.ok) {
        throw new Error('Failed to initialise Twitter Login');
      }
  
    const result = await response.json();
    return result.data;
};

const Loading = () => {
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const oauthToken = params.get('oauth_token');
        const oauthVerifier = params.get('oauth_verifier');

        if (oauthToken && oauthVerifier) {
            fetchData(oauthToken, oauthVerifier)
            .then((data) => {
                const { access_token, user } = data;
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('user', JSON.stringify(user));
                window.location.href = '/agent';
            })
            .catch((error) => {
                console.error(error);
            });
        }
    }, [location]);

    return (
        <div>
            <h1>Loading...</h1>
            <p>Please wait while we authenticate with Twitter.</p>
        </div>
    );
};

export default Loading;