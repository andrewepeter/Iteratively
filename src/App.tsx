import { useState, useEffect, useMemo, useCallback } from "react";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

function App() {
  const [word, setWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const TIMEOUT_DURATION = 10000;
  const PROMPT_TEMPLATE = "Please generate exactly one simple, valid English word (between 4 and 8 characters long). Do not include any spaces or punctuation. AND ONLY THE WORD NO SENTENCES OR PHRASES.";


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
    if (timeLeft === 0) {
      setIsStarted(false);
      setWord('');
      setUserInput('');
    }
  }, [timeLeft]);

  const handleStart = () => {
    setIsStarted(true);
    setTimeLeft(120);
    setError(null);
    setScore(0);
    generateWord(); // Call the function on start
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value.toLowerCase();
    setUserInput(newInput);

    if (newInput === word) {
      setScore((prev) => prev + 1);
      generateWord(); // Call the function when the user inputs the correct word
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <main className="container">
      {!isStarted ? (
        <div className="start-screen">
          <button onClick={handleStart} className="start-button">
            Start Game
          </button>
          {score > 0 && <div className="final-score">Final Score: {score}</div>}
        </div>
      ) : (
        <div className="game-screen">
          <div className="timer">
            Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </div>
          <div className="score">Score: {score}</div>
          <div className="word-display">{isLoading ? 'Generating word...' : word}</div>
          {error && <div className="error">{error}</div>}
          <input
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Type the word"
            className="word-input"
            disabled={isLoading}
          />
          <button onClick={generateWord} disabled={isLoading} className="generate-button">
            Skip Word
          </button>
        </div>
      )}
    </main>
  );
}

export default App;
