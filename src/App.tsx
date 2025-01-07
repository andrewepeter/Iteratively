import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { Howl } from 'howler';

function App() {
  const [word, setWord] = useState('');
  const [curWord, setCurWord] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [userInput, setUserInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordList, setWordList] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const TIMEOUT_DURATION = 10000;
  const PROMPT_TEMPLATE = "Please generate exactly one simple, valid English word (between 4 and 8 characters long). Do not include any spaces or punctuation. AND ONLY THE WORD NO SENTENCES OR PHRASES.";

  const sounds = {

    perfect: new Howl({
      src: ['https://wordsoundeffects.s3.amazonaws.com/perfect.mp3'],
      volume: 0.9,
    }),

    ding: new Howl({
      src: ['https://wordsoundeffects.s3.amazonaws.com/ding.mp3'],
      volume: 0.9,
    }),
  };

  const bedrockClient = useMemo(() => new BedrockRuntimeClient({
    region: import.meta.env.VITE_AWS_REGION || "ca-central-1",
    credentials: {
      accessKeyId: import.meta.env.VITE_REACT_APP_AWS_ACCESS_KEY_ID!,
      secretAccessKey: import.meta.env.VITE_REACT_APP_AWS_SECRET_ACCESS_KEY!
    }
  }), []);

  const generateWord = useCallback(async () => {
    try {
      setIsLoading(true);

      const payload = {
        prompt: PROMPT_TEMPLATE,
        max_tokens: 10,
        temperature: 0.9,
        top_p: 1,
      };

      // Create the command here inside the callback
      const command = new InvokeModelCommand({
        modelId: "mistral.mistral-large-2402-v1:0",
        body: JSON.stringify(payload),
        contentType: "application/json",
        accept: "application/json",
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

      try {
        const response = await bedrockClient.send(command, {
          abortSignal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.body) {
          throw new Error('Empty response from Bedrock');
        }

        const responseData = JSON.parse(new TextDecoder().decode(response.body));

        if (!responseData?.outputs?.[0]?.text) {
          throw new Error('Invalid response format');
        }

        const rawWord = responseData.outputs[0].text.trim().toLowerCase();
        const cleanWord = rawWord.replace(/[^a-z]/g, '');


        setWord(cleanWord);
        setCurWord(cleanWord);
        setUserInput('');
        setError(null);
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error('Error generating word:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate word';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [bedrockClient]);

  useEffect(() => {
    if (!isStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, timeLeft]);

  useEffect(() => {
    const focusInput = () => {
      if (isStarted && !isLoading) {
        inputRef.current?.focus();
      }
    };

    // Focus after a very short delay to ensure DOM is ready
    const timeoutId = setTimeout(focusInput, 10);

    // Add event listener to refocus on window focus
    window.addEventListener('focus', focusInput);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('focus', focusInput);
    };
  }, [isStarted, isLoading]);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsStarted(false);
      setWord('');
      setUserInput('');
      if (isStarted && !isLoading) {
        inputRef.current?.focus();
      }
    }
  }, [timeLeft, word, isStarted, isLoading]);

  const handleStart = () => {
    setIsStarted(true);
    setTimeLeft(60);
    setError(null);
    setScore(0);
    setWordList([])
    inputRef.current?.focus();
    generateWord();
    // Focus the input field after starting
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value.toLowerCase();
    setUserInput(newInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      console.log(userInput);
      console.log(curWord);
      if (userInput.startsWith(curWord[curWord.length - 1])) {
        if (wordList.includes(userInput)) {
          setError("Word already used. Try a different word!");
        } else {
          setScore((prev) => prev + 1);

          if (score === 20 || score === 15 || score === 10 || score === 5) {
            sounds.perfect.play();
          } else {
            sounds.ding.play();
          }

          setCurWord(userInput);
          setWordList((prevList) => [...prevList, userInput]);
          setError(null);
        }
      } else {
        setError("Incorrect word. Try again!");
      }
    }
  }
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <main className="container">
      {!isStarted ? (
        <div className="start-screen">
          <text>combo</text>
          <button onClick={handleStart} className="start-button">
            Start Game
          </button>
          <button className="leader-button">
            View Leaderboard
          </button>
          {score > 0 && <div className="final-score">Final Score: {score}</div>}
        </div>
      ) : (
        <div className="game-screen">
          <div className="timer">
            Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </div>
          <div className="score">Score: {score}</div>
          <div className="word-display">{isLoading ? 'Generating word...' : curWord}</div>
          {error && <div className="error">{error}</div>}
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type the word"
            className="word-input"
            disabled={!isStarted || isLoading}
            autoFocus
            onBlur={(e) => {
              // Prevent losing focus if game is active
              if (isStarted && !isLoading) {
                e.target.focus();
              }
            }}

            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
          />

          <button onClick={generateWord} disabled={isLoading} className="generate-button">
            Skip Word
          </button>
          <button onClick={generateWord} disabled={isLoading} className="generate-button">
            Skip Word
          </button>
          <div className="word-list">
            <h3>Word List:</h3>
            <ul>
              {wordList.map((w, index) => (
                <li key={`${w}-${index}`}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
