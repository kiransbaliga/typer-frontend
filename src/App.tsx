import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';
import image from './assets/img1.png';
import left_line from './assets/line-left.png';
import right_line from './assets/line-right.png';
const socket = io('https://typr.onrender.com', {
  upgrade: true
}); // Replace with your server URL

function App() {
  const test = 'hi this is the text that you need to type in order to get the score and some other random text are also here so that you can also be a good typer what about this one is it good enough to be a good typer or not i dont know but i think it is good enough to be a good typer so i am going to use this one  for the test'
  const len = test.length;
  const [currentChar, setCurrentChar] = useState<number>(0);
  const [errorChar, setErrorChar] = useState<number>(-1);

  const [oppProgress, setProgress] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const text = '';
  const [gameover, setGameover] = useState<boolean>(false);
  const [iwon, setIwon] = useState<boolean>(true);
  useEffect(() => {
    // Listen for 'chat message' events from the server
   

    // Listen for the 'connect' event to update connection status
    socket.on('connect', () => {
      setIsConnected(true);
    });
    socket.on('gameover', () => {
      setGameover(true);
      setIwon(false);
    });
    // Listen for the 'disconnect' event to update connection status
    socket.on('disconnect', () => {
      setIsConnected(false);
    });
    socket.on('progress', (progress: number) => {
      setProgress(progress);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const sendProgress = () => {
    const percenatageCompleted = (currentChar / len) * 100;
    socket.emit('progress', percenatageCompleted);
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    //compare the text with the test
    const value = e.target.value;
    if (value === test[currentChar]) {
      setCurrentChar(currentChar + 1);
      setErrorChar(-1);
      sendProgress();
    }
    else {
      setErrorChar(currentChar);
    }

  }
  const getCurrProgress = () => {
    return (currentChar / len) * 100;
  }
  const calcPosition = () => {
    const currProgress = getCurrProgress();
    const difference = oppProgress > currProgress ? oppProgress - currProgress : currProgress - oppProgress;
    const am_I_ahead = oppProgress > currProgress ? false : true;
    return { difference, am_I_ahead };
  }
  const status = calcPosition();
  console.log(status)
  if (status.difference > 20 && !gameover) {
    if (status.am_I_ahead) {
      socket.emit('gameover', 'shut up loser and cry over in the corner!');
      setGameover(true);
      setIwon(true);
    }
  }
  if (gameover)
    return (
      <div>
        <h1>Game Over</h1>
        <h2>{iwon ? 'You won yay!' : 'shut up loser and cry over in the corner!'}</h2>
      </div>
    )

  return (
    <>
      <div className="navbar">
        <h1>Typ_r</h1>
        <div className="right-section">
          <p className='connection-status'>{isConnected ? 'active' : 'disconnected'}</p>
          <button onClick={() => { socket.connect(); }} disabled={isConnected ? true : false}>Connect</button>
          <button onClick={() => { socket.disconnect(); }} disabled={isConnected ? false : true}>Disconnect</button>
        </div>
      </div>
      <div className="marking">
        <img src={left_line} alt="" className="left" />
        <img src={right_line} alt="" className="right" />
      </div>
      <div className="image" style={{ left: `${status.am_I_ahead ? status.difference : -1 * status.difference}%` }} >
        <img src={image} alt="alternate" width={"50%"} />
        {/* ----------0--------------|------------------------------------------------------------|-------------0----------- */}
      </div>
      <div className="typelayout">
        <textarea className='typebox' value={text} onChange={handleOnChange} ></textarea>
        <div className="type-hint">
          {test.split('').map((char, index) => (
            <span key={index}
              className={index < currentChar ? 'correct' : `${index === errorChar ? 'incorrect' : 'untyped'}`}
            >
              {char}
            </span>
          ))}
        </div>

      </div>
    </>
  );
}

export default App;
