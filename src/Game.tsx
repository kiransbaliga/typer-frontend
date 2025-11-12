import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { socket } from './socket';
import { config } from './config';
import './App.css';

function Game() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Player and Opponent State
  const [player, setPlayer] = useState({ name: location.state?.playerName || 'Player 1', character: location.state?.character || '#ff6b6b' });
  const [opponent, setOpponent] = useState({ name: 'Player 2', character: '#5c7cfa' });

  // Game State
  const [gameText, setGameText] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const len = gameText.length;
  const [currentChar, setCurrentChar] = useState<number>(0);
  const [errors, setErrors] = useState<number[]>([]);
  const [totalErrors, setTotalErrors] = useState(0);
  const [oppProgress, setOppProgress] = useState<number>(0);
  const [gameover, setGameover] = useState<boolean>(false);
  const [winner, setWinner] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (gameStarted && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [gameStarted]);

  useEffect(() => {
    const { playerName, character, wordCount } = location.state || {};

    if (!socket.connected) {
      socket.auth = { 
        room: roomCode, 
        wordCount,
        playerName: playerName || 'Anonymous',
        character: character || '#ff6b6b'
      };
      socket.connect();
    }

    function onGameStart({ text, players }: { text: string, players: any[] }) {
      const self = players.find(p => p.id === socket.id);
      const other = players.find(p => p.id !== socket.id);
      if (self) setPlayer({ name: self.name, character: self.character });
      if (other) setOpponent({ name: other.name, character: other.character });
      setGameText(text);
      setGameStarted(true);
    }

    function onGameOver(winnerId: string) {
        const winnerPlayer = winnerId === socket.id ? player : opponent;
        setWinner(winnerPlayer);
        setGameover(true);
    }

    function onProgress(progress: number) {
      setOppProgress(progress);
    }

    function onRoomFull() {
      alert('Room is full');
      navigate('/');
    }
    
    function onOpponentJoined(otherPlayer: any) {
        setOpponent({ name: otherPlayer.name, character: otherPlayer.character });
    }

    socket.on('gameStart', onGameStart);
    socket.on('gameover', onGameOver);
    socket.on('progress', onProgress);
    socket.on('roomFull', onRoomFull);
    socket.on('opponentJoined', onOpponentJoined);

    return () => {
      socket.off('gameStart', onGameStart);
      socket.off('gameover', onGameOver);
      socket.off('progress', onProgress);
      socket.off('roomFull', onRoomFull);
      socket.off('opponentJoined', onOpponentJoined);
      socket.disconnect();
    };
  }, [roomCode, navigate, location.state]);

  const sendProgress = () => {
    if (len === 0) return;
    const progress = getCurrProgress();
    socket.emit('progress', progress);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (gameover) return;

    const { key } = e;

    if (key === 'Backspace') {
      if (errors.includes(currentChar - 1)) {
        setErrors(errors.filter(errIndex => errIndex !== currentChar - 1));
      }
      if (currentChar > 0) {
        setCurrentChar(currentChar - 1);
      }
    } else if (key.length === 1) { // Handle printable characters
      if (gameText[currentChar] === key) {
        if (!errors.includes(currentChar)) {
            setCurrentChar(currentChar + 1);
        }
      } else {
        if (!errors.includes(currentChar)) {
          setErrors([...errors, currentChar]);
          setTotalErrors(totalErrors + 1);
        }
      }
    }
  };
  
  useEffect(() => {
    sendProgress();
  }, [currentChar, errors, totalErrors]);


  const getCurrProgress = () => {
    if (len === 0) return 0;
    // Only count characters that have been typed correctly and are not errors
    const correctChars = currentChar - errors.length;
    const progress = (correctChars / len) * 100;
    return Math.max(0, progress);
  };

  const checkWinCondition = () => {
    const myProgress = getCurrProgress();
    const difference = myProgress - oppProgress;
    
    if (myProgress >= 100 && errors.length === 0) {
        socket.emit('gameover', socket.id);
        setWinner(player);
        setGameover(true);
    } else if (difference > config.WIN_THRESHOLD) {
        socket.emit('gameover', socket.id);
        setWinner(player);
        setGameover(true);
    }
  }

  useEffect(() => {
    if(gameStarted && !gameover) {
        checkWinCondition();
    }
  }, [oppProgress, currentChar]);


  if (!gameStarted) {
    return (
      <div className="game-grid">
        <div className="navbar-grid">
            <h1>Typ_r - Room: {roomCode}</h1>
        </div>
        <div style={{gridColumn: '1 / -1', textAlign: 'center'}}>
            <h2>Waiting for another player to join...</h2>
        </div>
      </div>
    );
  }

  const renderTugOfWar = () => {
      const myProgress = getCurrProgress();
      const difference = myProgress - oppProgress;
      // Clamp difference between -50 and 50
      const clampedDiff = Math.max(-50, Math.min(50, difference));
      
      const p1Width = 50 + clampedDiff;
      const p2Width = 50 - clampedDiff;

      return (
          <>
            <div className="player-character" style={{ backgroundColor: player.character }}>
                {/* Player 1 Character - 100x100px */}
            </div>
            <div className="rope" style={{ width: `${p1Width}%`, backgroundColor: player.character }}></div>
            <div className="rope" style={{ width: `${p2Width}%`, backgroundColor: opponent.character }}></div>
            <div className="player-character" style={{ backgroundColor: opponent.character }}>
                {/* Player 2 Character - 100x100px */}
            </div>
          </>
      )
  }

  return (
    <div className="game-grid">
      {gameover && (
        <div className="game-over-grid">
          <h1>Game Over</h1>
          <h2>{winner ? `${winner.name} wins!` : 'It\'s a draw!'}</h2>
          <div className="player-character" style={{ backgroundColor: winner?.character, width: 150, height: 150 }}></div>
          <button onClick={() => navigate('/')}>Play Again</button>
        </div>
      )}

      {!gameover && (
        <>
          <div className="navbar-grid">
            <h1>Typ_r - Room: {roomCode}</h1>
          </div>

          <div className="player-one-grid">
            <h3>{player.name}</h3>
            <div className="player-character" style={{ backgroundColor: player.character, margin: '0 auto' }}></div>
            <p>Progress: {getCurrProgress().toFixed(2)}%</p>
          </div>

          <div className="tug-of-war-grid">
            {renderTugOfWar()}
          </div>

          <div className="player-two-grid">
            <h3>{opponent.name}</h3>
            <div className="player-character" style={{ backgroundColor: opponent.character, margin: '0 auto' }}></div>
            <p>Progress: {oppProgress.toFixed(2)}%</p>
          </div>

          <div className="typing-area-grid">
            <textarea
              ref={textareaRef}
              className='typebox'
              onKeyDown={handleKeyDown}
              value=""
              readOnly
            />
            <div className="type-hint" onClick={() => textareaRef.current?.focus()}>
              {gameText.split('').map((char, index) => {
                let className = 'noone';
                if (index < currentChar) {
                  className = errors.includes(index) ? 'incorrect' : 'correct';
                } else if (index === currentChar) {
                  className = 'untyped';
                }
                return (
                  <span key={index} className={className}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Game;
