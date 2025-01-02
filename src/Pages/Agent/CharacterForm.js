import React, { useState, useEffect } from 'react';
import { auth, db} from '../../firebase.config'; 
import { collection, doc, setDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { TwitterAuthProvider, signInWithPopup } from 'firebase/auth';
import logo from "../../Assets/Images/logo.png"; // Adjust the path to your logo file
import tg from '../../Assets/Images/Rectangle.png';

import { v4 as uuidv4 } from 'uuid';
const CharacterForm = ({ formData, onFormChange, onSubmit}) => {
  const handleChanges = (e) => {
    const { name, value } = e.target;
  
    if (name.includes(".")) {
      // For nested fields (e.g., style.general)
      const [parent, child] = name.split(".");
      onFormChange((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else if (["all", "chat", "post"].includes(name)) {
      // For 'style' fields that need to be split into arrays
      onFormChange((prev) => ({
        ...prev,
        style: {
          ...prev.style,
          [name]: value.split("\n"), // Split input by line breaks into an array
        },
      }));
    } else {
      // For all other fields
      onFormChange((prev) => ({ ...prev, [name]: value }));
    }
  };
  
 
  

  const handleTwitterLogin = async () => {
    const provider = new TwitterAuthProvider(); // Declare provider once
  
    try {
      // Authenticate user with Twitter
      const result = await signInWithPopup(auth, provider);
  
      // Extract user info from result
      const { uid, displayName, email, photoURL } = result.user;
  
      // Generate a UUID for additional internal use (if needed)
      const userUUID = uuidv4();
  
      // Create or update user document in Firestore
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, {
        uuid: userUUID, // Custom UUID for internal use
        twitterId: uid, // Twitter UID
        name: displayName,
        email,
        photoURL,
        createdAt: new Date(),
      });
  
      // Update state with user info
      setUserUUID(userUUID);
      setUser(result.user);
      setPhotoURL(photoURL);
  
      console.log("User authenticated and saved:", {
        uuid: userUUID,
        uid,
        name: displayName,
        email,
      });
  
      // Display success modal
      setIsSuccessModalVisible(true);
  
      return userUUID; // Return for further use if needed
    } catch (error) {
      console.error("Twitter login failed:", error.message);
      setError("Twitter login failed. Please try again.");
    }
  };
  

  // Handle form submission
  const handleSubmit = async (e) => {
    
    e.preventDefault();
    setIsDropdownVisible(true);

    try {
      const characterID = userUUID || `character-${Date.now()}`;
  
      const characterData = {
        ...formData,
        createdAt: new Date(),
      };
  
      // Save to Firestore with the generated UUID as characterID
      const characterDoc = doc(db, "characters", characterID);
      await setDoc(characterDoc, characterData);
  
      // Save JSON locally
      const fileData = JSON.stringify(characterData, null, 2);
      const blob = new Blob([fileData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
  
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formData.name || "character"}.json`;
      a.click();
      console.log("Character saved and downloaded:", characterData);
    } 
    
    catch (error) {
      console.error("Error saving character:", error);
    }
    
  };
  
    const [userUUID, setUserUUID] = useState(null);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [IsDropdownVisible, setIsDropdownVisible ] = useState(false);

    const [isDepositModalVisible, setisDepositModalVisible] = useState(false);
    const [photoURL, setPhotoURL] = useState(null);
    const [transactionStatus, setTransactionStatus] = useState('');
    const [amount, setAmount] = useState(''); // Add this line to define the amount state
  
   
    
    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [isPopupVisible, setIsPopupVisible] = useState(false); // State for popup visibility
    const [isTokenPopupVisible, setIsTokenPopupVisible] = useState(false); // State for second popup visibility
    const [telegramToken, setTelegramToken] = useState(''); // State for Telegram API token
    
  
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
  
    
  
    useEffect(() => {
      if (isSuccessModalVisible) {
        closePopup(); // Close the first popup when transitioning to the next
      }
    }, [isSuccessModalVisible]);
      

  return (
    <>
      <Section className="section" title="Basic Information" icon="bi bi-person-vcard">
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
              <button className="authorize-btn" 
              onClick= {(e) => {
                e.preventDefault();
                handleTwitterLogin();
              }}>
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
              <img src={tg} alt="Logo" style={{ width: '100%' }} />
              <p className='ii'> AI Agent requests Telegram API Token </p>
              <div className="input-container">
                <input
                  type="text"
                  placeholder="Paste the Telegram API token"
                  value={telegramToken}
                  onClick= {(e) => {
                    e.preventDefault();
                    handleTokenChange();
                  }}
                  style={{ width: '95%', padding: '0.5rem', backgroundColor: 'rgba(27, 42, 66, 1)', color: 'white', border: '1px solid rgba(26, 117, 255, 1)' }}
                />
                <i class="bi bi-send"></i>
              </div>
              <small style={{ color: 'white', fontSize: '12px' }}>Watch this <a href="https://youtu.be/LlIDhLl4Z8w?si=YWJ48AhFwlQXdO74&t=23" target='_blank' rel="noreferrer" style={{ color: 'white' }}>video</a> to know how to get your API token</small>
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
              <p className='ii'> Your AI Agent account Is now Verified With X </p>
              <img src={photoURL} alt="Logo" className="logos" />
              <p style={{ color: 'white', fontStyle: 'normal', fontWeight: 'bold' }}>{user && user.displayName}</p>
            </div>
            <div className="popup-actions">
              <button className="cancel-btn" onClick={closeSuccessModal} style={{ color: 'white', border: '1px solid rgba(26, 117, 255, 1)', backgroundColor: 'rgba(26, 117, 255, 1)' }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
     
        <div className="form-container">
          <div className="form-column">
            <FormInput
              label="Character Name"
              name="name"
              placeholder="Give your AI a Name"
              value={formData.name}
              onChange={handleChanges}
            />
            
          </div>
          <div className="form-column">
            <div className="form-group">
              <label>Available Clients</label>
              <div className="buttons" style={{marginBottom:'15px'}}>
                <ClientButton
                  label="Account"
                  icon="bi bi-twitter-x"
                  onClick={(e) => {
                    e.preventDefault();
                    openPopup();
                    onFormChange((prev) => ({ ...prev, selectedClient: "Twitter" }));
                  }}
                />
                <ClientButton
                  label="Telegram"
                  icon="bi bi-telegram"
                  color="rgba(26, 117, 255, 1)"
                  onClick={(e) => {
                    e.preventDefault();
                    openTokenPopup();
                    console.log("Telegram popup");
                    onFormChange((prev) => ({ ...prev, selectedClient: "Telegram" }));
                  }}
                />
              </div>
              
             
            </div>
          </div>
        </div>
      </Section>

      <div className="section-container">

      <Section className="section" title="Character Details" icon="bi bi-clipboard-data">
        <DetailsGrid>
          <FormTextarea
            label="Bio"
            name="bio"
            placeholder="Write the character’s biography."
            value={formData.bio}
            onChange={handleChanges}
          />
          <FormTextarea
            label="Lore"
            name="lore"
            placeholder="Describe the character's world."
            value={formData.lore}
            onChange={handleChanges}
          />
          <FormTextarea
            label="Topics"
            name="topics"
            placeholder="List topics the character is knowledgeable about."
            value={formData.topics}
            onChange={handleChanges}
          />
        </DetailsGrid>
      </Section>

      <Section className="section" title="Style" icon="bi bi-backpack3">
        <DetailsGrid>
          <FormTextarea
            label="General Style"
            name="all"
            placeholder="Describe how the character communicates in general. Include speech patterns, mannerisms. and typical expressions
        write one complete sentence per line."
            value={(formData.style?.all || []).join("\n")} // Ensure safe access        
            onChange={handleChanges}
        />
          <FormTextarea
            label="Chat Style"
            name="chat"
            placeholder="Describe how the character behaves in conversations. Include response patterns and chat specific mannerisms  write one complete sentence per line."
            value={(formData.style?.chat || []).join("\n")} // Ensure safe access
            onChange={handleChanges}
          />
          <FormTextarea
            label="Post"
            name="post"
            placeholder="Describe how the character writes post or longer content. Include formatting preferences and writing style write one complete sentence per line."
            value={(formData.style?.post || []).join("\n")} // Ensure safe access
            onChange={handleChanges}
          />
        </DetailsGrid>
      </Section>
      </div>

      <div className="section-container">

      {/* Adjectives Section */}
      <Section title="Adjectives" icon="bi bi-tags">
        <DetailsGrid>
          <FormTextarea
            label="Character Adjectives"
            name="adjectives"
            placeholder="List adjectives that represent your AI."
            value={formData.adjectives}
            onChange={handleChanges}
          />
        </DetailsGrid>
      </Section>

      {/* Twitter Target Users Section */}
      <Section title="Post Examples" icon="bi bi-people">
        <DetailsGrid>
          <FormTextarea
            label="Give Post Examples"
            name="twitterTargets"
            placeholder="List Post examples in a simple sentence, one per line. Seperated by commas."
            value={formData.twitterTargets}
            onChange={handleChanges}
          />
        </DetailsGrid>
      </Section>
      </div>
      <div className="section-container">
              <section className="section">
              <div className="heading">
              <i id='i' class="bi bi-dice-5"></i>      
              <h4>Deploy AI</h4>
                
                </div>
            <div className="deploy">
              <button type="submit" className="deploy-btn" onClick={handleSubmit}>
                Deploy
              </button>
              </div>
              
              </section>
            </div>

        {IsDropdownVisible && (
        <div className="dropdown" >
        <h4 style={{color: 'white'}}>Manage Your AI Agent</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
          <thead>
            <tr>
              <th>AI Agent Name</th>
              <th>Status</th>
              <th> </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{formData.name}</td>
              <td>
                <span> ● </span> Live
              </td>
            </tr>
          </tbody>
        </table>
        <div className='model-button'>
          <button >
            Stop
          </button>
          <button className='b2'>
            Delete
          </button>
        </div>
        </div>
              )}
 
    </>
  );
};

const Section = ({ title, icon, children }) => (
  <section className="section">
    <div className="heading">
      <i id="i" className={icon}></i>
      <h4>{title}</h4>
    </div>
    {children}
  </section>
);

const FormInput = ({ label, name, placeholder, value, onChange }) => (
  <div className="form-group">
    <label>{label}</label>
    <input
      type="text"
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

const FormTextarea = ({ label, name, placeholder, value, onChange }) => (
  <div>
    <label>{label}</label>
    <textarea
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    ></textarea>
  </div>
);

const FormSelect = ({ label, name, value, options, onChange, disabled }) => (
  <div className="form-group">
    <label>{label}</label>
    <select name={name} value={value} onChange={onChange} disabled={disabled}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const ClientButton = ({ label, icon, color, onClick }) => (
  <button
    className="client-btn"
    style={{ backgroundColor: color }}
    onClick={onClick}
  >
    <i className={icon}></i> {label}
  </button>
);

const DetailsGrid = ({ children }) => <div className="details-grid">{children}</div>;

export default CharacterForm;
