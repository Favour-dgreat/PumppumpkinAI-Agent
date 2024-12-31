import React, { useEffect, useState } from 'react';
import './AdminDashboard.css';
import logo from '../../Assets/Images/logo.png';
import mascot from '../../Assets/Images/mascot.png';
import component from '../../Assets/Images/Component 1.png';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase.config";

const AdminDashboard = () => {
  const [walletAddress, setWalletAddress] = useState(''); // State to store connected wallet address
  const [dropdownVisible, setDropdownVisible] = useState(false); // State to toggle dropdown visibility
  const [isExpanded, setIsExpanded] = useState(false);
  const [userData, setUserData] = useState([]); // State to store user data
  const [isAcInfoClicked, setIsAcInfoClicked] = useState(false); // State to toggle between wallet balance and amount paid
  const [userCount, setUserCount] = useState(0); // State to store the number of connected users
  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const connectWallet = async () => {
    try {
      if (window.solana && window.solana.isPhantom) {
        const response = await window.solana.connect();
        setWalletAddress(response.publicKey.toString()); // Update walletAddress state
        console.log('Phantom wallet connected:', response.publicKey.toString());
      } else if (window.ethereum) {
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

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = querySnapshot.docs.map(doc => ({
          id: doc.id,
          walletAddress: doc.data().walletAddress,
          userWalletBalance: doc.data().userWalletBalance,
          amountUserhasPaid: doc.data().amountUserhasPaid, // Adding the 'amountUserhasPaid' field
          createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null, // Convert to Date object if exists
        }));
        setUserData(users);
        // Count the number of users with a wallet address (non-empty)
        const connectedUsers = users.filter(user => user.walletAddress).length;
        setUserCount(connectedUsers);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  // Toggle between displaying wallet balance and amount paid
  const handleAcInfoClick = () => {
    setIsAcInfoClicked(!isAcInfoClicked);
  };

  return (
    <div
      className="dashboard-container"
      style={{
        height: isExpanded ? "auto" : "100vh", 
        transition: "height 0.3s ease", 
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
            <i className="bi bi-grid" style={{ marginRight: '10px', fontSize: '25px' }}></i>
            Dashboard
          </a>
          <a href="#" className="nav-item" onClick={handleAcInfoClick}>
            <i className="bi bi-arrow-left-right" style={{ marginRight: '10px', fontSize: '25px' }}></i>
            Ac Info
          </a>
        </nav>
        <div className="logout" style={{backgroundColor: 'black', padding: '20px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'}} onClick={walletAddress ? disconnectWallet : connectWallet}>
          <i className="bi bi-box-arrow-in-right" style={{ paddingRight: '10px' }}></i>
          {walletAddress ? 'Disconnect Wallet' : 'Connect Wallet'}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h1 style={{ color: 'white' }}>Admin Dashboard</h1>
          <div className="user-info">
            <p style={{ fontWeight: 'bold', fontSize: '18px' }}>
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
            </p>
            <img src={component} style={{ width: '60px', height: '60px' }} alt="component" />
          </div>
        </header>

        {/* Card */}
        <div className="card">
          <div
            style={{
              backgroundColor: 'rgba(230, 230, 230, 1)',
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <img src={mascot} alt="Mascot" className="mascot" style={{ width: '80%' }} />
          </div>
          <div className='card-info'>
            <h4>Total User Connected Wallet</h4>
            <p>{userCount} Person(s)</p>
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
              <thead>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'left' }}>SL</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Wallet Address</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>
                    {isAcInfoClicked ? 'Amount Paid' : 'Amount Of Their Wallet'}
                  </th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {userData.map((user, index) => (
                  <tr key={user.id}>
                    <td style={{ padding: '8px' }}>{index + 1}</td>
                    <td style={{ padding: '8px' }}>{user.walletAddress}</td>
                    <td style={{ padding: '8px' }}>
                      {isAcInfoClicked
                        ? user.amountUserhasPaid
                          ? user.amountUserhasPaid.toFixed(3)
                          : 'N/A'
                        : user.userWalletBalance
                        ? user.userWalletBalance.toFixed(3)
                        : 'N/A'}
                      SOL
                    </td>
                    <td style={{ padding: '8px' }}>
                      {user.createdAt
                        ? user.createdAt.toLocaleString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          })
                        : "N/A"}
                    </td>
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
};

export default AdminDashboard;
