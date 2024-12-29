import React, { useState } from 'react';
import './AdminDashboard.css';
import logo from '../../Assets/Images/logo.png';
import mascot from '../../Assets/Images/mascot.png';
import component from '../../Assets/Images/Component 1.png';
const AdminDashboard = ({ wallets }) => {
    const [walletAddress, setWalletAddress] = useState(''); // State to store connected wallet address
    const [dropdownVisible, setDropdownVisible] = useState(false); // State to toggle dropdown visibility
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const connectWallet = async () => {
    try {
      // Check for Phantom wallet
      if (window.solana && window.solana.isPhantom) {
        const response = await window.solana.connect();
        setWalletAddress(response.publicKey.toString()); // Update walletAddress state
        console.log('Phantom wallet connected:', response.publicKey.toString());
      }
      // Check for MetaMask wallet
      else if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setWalletAddress(accounts[0]); // Update walletAddress state
        console.log('MetaMask wallet connected:', accounts[0]);
      } else {
        alert('No wallet found. Please install Phantom or MetaMask.');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(''); // Clear wallet address
    setDropdownVisible(false); // Hide dropdown
    console.log('Wallet disconnected');
  };

  return (
    <div
      className="dashboard-container"
      style={{
        height: isExpanded ? "auto" : "100vh", // Set height based on state
        transition: "height 0.3s ease", // Smooth transition for height
        overflow: "hidden",
        borderRadius: "8px",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
      }}
    >    
    
      {/* Sidebar */}
      <aside className="sidebar">
      <img src={logo} alt="Logo" className="logo" />
      <nav className="nav-links">
        <a href="#" className="nav-item" id='active'>      
          <i class="bi bi-grid" style={{marginRight:'10px', fontSize: '25px'}}></i>
        Dashboard</a>
        <a href="#" className="nav-item">
        <i class="bi bi-arrow-left-right" style={{marginRight:'10px', fontSize: '25px'}}></i>
        Ac Info</a>
      </nav>
      <div className="logout" onClick={walletAddress ? disconnectWallet : connectWallet}>
        <i class="bi bi-box-arrow-in-right" style={{paddingRight: '10px'}}></i> 
        {walletAddress ? 'Disconnect Wallet' : 'Connect Wallet'}
      </div>
    </aside>

    {/* Main Content */}
    <main className="main-content">
      {/* Header */}
      <header className="header">
        
        <h1 style={{color:'white'}}>Admin Dashboard</h1>
        <div className="user-info">
          <p>{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}</p>
        <img src={component} style={{width: '25%'}}></img>
        </div>
      </header>

      {/* Card */}
      <div className="card">
        <div 
        style={{
          backgroundColor: 'rgba(230, 230, 230, 1)',
          width: '90px', // Set desired width
          height: '90px', // Set desired height (same as width for a circle)
          borderRadius: '50%', // Makes it circular
          display: 'flex', // Centers the image
          justifyContent: 'center',
          alignItems: 'center'}}
          >
        <img src={mascot} alt="Mascot" className="mascot" style={{width:'80%'}} />
        </div>
        <div className='card-info'>
          <h4>Total User Connected Wallet</h4>
          <p>4015 Person</p>
        </div>
      </div>

      {/* User Info */}
      <section className="user-info-section">
      <div className="table-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
  <h2>User Info</h2>
  <div className="search-container" style={{ position: 'relative', display: 'inline-block' }}>
  <i
      className="bi bi-search"
      style={{
        position: 'absolute',
        right: '10px', 
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#aaa', 
        pointerEvents: 'none', 
      }}
    ></i>
    <input
      type="text"
      placeholder="Search Wallet Address"
      className="search-bar"
      style={{
        width: '200px',
        padding: '0.7rem 2.5rem 0.7rem 1rem', 
        borderRadius: '4px',
        color: 'white',
      }}
    />
   
  </div>
</div>

<div
        style={{
          maxHeight: isExpanded ? "none" : "400px",
          overflowY: isExpanded ? "visible" : "auto",
          borderRadius: "8px",
        }}
      >
  <table className="user-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
    <thead >
      <tr>
        <th style={{ padding: '8px', textAlign: 'left' }}>SL</th>
        <th style={{ padding: '8px', textAlign: 'left' }}>Wallet Address</th>
        <th style={{ padding: '8px', textAlign: 'left' }}>Amount Of Their Wallet</th>
        <th style={{ padding: '8px', textAlign: 'left' }}>Date & Time</th>
      </tr>
    </thead>
    <tbody>
      {[...Array(30)].map((_, index) => (
        <tr key={index}>
          <td style={{ padding: '8px' }}>{index + 1}</td>
          <td style={{ padding: '8px' }}>5XNrPf9hj7Jb...</td>
          <td style={{ padding: '8px' }}>56.789 SOL</td>
          <td style={{ padding: '8px' }}>2024-08-24 10:20 PM</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

<button
        className="view-all-btn"
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        onClick={toggleExpand}
      >
        {isExpanded ? "Collapse" : "View All"}
      </button>
  
      </section>
    </main>
  </div>
);
}



export default AdminDashboard;