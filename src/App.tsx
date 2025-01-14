import React, { useState, useEffect, useRef } from 'react';
import HowToPlay from './HowToPlay';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuthenticator } from '@aws-amplify/ui-react';

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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [userTag, setUserTag] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false); // State to manage instructions visibility


  //const awsRegion = "ca-central-1";
  //const [leaderboardTable, setLeaderboardTable] = useState<string | null>(null);

  interface LeaderboardEntry {
    id: string;
    username: string;
    score: number;
    rank: number;
  }
  const { user } = useAuthenticator();
  const wordApiUrl = 'https://7jnx9golvc.execute-api.ca-central-1.amazonaws.com/prod/word';
  const LBApiUrl = 'https://uceb7mx731.execute-api.ca-central-1.amazonaws.com/prod/LB';
  const genWordUrl = 'https://dns37gpcu9.execute-api.ca-central-1.amazonaws.com/prod/genWord'


  const sounds = {
    incorrect: new Audio('https://wordsoundeffects.s3.amazonaws.com/incorrect.mp3'),
    correct: new Audio('https://wordsoundeffects.s3.amazonaws.com/correct.mp3'),
    doublepoints: new Audio('https://wordsoundeffects.s3.amazonaws.com/doublepoints.mp3'),
  };
  /*perfect: new Howl({
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
  }),*/



  const generateWord = async () => {
    setIsLoading(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': String(token), // Include the token in the Authorization header
      };
      const response = await fetch(genWordUrl, {
        method: 'GET',
        headers: headers,
      });

      const data = await response.json();
      if (response.ok) {
        const parsedBody = JSON.parse(data.body);
        setWord(parsedBody.word);
        setCurWord(parsedBody.word);
        setUserInput('');
        setError(null);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate word');
    } finally {
      setIsLoading(false);
    }
  };

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
      setShowSubmitForm(true);
    }
  }, [timeLeft, word, isStarted, isLoading]);

  const handleStart = async () => {
    setError(null);
    setScore(0);
    setChainLength(0);
    setComboCount(0);
    setComboLevel(0);
    setLastWordTime(null);
    setComboMessage(null); // Clear combo message
    setWordList([]); // Clear the word list when starting a new game
    inputRef.current?.focus();
    await generateWord();
    setIsStarted(true);
    setTimeLeft(60); // Start the timer after the word is generated
    //sounds.song1.play();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value.toLowerCase();
    setUserInput(newInput);
  };

  const handleLeaderBoard = async () => {
    setShowLeaderboard((prev) => !prev); // Toggle the visibility of the leaderboard
    if (!showLeaderboard) { // Only fetch the leaderboard if it is not currently visible
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        console.log(token);
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
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
            const leaderboardData = data.leaderboard.map((entry: { Name: string; Tag?: string; Score?: number }, index: number) => ({
              id: entry.Name, // Assuming 'Name' is unique and can be used as 'id'
              username: entry.Tag || "Anonymous", // Use 'Tag' if available, otherwise use 'Anonymous'
              score: entry.Score || 0, // Default to 0 if 'Score' is missing
              rank: index + 1 // Add rank based on index
            }));
            setLeaderboard(leaderboardData);
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
          'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
        };

        const response = await fetch(wordApiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ word: userInput.toLowerCase() }),
        });

        const responseData = await response.json();
        console.log(responseData); // Log the response data for debugging

        if (responseData.statusCode === 200) {
          if (userInput.startsWith(curWord[curWord.length - 1])) {
            if (wordList.includes(userInput)) {
              sounds.incorrect.play();
              setScore((prev) => prev - 15);
              setError("Word already used. Try a different word!");
              resetCombo();
            } else {
              sounds.correct.play();
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
            sounds.incorrect.play();
            setError("Incorrect word. Try again!");
            setScore((prev) => prev - 5);
            resetCombo();
            setComboMessage('')
            setUserInput(''); // Clear the text field
          }
        } else if (responseData.statusCode === 404) {
          console.error('Error response text:', responseData.body); // Log the error response text
          setError("This is not a valid word. Try again!");
          setScore((prev) => prev - 5);
          resetCombo();
          setComboMessage('')
          setUserInput(''); // Clear the text field
        } else {
          console.error('Error response text:', responseData.body); // Log the error response text
          setError("Failed to verify word");
          setUserInput(''); // Clear the text field
        }
      } catch (error) {
        console.error('Error verifying word:', error);
        setError('Failed to verify word');
        setUserInput(''); // Clear the text field
      }
    }
  };

  const handleSubmitScore = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
      };

      const response = await fetch(LBApiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ email: user?.signInDetails?.loginId, Tag: userTag, score: score }),
      });

      if (response.ok) {
        setShowSubmitForm(false);
        await handleLeaderBoard(); // Refresh the leaderboard after submitting the score
      } else {
        const errorText = await response.text();
        console.error('Error response text:', errorText); // Log the error response text
        setError("Failed to submit score");
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      setError('Failed to submit score');
    }
  };

  const toggleInstructions = () => {
    setShowInstructions((prev) => !prev);
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
      {/* Start Screen */}
      {!isStarted ? (
        <div className="start-screen text-center">
          {/* Title */}
          <h1 className="game-title text-6xl font-extrabold text-blue-500 mb-8">
            Iteratively
          </h1>
          {/* Buttons */}
          <div className="button-group space-x-4">
            <button
              onClick={handleStart}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700"
            >
              Start Game
            </button>
            <button
              onClick={handleLeaderBoard}
              className="bg-gray-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-gray-700"
            >
              View Leaderboard
            </button>
            <button
              onClick={toggleInstructions}
              className="bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-700"
            >
              How to Play
            </button>
          </div>

          {/* Instructions */}
          {showInstructions && (
            <div className="instructions mt-4 p-4 bg-gray-100 rounded-lg shadow-md">
              <HowToPlay />
            </div>
          )}

          {/* Final Score */}
          {score > 0 && (
            <div className="final-score text-xl font-bold mt-4">
              Final Score: {score}
            </div>
          )}

          {/* Leaderboard */}
          {showLeaderboard && (
            <div className="leaderboard mt-8 bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-800">
                Top Players
              </h3>
              <div className="leaderboard-header grid grid-cols-3 text-lg font-semibold mb-2 border-b pb-2 text-gray-700">
                <span>#</span>
                <span className="text-center">Nickname</span>
                <span className="text-right">Score</span>
              </div>
              <ul className="leaderboard-list space-y-3">
                {leaderboard.map((entry, index) => (
                  <li
                    key={entry.id}
                    className={`grid grid-cols-3 items-center p-2 rounded-lg ${index % 2 === 0 ? 'bg-gray-100' : ''
                      }`}
                  >
                    <span className="font-medium">{index + 1}</span>
                    <span className="text-center font-semibold text-gray-800">
                      {entry.username}
                    </span>
                    <span className="text-right text-blue-500 font-bold">
                      {entry.score}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}


          {/* Submit Score Form */}
          {showSubmitForm && (
            <div className="submit-form mt-8">
              <h3 className="text-xl font-bold mb-2">Submit Your Score to the Leaderboard:</h3>
              <input
                type="text"
                value={userTag}
                onChange={(e) => setUserTag(e.target.value)}
                placeholder="Enter a nickname"
                className="w-64 p-2 border border-gray-300 rounded-lg mb-4 text-lg" // Adjusted width and text size
              />
              <button
                onClick={handleSubmitScore}
                className="bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Game Screen */

        <div className="game-screen max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-lg mt-20">
          <h1 className="game-title text-6xl font-extrabold text-blue-500  mb-8">
            Iteratively
          </h1>
          <p className='mb-4'>Hit enter or the submit button to add a word to the list.</p>
          {/* Timer */}
          <div
            className={`timer text-2xl font-bold mb-4 ${timeLeft <= 10 ? 'text-red-500' : ''
              }`}
          >
            Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </div>

          {/* Score */}
          <div className="score text-xl font-bold mb-4">Score: {score}</div>

          {/* Current Word */}
          <div className="word-display text-3xl font-bold mb-4">
            {isLoading ? (
              'Generating word...'
            ) : (
              <>
                {curWord.slice(0, -1)}
                <span className="font-extrabold text-blue-500 text-4xl">
                  {curWord.slice(-1)}
                </span>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && <div className="error text-red-500 mb-4">{error}</div>}

          {/* Combo Message */}
          {comboMessage && (
            <div className="combo-message text-green-500 mb-4">
              {comboMessage}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type the word"
            className="w-full p-2 border border-gray-300 rounded-lg mb-4"
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

          {/* Skip Button */}
          <button
            onClick={generateWord}
            disabled={isLoading}
            className="bg-yellow-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-yellow-700"
          >
            Skip Word
          </button>

          {/* Word List */}
          <div className="word-list mt-8">
            <h3 className="text-xl font-bold mb-2">Word List:</h3>
            <ul className="list-disc list-inside">
              {wordList.map((w) => (
                <li key={w} className="text-lg">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );


}

export default App;
