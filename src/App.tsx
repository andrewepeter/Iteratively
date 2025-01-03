import { useState, useEffect } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

function App() {
  const [word, setWord] = useState('');
  const [isValidWord, setIsValidWord] = useState<boolean | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            // Handle game over here
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isStarted, timeLeft]);

  const handleStart = () => {
    setIsStarted(true);
    setTimeLeft(120); // Reset timer when starting
  };

  // Convert seconds to minutes and seconds
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
    
  return (
    <main>
      {!isStarted ? (
        <button 
          onClick={handleStart}
          className="start-button"
        >
          Start
        </button>
      ) : (
        <div>
          <div className="timer">
            Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </div>
          <input 
            type="text" 
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter a word to verify"
          />
          <button 
            onClick={async () => {
              try {
                const response = await fetch(`/api/validateWord?word=${word}`);
                const data = await response.json();
                console.log(data);
                console.log(response);
                setIsValidWord(data.isValid);
              } catch (error) {
                console.error('Error validating word:', error);
                setIsValidWord(null);
              }
            }}
          >
            Verify Word
          </button>
          {isValidWord !== null && (
            <p>
              {isValidWord ? 
                `"${word}" is a valid word!` : 
                `"${word}" is not a valid word.`
              }
            </p>
          )}
        </div>
      )}
    </main>
  );
}

export default App;
