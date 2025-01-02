import React from 'react';
import './Mainpage.css';
import logo from '../../Assets/Images/logo.png';
import users from '../../Assets/Images/users.png';
import x from  '../../Assets/Images/Frame.png';
import telegram from '../../Assets/Images/Group@2x.png';
import attachment from '../../Assets/Images/Group.png';
import { useNavigate } from 'react-router-dom';
  
const MainPage = () => {
  const navigate = useNavigate();
  return (
    <div className="main-page">
      <header className='app-container'>
      <a href="#" >
        <img src={logo} alt="Logo" className="logs" />
        </a>
        <a href="#" className="button">
        <img src={users} alt="Logo" className="logs"  />
        </a>
      </header>
      <div className='content'>
      <h3>No Code AI Agent</h3>
      <p className='meme'>The Perfect Meme Fair Launch Platform on Solana.
        Pump Pumpkin. Earn money  and make yourself a professional Coin Trader. <br></br>Pump Pumpkin is for the people.
        </p>
      </div>
      
      
      <button className="cta-button" style={{cursor:'pointer'}}
      onClick={() => navigate('/agent')}>AI Agent DAPP</button>

    </div>
  );

};
export default MainPage;