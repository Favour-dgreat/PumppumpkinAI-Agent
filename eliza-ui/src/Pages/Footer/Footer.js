import React from 'react';
import './Footer.css';
import logo from '../../Assets/Images/logo.png';
import x from  '../../Assets/Images/Frame.png';
import telegram from '../../Assets/Images/Group@2x.png';
import attachment from '../../Assets/Images/Group.png';
const Footer = () => {
  return (
    <div className="footer-container">
            {/* Header Section */}
            <div className="footer-header">
                
                <a href="#" >
                <img src={logo} alt="Logo" className="logo"  />                    
                </a>

                {/* Right Social Buttons */}
                <div className="footer-social-buttons">
                    <a href="#" className="footer-social-button">
                        <img src={telegram}  alt="Telegram Icon" />
                    </a>

                    <a href="#" className="footer-social-button" style={{background:'linear-gradient(to right, rgba(26, 117, 255, 1), rgba(16, 70, 153, 1))'}}>
                    <img src={x}  alt="X Icon"  />
                    </a>
                    
                    <a href="#" className="footer-social-button">
                        <img src={attachment}  alt="Attachment Icon" />
                    </a>
                </div>
            </div>

            {/* Divider */}

            {/* Footer Section */}
            <footer className="footer-content">
            <hr className="footer-divider" />

                <p className='foot'>&copy; Copyright 2024 by PumpPumpkin.io</p>
            </footer>

            </div>
              );
            };
            
            export default Footer;