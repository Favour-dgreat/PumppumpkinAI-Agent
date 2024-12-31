import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import CharacterForm from "./CharacterForm";

const CharacterCreation = ({ userUUID }) => {
  const [formData, setFormData] = useState({
    name: "",
    clients: [""],
    modelProvider: "openrouter", 
    settings: {
      voice: {
            "model": "en_US-male-medium"
        }
    },
    plugins : [],
    bio: [""],
    lore: [""],
    topics: [""],
   
    style: {
      all: [""],
      chat: [""],
      post: [""],
    },
    adjectives: [""],
    twitterTargets: "",
     
    
  });

 // Pass userUUID as characterID to CharacterForm
const handleFormChange = (updatedFormData) => {
  // Handle nested 'style' fields specifically if present
  setFormData((prevFormData) => {
    const { name, value } = updatedFormData;

    // Check if the updated field is part of the 'style' object
    if (["all", "chat", "post"].includes(name)) {
      return {
        ...prevFormData,
        style: {
          ...prevFormData.style,
          [name]: value.split("\n"), // Split input into an array by line breaks
        },
      };
    }

    // For all other fields, update normally
    return {
      ...prevFormData,
      ...updatedFormData,
    };
  });
};



  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Use the character name or a timestamp as a temporary ID
      const characterID = formData.name || `character-${Date.now()}`;
  
      const characterData = {
        ...formData,
        createdAt: new Date(),
      };
  
      // Save to Firestore with the generated ID
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
    } catch (error) {
      console.error("Error saving character:", error);
    }
  };
  
  return (
    <div>
      <CharacterForm formData={formData} onFormChange={handleFormChange} userUUID={userUUID}  onSubmit={handleSubmit}  />
    </div>
  );
};

export default CharacterCreation;
