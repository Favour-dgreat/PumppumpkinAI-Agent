import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Loading = () => {
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const oauthToken = params.get('oauth_token');
        const oauthVerifier = params.get('oauth_verifier');

        if (oauthToken && oauthVerifier) {
            const callbackUrl = `https://pumpkinai.icademics.com/auth/callback?oauth_token=${oauthToken}&oauth_verifier=${oauthVerifier}`;
            window.location.href = callbackUrl;
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