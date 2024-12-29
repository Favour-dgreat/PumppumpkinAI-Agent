import React, { useState, useEffect } from 'react';
import { Buffer } from "buffer";
import { auth } from '../../firebase.config'; 
import { TwitterAuthProvider, signInWithPopup} from 'firebase/auth';
import './AgentPage.css';
import logo from '../../Assets/Images/logo.png';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Select from 'react-select';
import sol from '../../Assets/Images/Ellipse 6.png';
import wallet from '../../Assets/Images/Vector.png';
import { useNavigate } from 'react-router-dom';

import tg from '../../Assets/Images/Rectangle.png';
import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";


const TARGET_WALLET_ADDRESS = "CCpdSWroCGVWqKX2F7vDmzVf2hwQ1DhAe4NzKyU7eEDt";
const RPC_ENDPOINT = "https://lingering-indulgent-glitter.solana-mainnet.quiknode.pro/c3785e7475d60c7313a46d8c9ae88a95e8e8980c"; 
const Agent = () => {
    const navigate = useNavigate();
  
  const [photoURL, setPhotoURL] = useState(null);
  const [user, setUser] = useState(null);
  const [walletAddress, setWalletAddress] = useState(''); // State to store connected wallet address
  const [dropdownVisible, setDropdownVisible] = useState(false); // State for dropdown visibility
  const [depositedAmount, setDepositedAmount] = useState(() => {
    const cachedAmount = localStorage.getItem('depositedAmount');
    return cachedAmount ? parseFloat(cachedAmount) : 0;
  });
  const handleTwitterLogin = async () => {
    const provider = new TwitterAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Get user info and access token
      const credential = TwitterAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const secret = credential.secret;
      const twitterUser = result.user; // Renamed from 'user'
      setUser(twitterUser); // Update state with the user data
      setPhotoURL(twitterUser.photoURL);
  
      console.log("User info:", twitterUser);
      console.log("Access token:", token);
      console.log("Secret:", secret);
  
      console.log("Twitter login successful");
      setIsSuccessModalVisible(true);
      
    } catch (error) {
      console.error("Twitter login failed:", error.message);
      setError("Twitter login failed. Please try again.");
    }
  };

  // Utility function for backoff retries
const backoff = async (fn, retries = 5, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying... Attempts left: ${retries}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return backoff(fn, retries - 1, delay * 2); // Increase delay exponentially
    } else {
      throw new Error("Max retries reached.");
    }
  }
};

// Fetch recent blockhash with retry logic
const fetchRecentBlockhash = async (connection) => {
  return backoff(async () => {
    const { blockhash } = await connection.getRecentBlockhash();
    return blockhash;
  });
};

// Send and confirm transaction with retries
const sendTransactionWithRetry = async (connection, transaction, signers) => {
  return backoff(async () => {
    const signature = await sendAndConfirmTransaction(connection, transaction, signers, {
      commitment: "finalized",
    });
    console.log("Transaction confirmed:", signature);
    return signature;
  });
};

// Verify a transaction's status
const verifyTransaction = async (connection, signature) => {
  const transaction = await connection.getTransaction(signature, { commitment: "finalized" });
  if (transaction) {
    console.log("Transaction successful:", transaction);
    return true;
  } else {
    console.log("Transaction not found or not confirmed.");
    return false;
  }
};

// Monitor pending transactions periodically
const pendingTransactions = new Set();
const monitorPendingTransactions = async () => {
  const connection = new Connection(RPC_ENDPOINT, {
    confirmTransactionInitialTimeout: 120000,
  });
  for (const signature of pendingTransactions) {
    const status = await connection.getTransaction(signature, { commitment: "finalized" });
    if (status) {
      console.log("Transaction confirmed:", signature);
      pendingTransactions.delete(signature);
    } else {
      console.log("Still waiting for confirmation:", signature);
    }
  }
};
setInterval(monitorPendingTransactions, 30000); // Check every 30 seconds

// Handle sending SOL
const sendSol = async () => {
  try {
    if (!window.solana || !window.solana.isPhantom) {
      alert("Phantom wallet is not installed. Please install it to proceed.");
      return;
    }

    const wallet = window.solana;
    if (!wallet || !wallet.isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    const { publicKey } = await wallet.connect();

    const lamports = parseFloat(amount) * 1e9;
    if (isNaN(lamports) || lamports <= 0) {
      alert("Please enter a valid amount of SOL.");
      return;
    }

    const connection = new Connection(RPC_ENDPOINT, {
      confirmTransactionInitialTimeout: 120000,
    });
    const blockhash = await fetchRecentBlockhash(connection);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(TARGET_WALLET_ADDRESS),
        lamports,
      })
    );

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    setTransactionStatus("Sending transaction...");

    const confirmation = await connection.confirmTransaction(signature, "finalized");

    if (confirmation.value.err) {
      setTransactionStatus("Transaction failed. Please try again.");
    } else {
      setTransactionStatus("Transaction successful! Check your wallet.");
      pendingTransactions.add(signature); // Add to pending transactions for monitoring
      setDepositedAmount((prevAmount) => {
        const newAmount = prevAmount + parseFloat(amount);
        localStorage.setItem('depositedAmount', newAmount);
        return newAmount;
      });
    }
  } catch (error) {
    console.error("Error sending SOL:", error);
    setTransactionStatus("An error occurred. Please try again.");
  }
};

// Main transaction handling logic
const handleTransaction = async () => {
  const connection = new Connection(RPC_ENDPOINT, {
    confirmTransactionInitialTimeout: 120000,
  });

  try {
    const blockhash = await fetchRecentBlockhash(connection);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(walletAddress),
        toPubkey: new PublicKey(TARGET_WALLET_ADDRESS),
        lamports: 1000, // Example amount
      })
    );

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(walletAddress);

    const signers = []; // Add signers if needed

    const signature = await sendTransactionWithRetry(connection, transaction, signers);
    await verifyTransaction(connection, signature);
  } catch (error) {
    console.error("Transaction handling error:", error);
  }
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

  const handleDropdownToggle = () => {
    setDropdownVisible((prevState) => !prevState);
  };


  
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const [isDepositModalVisible, setisDepositModalVisible] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [amount, setAmount] = useState(''); // Add this line to define the amount state


  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isPopupVisible, setIsPopupVisible] = useState(false); // State for popup visibility
  const [isTokenPopupVisible, setIsTokenPopupVisible] = useState(false); // State for second popup visibility
  const [telegramToken, setTelegramToken] = useState(''); // State for Telegram API token
  const options = [
    { value: 'background', label: 'Background' },
    { value: 'lifeExperiences', label: 'Life Experiences' },
    { value: 'personalityTraits', label: 'Personality Traits' },
    // Add more options as needed
  ];

  const handleChange = (selected) => {
    setSelectedOptions(selected);
  };

  const openPopup = () => {
    setIsPopupVisible(true);
  };

  const closePopup = () => {
    setIsPopupVisible(false);
  };

  const openTokenPopup = () => {
    setIsTokenPopupVisible(true);
  };

  const closeTokenPopup = () => {
    setIsTokenPopupVisible(false);
  };


  const closeSuccessModal = () => {
    setIsSuccessModalVisible(false);
  };
  const openDepositModal = () => {
    setisDepositModalVisible(true);
  };

  const closeDepositModal = () => {
    setisDepositModalVisible(false);
  };

  const handleTokenChange = (e) => {
    setTelegramToken(e.target.value);
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: 'transparent',
      border: '1px solid rgba(26, 117, 255, 1)',
      color: '#fff',
    }),
    menu: (provided) => ({
      ...provided,
      display: 'none',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'transparent',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#fff',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#fff',
      ':hover': {
        backgroundColor: 'transparent',
        color: '#fff',
      },
    }),
  };

  useEffect(() => {
    if (isSuccessModalVisible) {
      closePopup(); // Close the first popup when transitioning to the next
    }
  }, [isSuccessModalVisible]);

  return (
       <div className="container">
         {/* Popup */}
      {isPopupVisible && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <button className="close-btn" onClick={closePopup}>
                &times;
              </button>
            </div>
            <div className="popup-content">
            <img src={logo} alt="Logo" className="logos" />

              <p className='ii'> AI Agent requests access to your X account</p>
            </div>
            <div className="popup-actions">
              <button className="authorize-btn" onClick={handleTwitterLogin}>
                Authorize
              </button>
              <button className="cancel-btn" onClick={closePopup}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {isTokenPopupVisible && (
        <div className="popup-overlay" onClick={closeTokenPopup}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <button className="close-btn" onClick={closeTokenPopup}>
                &times;
              </button>
            </div>
            <div className="popup-content">

            <img src={tg} alt="Logo"  style={{width:'100%'}} />


          <p className='ii'> AI Agent requests Telegram API Token </p>
            <div className="input-container">
              <input
                type="text"
                placeholder="Paste the Telegram API token"
                value={telegramToken}
                onChange={handleTokenChange}
                style={{ width: '95%', padding: '0.5rem', backgroundColor:'rgba(27, 42, 66, 1)', color: 'white', border: '1px solid rgba(26, 117, 255, 1)' }}
             
             />
             <i class="bi bi-send"></i>
             </div>
              <small style={{ color: 'white', fontSize: '12px' }}>Watch this <a href="https://youtu.be/LlIDhLl4Z8w?si=YWJ48AhFwlQXdO74&t=23" target='_blank' rel="noreferrer" style={{color:'white'}}>video</a> to know how to get your API token</small>
            </div>

            <div className="popup-actions">
              <button
                className="authorize-btn"
                onClick={() => {
                  alert(`Token saved: ${telegramToken}`);
                  closeTokenPopup();
                }}
                >
                Save Token
                </button>
                <button className="cancel-btn" onClick={closeTokenPopup}>
                Cancel
                </button>
              </div>
              </div>
            </div>
            )}
             {isSuccessModalVisible && (
            <div className="popup-overlay" onClick={closeSuccessModal}>
              <div className="popup" onClick={(e) => e.stopPropagation()}>
              <div className="popup-header">
                <button className="close-btn" onClick={closeSuccessModal}>
                &times;
                </button>
              </div>
              <div className="popup-content">
              <img src={logo} alt="Logo" className="logos" />

                <p className='ii'> Your AI Agent  account Is now Verified With X  </p>
                <img src={photoURL} alt="Logo" className="logos" />
                <p style={{color:'white', fontStyle:'normal', fontWeight: 'bold'}}>{user && user.displayName}</p>



              </div>
              <div className="popup-actions">
                
                <button className="cancel-btn" onClick={closeSuccessModal} style={{color:'white', border: '1px solid rgba(26, 117, 255, 1)', backgroundColor: 'rgba(26, 117, 255, 1)'}}>
                Save
                </button>
              </div>
              </div>
            </div>
            )}

        {isDepositModalVisible && (
            <div className="popup-overlay" onClick={closeDepositModal}>
              <div className="popup" onClick={(e) => e.stopPropagation()}>
              <div className="popup-header">
                <button className="close-btn" onClick={closeDepositModal}>
                &times;
                </button>
              <h2>Deposit Sol</h2>
              <p>
                Amount to Deposit - <span className="max-text">Max</span>
              </p>
              <div className="input-container">
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    placeholder="Enter amount in SOL"
                    value={amount}
                    onChange={handleAmountChange} 
                  />
                  <div className="input-icon">
                    <img src={sol} alt="SOL Icon" />
                  </div>
                </div>
              </div>
              <button className="add-button" onClick={sendSol}>Add SOL</button>
              {transactionStatus && <p className="status-message">{transactionStatus}</p>}
              </div>
            </div>
            </div>
            )}
            <header className="header">
            <img src={logo} alt="Logo" className="logo" style={{cursor:'pointer'}} onClick={() => navigate('/')} />

            <div className="actions">
              <button className="action-btn" onClick={openDepositModal}>
                <img src={wallet} style={{width:'18px'}}></img> {walletAddress ? (depositedAmount ? `${depositedAmount} SOL` : '00.00') : '00.00'}
              </button>
              <div className="wallet-container">
              {walletAddress ? (
                <div className="wallet-dropdown">
                  <i class="bi bi-person-circle" style={{fontSize: '18px'}}></i>

                <button className="wallet-button" onClick={handleDropdownToggle} style={{fontSize:'14px'}} >
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}

                  <i
                  className={`bi bi-person-circle-${dropdownVisible ? 'up' : 'down'}`}
                  style={{ marginLeft: '8px', color:'white' }}
                  >
                  </i>
                  <i class="bi bi-chevron-down"></i>
                </button>
                {dropdownVisible && (
                  <div className="wallet-dropdown-menu">
                  <button onClick={disconnectWallet} className="dropdown-item">
                    Disconnect Wallet
                  </button>
                  </div>
                )}
                </div>
              ) : (
                <button className="action-btn connect" onClick={connectWallet}>
                Connect Wallet
                </button>
              )}
              </div>
           </div>

            </header>
            <div className="actionss">
              <button className="action-btn" onClick={openDepositModal}>
              <img src={wallet} style={{width:'18px'}}></img> {walletAddress ? (depositedAmount ? `${depositedAmount} SOL` : '00.00') : '00.00'}
              </button>
              <div className="wallet-container">
              {walletAddress ? (
              <div className="wallet-dropdown">
                <button className="wallet-button" onClick={handleDropdownToggle}>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                <i
                  className={`bi bi-chevron-${dropdownVisible ? 'up' : 'down'}`}
                  style={{ marginLeft: '8px' }}
                ></i>
                </button>
                {dropdownVisible && (
                <div className="wallet-dropdown-menu">
                  <button onClick={disconnectWallet} className="dropdown-item">
                  Disconnect Wallet
                  </button>
                </div>
                )}
              </div>
              ) : (
              <button className="action-btn connect" onClick={connectWallet}>
                Connect Wallet
              </button>
              )}
            </div>
            </div>
            
            <main className="main">
            <section className="section">
              <div className="heading">
              <i id='i' class="bi bi-person-vcard"></i>
              <h4>Basic Information</h4>
              
              </div>
            
              <div className="form-container">
              <div className="form-column">
                <div className="form-group">
                <label>Character Name</label>
                <input type="text" placeholder="Give your AI a Name" />
                </div>
              </div>
              
              <div className="form-column">
                <div className="form-group">
                <label>Available Clients</label>

                <div className="buttons">
                  <button 
                  className="client-btn" 
                  onClick={openPopup}>
                  <i className="bi bi-twitter-x"></i> Account</button>
                  <button
                  className="client-btn"
                  style={{ backgroundColor: 'rgba(26, 117, 255, 1)' }}
                  onClick={openTokenPopup}>
                  
                  <i className="bi bi-telegram"></i> Telegram
                  </button>
                </div>
                </div>
              </div>
              </div>
            </section>
            <div className="section-container">
            <section className="section">
            <div className="heading">
            <i id='i' class="bi bi-clipboard-data"></i>          
            <h4>Character Details</h4>
              
              </div>
              <div className="details-grid">
              <label>Bio</label>

              <textarea placeholder="Write the character’s biography. Include their background
        life experiences, and key personality traits. write one complete sentence per line.  "></textarea>
                      <label>Lore</label>

              <textarea placeholder="Describe the character's world, history and important events
        that shaped them. Write one complete sentence per line."></textarea>
                      <label>Topics</label>

              <textarea placeholder="List topics the character is knowledgeable about or interested in. Write one complete sentence per line."></textarea>
              </div>
            </section>
            
            <section className="section">
            <div className="heading">
            <i id="i" class="bi bi-backpack3"></i>            
            <h4>Style</h4>
              
              </div>
              <div className="details-grid">
              <label>General Style</label>

              <textarea placeholder="Describe how the character communicates in general. Include speech patterns, mannerisms. and typical expressions
        write one complete sentence per line."></textarea>
              <label>Chat Style</label>

              <textarea placeholder="Describe how the character behaves in conversations. Include response patterns and chat specific mannerisms  write one complete sentence per line."></textarea>
              <label>Post Style</label>

              <textarea placeholder="Describe how the character writes post or longer content. Include formatting preferences and writing style write one complete sentence per line."></textarea>
              </div>
            </section>
            </div>
            <div className="section-container">
            <section className="section">
            <div className="heading">
            <i id='i' class="bi bi-tags"></i>        
            <h4>Adjectives</h4>
              
              </div>
              <div className="details-grid">
              <label>Character Adjectives <i class="bi bi-plus-circle"></i>
              </label> 
              
              <Select className=''
                isMulti
                value={selectedOptions}
                onChange={handleChange}
                options={options}
                placeholder="Enter Adjectives"
                styles={{
                control: (provided) => ({
                  ...provided,
                  backgroundColor: "transparent",
                  borderColor: "rgba(26, 117, 255, 1);", // Optional: Customize the border color
                  color: "#fff", // Optional: Customize the text color
                  width: "90%",
                }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: "transparent",
                }),
                placeholder: (provided) => ({
                  ...provided,
                  textAlign: "left",
                  color: "#aaa", // Customize placeholder color
                }),
                multiValue: (provided) => ({
                  ...provided,
                  backgroundColor: "#333", // Customize selected tag background color
                }),
                multiValueLabel: (provided) => ({
                  ...provided,
                  color: "#fff", // Customize selected tag text color
                }),
                multiValueRemove: (provided) => ({
                  ...provided,
                  color: "#fff",
                  ":hover": {
                    backgroundColor: "#555",
                    color: "#fff",
                  },
                }),
              }}
              onInputChange={(inputValue, { action }) => {
                if (action === "input-change" && inputValue.trim().length > 0) {
                  // You could conditionally show filtered options if needed
                  // This example assumes your options will dynamically filter based on the input
                }
              }}
            
            />
            
                      
          </div>
        </section>
        
        <section className="section">
        <div className="heading">
        <i id='i' class="bi bi-people"></i>        
        <h4>People</h4>
          
          </div>
          <div className="details-grid">
          <label>Twitter Target Users <i  class="bi bi-plus-circle"></i></label>
          
        
            <input type='text' placeholder="Enter username seperated by commas"></input>
           
          </div>
        </section>
      </div>
      <div className="section-container">
        <section className="section">
        <div className="heading">
        <i id='i' class="bi bi-dice-5"></i>      
        <h4>Deploy AI</h4>
          
          </div>
          <div className="deploy">
            <button className="deploy-btn">Deploy</button>
          </div>
        </section>
        
      
      </div>
          
        </main>
         
      </div>
  );
}
export default Agent;