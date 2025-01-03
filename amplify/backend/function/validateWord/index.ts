import { type Handler } from 'aws-lambda';
import fetch from 'node-fetch';

export const handler: Handler = async (event) => {
  try {
    const word = event.queryStringParameters?.word;
    
    if (!word) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Word parameter is required' })
      };
    }

    const response = await fetch(`https://api.datamuse.com/words?sp=${word}&max=1`);
    const data = await response.json();
    
    const isValidWord = data.length > 0 && data[0].word.toLowerCase() === word.toLowerCase();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        isValid: isValidWord,
        word: word
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};