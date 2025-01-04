import React, { useState, useEffect, useCallback } from 'react';
import { Buffer } from "buffer";
import { auth } from '../../firebase.config'; 
import { TwitterAuthProvider, signInWithPopup} from 'firebase/auth';
import './AgentPage.css';
import logo from '../../Assets/Images/logo.png';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Select from 'react-select';
import sol from '../../Assets/Images/Ellipse 6.png';
import wallet from '../../Assets/Images/Vectors.png';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, setDoc, updateDoc, getDoc, increment } from "firebase/firestore"; 
import tg from '../../Assets/Images/Rectangle.png';
import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import CharacterForm from './CharacterForm';

const db = getFirestore();


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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTimeout, setModalTimeout] = useState(null); // Store timeout ID for cleanup
  const [transactionStatus, setTransactionStatus] = useState(""); // Define transactionStatus state

  const handleSubmit = (event) => {
    event.preventDefault();
    // Add your form submission logic here
  };

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
  };


  const timeoutId = setTimeout(() => {
    resetModal();
  }, 120000); // 2 minutes
  setModalTimeout(timeoutId);
};
  // Function to reset the modal
  const resetModal = useCallback(() => {
    closeDepositModal();
    setTransactionStatus("");
    setAmount("");
  }, []);

  useEffect(() => {
    if (transactionStatus === "Successful") {
      resetModal(); // Clean the modal and close it
    }
    else{
      setAmount("");
    }
  }, [transactionStatus, resetModal]); // Dependency on transactionStatus and resetModal

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
    setTransactionStatus("Performing transaction...");

    const confirmation = await connection.confirmTransaction(signature, "finalized");

    if (confirmation.value.err) {
      setTransactionStatus("Transaction failed. Please try again.");
    } else {
      setTransactionStatus("Transaction successful! Check your wallet.");
      const solAmount = parseFloat(amount); // Convert to SOL
      const user = auth.currentUser;

      if (user) {
        // Fetch the current balance of the user's Phantom wallet
        const userWalletBalanceLamports = await connection.getBalance(publicKey);
        const userWalletBalanceSOL = userWalletBalanceLamports / 1e9; // Convert to SOL

        // Update Backend
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          alert("Please sign in by clicking on the X Account Client Button");
          return;
        }

        const userData = JSON.parse(localStorage.getItem("user"));
        if (!user) {
          alert("Please sign in by clicking on the X Account Client Button");
          return;
        }

        const backendApiUrl = process.env.REACT_APP_BACKEND_API_URL;
        const response = await fetch(`${backendApiUrl}/users/${userData.id}/wallet/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(
            {
              amountUserhasPaid: amount,
              userSOLWalletBallance: userWalletBalanceSOL
            }
          ),
        });
  
        if (!response.ok) {
        throw new Error('Failed to update user balance');
        }
      } else {
        console.error("User is not authenticated.");
      }

      pendingTransactions.add(signature); // Add to pending transactions for monitoring
      setDepositedAmount((prevAmount) => {
        const newAmount = prevAmount + solAmount;
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
  setIsModalVisible(true);
    setTransactionStatus("processing");
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
    let walletAddress = "";

    // Check for Phantom wallet
    if (window.solana && window.solana.isPhantom) {
      const response = await window.solana.connect();
      walletAddress = response.publicKey.toString();
      console.log("Phantom wallet connected:", walletAddress);
    }
    // Check for MetaMask wallet
    else if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      walletAddress = accounts[0];
      console.log("MetaMask wallet connected:", walletAddress);
    } else {
      alert("No wallet found. Please install Phantom or MetaMask.");
      return;
    }
    setWalletAddress(walletAddress); // Update walletAddress state

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      alert("Please sign in by clicking on the X Account Client Button");
      return;
    }

    const userData = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please sign in by clicking on the X Account Client Button");
      return;
    }

    const backendApiUrl = process.env.REACT_APP_BACKEND_API_URL
    const response = await fetch(`${backendApiUrl}/users/${userData.id}/wallet/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        wallet_address: walletAddress
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update user Wallet Address');
    }
  } catch (error) {
    console.error("Wallet connection failed:", error);
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
  const [amount, setAmount] = useState(''); // Add this line to define the amount state


  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [formData, setFormData] = useState({});
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
    console.log(e);
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
            <div className="popup-overlay" onClick={() => { closeDepositModal(); resetModal(); }}>
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
                  <div className="input-icons">
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

                  <button className="wallet-button" onClick={handleDropdownToggle} style={{fontSize:'14px'}} >
                  <i
                    className={`bi bi-person-circle`}
                    style={{backgroundColor: 'white', padding:'5px', marginRight: '10px', width: '100%', borderRadius: '50%', fontSize: '20px'}}
                    >
                    </i>
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                   
                    

                  <div className='down' style={{padding:'2%', borderLeft: '1px solid black', marginLeft: '10px', marginRight: '10px'}}>
                    <i class="bi bi-chevron-down"></i>
                    </div>
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
                <button className="action-btnconnect" onClick={connectWallet}>
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

                  <button className="wallet-button" onClick={handleDropdownToggle} style={{fontSize:'14px'}} >
                  <i
                    className={`bi bi-person-circle`}
                    style={{backgroundColor: 'white', padding:'5px', marginRight: '10px', width: '100%', borderRadius: '50%', fontSize: '20px'}}
                    >
                    </i>
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                   
                    

                  <div className='down' style={{padding:'2%', borderLeft: '1px solid black', marginLeft: '80px', marginRight: '10px'}}>
                    <i class="bi bi-chevron-down"></i>
                    </div>
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
                <button className="action-btnconnect" onClick={connectWallet}>
                Connect Wallet
                </button>
              )}
              </div>
            </div>
            <form onSubmit={handleSubmit}>
            <CharacterForm formData={formData} onFormChange={setFormData} />
            
          </form>
          
         
      </div>
  );
}
export default Agent;