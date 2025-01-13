import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
//import { Howl } from 'howler';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import HowToPlay from './HowToPlay';
import { fetchAuthSession } from 'aws-amplify/auth';

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
  const [chainLength, setChainLength] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [comboLevel, setComboLevel] = useState(0);
  const [lastWordTime, setLastWordTime] = useState<number | null>(null);
  const [comboMessage, setComboMessage] = useState<string | null>(null);
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState<string | null>(null);
  const [awsAccessKeyId, setAwsAccessKeyId] = useState<string | null>(null);
  const awsRegion = "ca-central-1";
  //const [leaderboardTable, setLeaderboardTable] = useState<string | null>(null);

  interface LeaderboardEntry {
    id: string;
    username: string;
    score: number;
  }


  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const TIMEOUT_DURATION = 10000;

  const wordApiUrl = 'https://7jnx9golvc.execute-api.ca-central-1.amazonaws.com/prod/word';
  const LBApiUrl = 'https://uceb7mx731.execute-api.ca-central-1.amazonaws.com/prod/LB';
  const PROMPT_TEMPLATE = "Please generate exactly one simple, valid English word (between 4 and 8 characters long). Do not include any spaces or punctuation. AND ONLY THE WORD NO SENTENCES OR PHRASES.";

  /*const sounds = {
    perfect: new Howl({
      src: ['https://wordsoundeffects.s3.amazonaws.com/perfect.mp3'],
      volume: 0.9,
    }),
    ding: new Howl({
      src: ['https://wordsoundeffects.s3.amazonaws.com/ding.mp3'],
      volume: 0.9,
    }),
    go: new Howl({
      src: ['https://wordsoundeffects.s3.amazonaws.com/go.mp3'],
      volume: 0.9,
    }),
    invalidword: new Howl({
      src: ['https://wordsoundeffects.s3.amazonaws.com/invalidword.mp3'],
      volume: 0.9,
    }),
    nice: new Howl({
      src: ['https://wordsoundeffects.s3.amazonaws.com/nice.mp3'],
      volume: 0.9,
    }),
    wordused: new Howl({
      src: ['https://wordsoundeffects.s3.amazonaws.com/wordused.mp3'],
      volume: 0.9,
    }),
    wow: new Howl({
      src: ['https://wordsoundeffects.s3.amazonaws.com/wow.mp3'],
      volume: 0.9,
    }),
    doublepoints: new Howl({
      src: ['https://wordsoundeffects.s3.amazonaws.com/doublepoints.mp3'],
      volume: 0.9,
    }),
  };*/




  useEffect(() => {
    const secret_name = "prod/amplifySecrets";
    const getSecretValue = async () => {
      try {
        // Send the request to fetch the secret
        const client = new SecretsManagerClient({
          region: "ca-central-1",
          /*credentials: {
            accessKeyId: import.meta.env.VITE_REACT_APP_AWS_ACCESS_KEY_ID || '',
            secretAccessKey: import.meta.env.VITE_REACT_APP_AWS_SECRET_ACCESS_KEY || ''
          }*/
        });
        const data = await client.send(new GetSecretValueCommand({ SecretId: secret_name }));
        if (data.SecretString) {
          const secret = JSON.parse(data.SecretString);
          console.log("Secret values:", secret);

          // Now you can access your secrets
          setAwsSecretAccessKey(secret.VITE_REACT_APP_AWS_SECRET_ACCESS_KEY);
          setAwsAccessKeyId(secret.VITE_REACT_APP_AWS_ACCESS_KEY_ID);
          //setAwsRegion(secret.awsRegion);
          //setLeaderboardTable(secret.leaderboardTable);

          // Log the secret values
          console.log("AWS Access Key ID:", awsAccessKeyId);
          console.log("AWS Secret Access Key:", awsSecretAccessKey);
          //console.log("AWS Region:", awsRegion);
          //console.log("Leaderboard Table:", leaderboardTable);
        } else {
          console.error("SecretString is not available");
        }
      } catch (error) {
        console.error("Error fetching secret:", error);
      }
    };
    getSecretValue();
  }, [awsAccessKeyId, awsSecretAccessKey]);

  const bedrockClient = useMemo(() => {
    if (awsAccessKeyId && awsSecretAccessKey && awsRegion) {
      console.log("Initializing BedrockRuntimeClient...");
      return new BedrockRuntimeClient({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey
        }
      });
    }
    console.log("BedrockRuntimeClient not initialized");
    return null;
  }, [awsAccessKeyId, awsRegion, awsSecretAccessKey]);


  const generateWord = useCallback(async () => {
    if (!bedrockClient) {
      setError("Bedrock client is not initialized");
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        prompt: PROMPT_TEMPLATE,
        max_tokens: 10,
        temperature: 0.9,
        top_p: 1,
      };

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
        const cleanWord = rawWord.split(' ')[0].replace(/[^a-z]/g, ''); // Extract only the first word

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

    const timeoutId = setTimeout(focusInput, 10);

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
      resetCombo();
    }
  }, [timeLeft, word, isStarted, isLoading]);

  const handleStart = () => {
    setIsStarted(true);
    setTimeLeft(60);
    setError(null);
    setScore(0);
    setChainLength(0);
    setComboCount(0);
    setComboLevel(0);
    setLastWordTime(null);
    setComboMessage(null); // Clear combo message
    setWordList([]); // Clear the word list when starting a new game
    inputRef.current?.focus();
    generateWord();
    //sounds.go.play();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value.toLowerCase();
    setUserInput(newInput);
  };

  const handleLeaderBoard = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      console.log(token)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': String(token), // Include the token in the Authorization header
      };

      const response = await fetch(LBApiUrl, {
        method: 'GET',
        headers: headers,
      });

      if (response.ok) {
        const responseText = await response.text();
        console.log(responseText); // Log the response text for debugging
        if (responseText) {
          const data = JSON.parse(responseText);
          setLeaderboard(data);
          setShowLeaderboard(true);
        } else {
          setError("Empty response from server");
        }
      } else {
        const errorText = await response.text();
        console.error('Error response text:', errorText); // Log the error response text
        setError("Failed to fetch leaderboard");
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to fetch leaderboard');
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      console.log(userInput);
      console.log(curWord);
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': String(token), // Include the token in the Authorization header
        };

        const response = await fetch(wordApiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ word: userInput.toLowerCase() }),
        });

        if (response.ok) {
          const responseText = await response.text();
          console.log(responseText); // Log the response text for debugging
          if (responseText) {
            const data = JSON.parse(responseText);
            console.log(data);
            if (userInput.startsWith(curWord[curWord.length - 1])) {
              if (wordList.includes(userInput)) {
                //sounds.wordused.play();
                setScore((prev) => prev - 15);
                setError("Word already used. Try a different word!");
                resetCombo();
              } else {
                const currentTime = Date.now();
                const timeDiff = lastWordTime ? (currentTime - lastWordTime) / 1000 : 0;

                if (comboLevel === 0 && comboCount >= 2 && timeDiff <= 10) {
                  setComboLevel(1);
                  setComboCount(0);
                  setComboMessage("Combo 1 (2x Points) Activated!");
                  //sounds.doublepoints.play();
                } else if (comboLevel === 1 && comboCount >= 4 && timeDiff <= 15) {
                  setComboLevel(2);
                  setComboCount(0);
                  setComboMessage("Combo 2 (3x Points) Activated!");
                } else if (comboLevel === 2 && comboCount >= 9 && timeDiff <= 20) {
                  setComboLevel(3);
                  setComboCount(0);
                  setComboMessage("Combo 3 (5x Points) Activated!");
                } else if (timeDiff > 20) {
                  resetCombo();
                }

                const comboMultiplier = comboLevel === 1 ? 2 : comboLevel === 2 ? 3 : comboLevel === 3 ? 5 : 1;
                const points = (10 + userInput.length) * comboMultiplier;

                setChainLength((prev) => prev + 1);
                setScore((prev) => prev + points);
                setComboCount((prev) => prev + 1);
                setLastWordTime(currentTime);

                if (userInput.length > 6) {
                  setScore((prev) => prev + 10);
                }

                if (/[xyzj]/.test(userInput)) {
                  setScore((prev) => prev + 5);
                }

                if (chainLength % 5 === 0) {
                  setScore((prev) => prev + 20);
                  //sounds.wow.play();
                } else if (chainLength % 10 === 0) {
                  setScore((prev) => prev + 50);
                  //sounds.wow.play();
                } else if (chainLength % 20 === 0) {
                  setScore((prev) => prev + 100);
                  //sounds.wow.play();
                }

                setCurWord(userInput);
                setWordList((prevList) => [...prevList, userInput]);
                setError(null);
                setUserInput(''); // Clear the text field
              }
            } else {
              //sounds.invalidword.play();
              setError("Incorrect word. Try again!");
              setScore((prev) => prev - 5);
              resetCombo();
              setUserInput(''); // Clear the text field
            }
          } else {
            setError("Empty response from server");
          }
        } else {
          const errorText = await response.text();
          console.error('Error response text:', errorText); // Log the error response text
          setError("Failed to verify word");
        }
      } catch (error) {
        console.error('Error verifying word:', error);
        setError('Failed to verify word');
      }
    }
  };

  const resetCombo = () => {
    setComboCount(0);
    setComboLevel(0);
    setLastWordTime(null);
    setComboMessage(null); // Clear combo message
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <main className="container mx-auto p-4">
      {!isStarted ? (
        <div className="start-screen text-center">
          <button onClick={handleStart} className="start-button bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700">
            Start Game
          </button>
          <button onClick={handleLeaderBoard} className="leader-button bg-gray-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-gray-700 mt-4">
            View Leaderboard
          </button>
          {score > 0 && <div className="final-score text-xl font-bold mt-4">Final Score: {score}</div>}
          <HowToPlay />
          {showLeaderboard && (
            <div className="leaderboard mt-8">
              <h3 className="text-xl font-bold mb-2">Leaderboard:</h3>
              <ul className="list-disc list-inside">
                {leaderboard.map((entry) => (
                  <li key={entry.id} className="text-lg">{entry.username}: {entry.score}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-lg mt-20">
          <div className={`timer text-2xl font-bold mb-4 ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
            Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </div>
          <div className="score text-xl font-bold mb-4">Score: {score}</div>
          <div className="word-display text-3xl font-bold mb-4">
            {isLoading ? 'Generating word...' : (
              <>
                {curWord.slice(0, -1)}
                <span className="font-extrabold text-blue-700 text-4xl">{curWord.slice(-1)}</span>
              </>
            )}
          </div>
          {error && <div className="error text-red-500 mb-4">{error}</div>}
          {comboMessage && <div className="combo-message text-green-500 mb-4">{comboMessage}</div>}
          <input
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type the word"
            className="word-input w-full p-2 border border-gray-300 rounded-lg mb-4"
            disabled={!isStarted || isLoading}
            autoFocus
            onBlur={(e) => {
              if (isStarted && !isLoading) {
                e.target.focus();
              }
            }}
            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
          />
          <button onClick={generateWord} disabled={isLoading} className="generate-button bg-yellow-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-yellow-700">
            Skip Word
          </button>
          <div className="word-list mt-8">
            <h3 className="text-xl font-bold mb-2">Word List:</h3>
            <ul className="list-disc list-inside">
              {wordList.map((w) => (
                <li key={w} className="text-lg">{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
