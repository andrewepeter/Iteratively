import { APIGatewayEvent, Handler } from 'aws-lambda';
import fetch from 'node-fetch';

// Define the type for the response data structure from the API
interface DatamuseResponse {
  word: string;
}

export const handler: Handler = async (event: APIGatewayEvent) => {
  try {
    const word = event.queryStringParameters?.word;

    if (!word) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Word parameter is required' }),
      };
    }

    // Fetch the data from the API and explicitly type the response as an array of DatamuseResponse
    const response = await fetch(`https://api.datamuse.com/words?sp=${word}&max=1`);
    
    // Explicitly type the JSON response
    const data: DatamuseResponse[] = await response.json() as DatamuseResponse[];

    const isValidWord = data.length > 0 && data[0].word.toLowerCase() === word.toLowerCase();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
      body: JSON.stringify({
        isValid: isValidWord,
        word: word,
      }),
    };
  } catch (error) {
    console.error('Error validating word:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
