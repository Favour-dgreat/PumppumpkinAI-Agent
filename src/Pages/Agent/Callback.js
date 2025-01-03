import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import logo from "../../Assets/Images/logo.png"; // Adjust the path to your logo file
import loading from "../../Assets/Images/rolling.gif"; // Adjust the path to your loading file
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
        <div className='main-page' style={{background:'rgba(21, 32, 49, 1)', opacity:'5'}}>
              <div className="popup-overlay" >
                      <div className="popup" onClick={(e) => e.stopPropagation()}>
                        
                        <div className="popup-content">
                          <img src={logo} alt="Logo" style={{ width: '100%', }} />
                          <p className='ii'> Authenticating your account </p>
                          
                        </div>
                        <div className="popup-actions">
                          <button style={{fontSize: '20px'}}
                            className="authorize-btn"
                            onClick={() => {
                             
                            }}
                          >
                            
                            <img src={loading} style={{width: '10%'}}></img>
                          </button>
                          
                        </div>
                      </div>
                    </div>
            <h1>Loading...</h1>
            <p>Please wait while we authenticate with Twitter.</p>
        </div>
    );
};

export default Loading;