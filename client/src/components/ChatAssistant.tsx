import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

const ChatAssistant = () => {
  const { 
    showAssistant, 
    setShowAssistant, 
    assistantMessage, 
    generateNewAssistantMessage 
  } = useAppContext();
  
  const [messageBubbleVisible, setMessageBubbleVisible] = useState(true);

  // Show assistant message bubble after initial timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      setMessageBubbleVisible(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const toggleAssistant = () => {
    setMessageBubbleVisible(!messageBubbleVisible);
  };

  const dismissAssistant = () => {
    setMessageBubbleVisible(false);
    // Generate a new message for next time
    generateNewAssistantMessage();
  };

  if (!showAssistant) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {messageBubbleVisible && (
        <div className="relative mb-2 max-w-[200px] bg-white border-2 border-dark-gray rounded-xl p-2.5 shadow-retro">
          <p className="text-sm font-nunito mb-1">{assistantMessage}</p>
          <div className="flex justify-end">
            <button 
              className="px-2 py-0.5 text-xs bg-dusty-blue/20 rounded font-pixel"
              onClick={dismissAssistant}
            >
              OK
            </button>
          </div>
          <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-8 border-l-transparent border-t-8 border-t-white border-r-8 border-r-transparent"></div>
          <div className="absolute -bottom-3 right-7 w-0 h-0 border-l-10 border-l-transparent border-t-10 border-t-dark-gray border-r-10 border-r-transparent"></div>
        </div>
      )}
      <div className="flex items-end">
        <img 
          src="https://images.unsplash.com/photo-1561948955-570b270e7c36?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" 
          alt="Chat assistant cat character" 
          className="w-16 h-16 rounded-full border-2 border-dark-gray shadow-retro cursor-pointer"
          onClick={toggleAssistant}
        />
      </div>
    </div>
  );
};

export default ChatAssistant;
