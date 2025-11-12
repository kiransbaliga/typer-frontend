import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const characters = ['#ff6b6b', '#f06595', '#cc5de8', '#845ef7', '#5c7cfa', '#339af0', '#22b8cf', '#20c997', '#51cf66', '#94d82d'];

function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [wordCount, setWordCount] = useState(30);
  const [playerName, setPlayerName] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState(0);
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!playerName) {
      alert('Please enter your name.');
      return;
    }
    const newRoomCode = Math.random().toString(36).substring(2, 8);
    setCreatedRoomCode(newRoomCode);
    navigate(`/game/${newRoomCode}`, { state: { wordCount, playerName, character: characters[selectedCharacter] } });
  };

  const handleJoinRoom = () => {
    if (!playerName) {
      alert('Please enter your name.');
      return;
    }
    if (roomCode) {
      navigate(`/game/${roomCode}`, { state: { playerName, character: characters[selectedCharacter] } });
    } else {
      alert('Please enter a room code.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdRoomCode).then(() => {
      alert('Room code copied to clipboard!');
    });
  };

  const nextCharacter = () => {
    setSelectedCharacter((prev) => (prev + 1) % characters.length);
  };

  const prevCharacter = () => {
    setSelectedCharacter((prev) => (prev - 1 + characters.length) % characters.length);
  };

  return (
    <div className="home-grid">
      <div className="home-title-grid">
        <h1>Typ_r</h1>
        <p>The Ultimate Typing Tug of War</p>
      </div>

      <div className="player-customization-grid">
        <h2>Customize Your Player</h2>
        <div className="name-input">
          <label htmlFor="playerName">Your Name:</label>
          <input
            type="text"
            id="playerName"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>
        <div className="character-carousel">
          <button onClick={prevCharacter}>&lt;</button>
          <div className="character-display" style={{ backgroundColor: characters[selectedCharacter] }}>
            {/* Character image will go here. Dimensions: 100px x 100px */}
          </div>
          <button onClick={nextCharacter}>&gt;</button>
        </div>
      </div>

      <div className="room-actions-grid">
        <h2>Join the Fray</h2>
        <div className="create-room">
          <select value={wordCount} onChange={(e) => setWordCount(parseInt(e.target.value))}>
            <option value={30}>30 Words</option>
            <option value={60}>60 Words</option>
            <option value={90}>90 Words</option>
          </select>
          <button onClick={handleCreateRoom}>Create Room</button>
        </div>
        {createdRoomCode && (
          <div className="created-room">
            <span>Your room code is: {createdRoomCode}</span>
            <button onClick={copyToClipboard}>Copy</button>
          </div>
        )}
        <div className="join-room">
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
      </div>

      <div className="settings-grid">
        <h2>Settings</h2>
        <p>(Placeholder for future settings)</p>
      </div>
    </div>
  );
}

export default Home;
