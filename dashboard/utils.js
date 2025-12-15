console.log("Loading Utilities Functions...");

window.fetchJSONFile = async function(filename, cachedVariable) {
    const baseURL = 'https://danielecheverri.github.io/dashboard/'; // Specify the base URL for the fallback
    const fallbackFilename = baseURL + filename; // Create the fallback URL dynamically

    try {
        if (!cachedVariable) {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error('Primary fetch failed'); // Throw error if the response is not ok
            }
            let jsonData = await response.json(); // Fetch JSON data
            
            // Check if jsonData is null
            if (jsonData === null) {
                console.warn(`Primary file fetched but jsonData is null. Trying fallback: ${fallbackFilename}`);
                const fallbackResponse = await fetch(fallbackFilename);
                if (!fallbackResponse.ok) {
                    throw new Error('Fallback file also not found');
                }
                jsonData = await fallbackResponse.json(); // Fetch JSON data from fallback
                
                // Check again if jsonData is null
                if (jsonData === null) {
                    throw new TypeError('jsonData is null from both primary and fallback');
                }
            }
            cachedVariable = jsonData; // Cache the fetched JSON data in the specified variable
            return jsonData;
        } else {
            return cachedVariable; // Return cached data if available
        }
    } catch (err) {
        console.error('Error fetching JSON file:', err);
        return null;
    }
}

let sentencesSource = 'https://danielecheverri.github.io/dashboard/sentences.json';
let cachedSentences;
let characterData = {}; // Object to store data for each character
let storyComment;

// Function to start making comments for a character
window.makeComments = async function(character, key) {
    // Fetch JSON data
    const jsonData = await fetchJSONFile(sentencesSource, cachedSentences);
  	console.log("This is makeComments:"+character+key);

    // Extract data based on the character parameter
    const observes = jsonData[`${character}_${key}`];
    const soundscape = jsonData.soundscape;
    const approaching = jsonData.approaching;

    // Function to generate random sentences upfront and store them in an object
    const generateRandomSentences = (obj, count) => {
        let sentences = [];
        let keys = Object.keys(obj);
        while (sentences.length < count) {
            let key = keys[Math.floor(Math.random() * keys.length)];
            let sentence = obj[key];
            if (!sentences.includes(sentence)) {
                sentences.push(sentence);
            }
        }
        return sentences;
    };

    // Clear any existing interval timer and reset character data
    if (characterData[character]) {
        clearInterval(characterData[character].intervalId);
        delete characterData[character];
    }
  
    const approachingSentences = Object.values(approaching);
    const approachingFinal = approachingSentences[Math.floor(Math.random() * approachingSentences.length)];

    // Initialize character data
    characterData[character] = {};
    characterData[character].randomSentences = {};
    characterData[character].randomSentences.observes = generateRandomSentences(observes, 10);
    characterData[character].randomSentences.soundscape = generateRandomSentences(soundscape, 10);

    // Shuffle the arrays to ensure randomness
    characterData[character].randomSentences.observes = characterData[character].randomSentences.observes.sort(() => Math.random() - 0.5);
    characterData[character].randomSentences.soundscape = characterData[character].randomSentences.soundscape.sort(() => Math.random() - 0.5);

    // Initialize indices to track current position in arrays
    characterData[character].currentIndex = { observes: 0, soundscape: 0 };

    // Helper function to get the next sentence without repetition
    const getNextSentence = (type) => {
        let sentence;
        if (type === 'observes') {
            sentence = characterData[character].randomSentences.observes[characterData[character].currentIndex.observes];
            characterData[character].currentIndex.observes = (characterData[character].currentIndex.observes + 1) % characterData[character].randomSentences.observes.length;
        } else {
            sentence = characterData[character].randomSentences.soundscape[characterData[character].currentIndex.soundscape];
            characterData[character].currentIndex.soundscape = (characterData[character].currentIndex.soundscape + 1) % characterData[character].randomSentences.soundscape.length;
        }
        return sentence;
    };

  // Set up a timer to display a random sentence every 15 seconds
  characterData[character].intervalId = setInterval(() => {
      let randomSentence;
      if (variables()[`${character}_arriving`]) {
          randomSentence = approachingFinal;
        	stopComments(`${character}`);
      } else {
          const randomType = Math.random() < 0.5 ? 'observes' : 'soundscape';
          randomSentence = getNextSentence(randomType);
      }
      variables()[`${character}_comment`] = randomSentence;
  }, 15000); // 15000 milliseconds = 15 seconds
};

// Function to stop making comments for a character
window.stopComments = function(character) {
    if (characterData[character]) {
        clearInterval(characterData[character].intervalId);
        delete characterData[character];
    }
  	console.log("Stopping comments");
};

// let cachedShortSentences;

// // Simplified function to get a random sentence that is not the last one used
// window.makeShortComments = async function(character, key) {
//     try {
//         // Fetch JSON data
//         const jsonData = await fetchJSONFile(sentencesSource, cachedShortSentences);

//         // Extract sentences based on character and key
//         const observes = jsonData[`${character}_${key}`];
//         if (!observes) {
//             console.error(`No sentences found for ${character}_${key}`);
//             return;
//         }

//         // Get all sentence keys and choose a random one
//         const sentenceKeys = Object.keys(observes);
//         let newSentence;
        
//         // Repeat until a different sentence is chosen
//         do {
//             const randomKey = sentenceKeys[Math.floor(Math.random() * sentenceKeys.length)];
//             newSentence = observes[randomKey];
//         } while (newSentence === variables()[`${character}_shortComment`]);

//         // Store the selected sentence
//         variables()[`${character}_shortComment`] = newSentence;
//         console.log(`Selected new comment for ${character}:`, newSentence);

//     } catch (error) {
//         console.error("An error occurred:", error);
//     }
// };

// --- GPT API Constants (kept here for context) ---
const GPT_MODEL_ENDPOINT = 'https://chat.ai.e-infra.cz/api/'; 
const GPT_MODEL_NAME = 'gpt-oss-120b';
const MAX_TOKENS = 100;

/**
 * Handles the GPT API call to the e-infra.cz endpoint.
 * This function is now fully implemented with fetch logic.
 */
async function callGPTApi(prompt, apiKey) {
    try {
        const response = await fetch(GPT_MODEL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` // Using the key from $avatar_GPT
            },
            // Using the standard Chat Completions API payload structure
            body: JSON.stringify({
                model: GPT_MODEL_NAME,
                messages: [
                    {
                        // System instruction to guide the AI's persona
                        role: "system",
                        content: "You are a concise, third-person narrator for a Twine game. Your goal is to provide short, discouraging yet encouraging feedback on a failed movement attempt."
                    },
                    {
                        // User message contains the dynamically generated prompt
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: MAX_TOKENS,
                temperature: 0.7 // Set a moderate temperature for creative but reliable output
            })
        });

        // Check for HTTP errors (e.g., 401 Unauthorized, 404 Not Found)
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'No error message available' }));
            console.error('API Error Response:', errorData);
            throw new Error(`GPT API HTTP error: ${response.status} (${response.statusText}). Details: ${errorData.message}`);
        }

        const data = await response.json();
        
        // Extract the generated text from the standard chat API response structure
        const gptResponseText = data.choices[0]?.message?.content?.trim();

        if (!gptResponseText) {
            throw new Error("GPT API response was empty or incorrectly formatted.");
        }

        return gptResponseText;

    } catch (error) {
        // Re-throw the error to be caught by the makeShortComments function
        console.error("Error in callGPTApi:", error);
        throw error;
    }
}


// The main function with explicit debug logs
window.makeShortComments = async function(character, key) {
    console.log("Entering GPT - Debug Start");

    try {
        console.log("Before apiKey fetch: Starting variable retrieval.");
        
        // The likely problematic line if 'variables' is not recognized
        const apiKey = avatar_GPT; 
        
        console.log("After apiKey fetch. Key presence:", !!apiKey); // This line will NOT run if the line above throws the ReferenceError
        
        const avatarName = avatar_name || 'The character'; 
        const movement = avatar_movement || 'an unknown movement';
        
        if (!apiKey) {
             console.error("GPT API key ($avatar_GPT) is missing. Using fallback comment.");
             throw new Error("GPT API key is required to use this function.");
        }
        
        // ... rest of the logic ...
        const prompt = `${avatarName} just performed the movement "${movement}". Generate the short narrative sentence.`;
        const gptResponse = await callGPTApi(prompt, apiKey);

        variables()[`${character}_shortComment`] = gptResponse;
        console.log(`[GPT] Generated comment for ${character}:`, gptResponse);

    } catch (error) {
        console.error("An error occurred during GPT API call:", error);
        
        // We MUST use window.variables() in the error handler if the function is undefined
        const safeVariables = typeof window.variables === 'function' ? window.variables() : {};
        const fallbackMessage = `${safeVariables.avatar_name || 'The character'} tried to ${safeVariables.avatar_movement || 'move'}, but the comment system failed. Try a different movement.`;
        
        // This line would also need the explicit prefix if the error is a ReferenceError
        if (typeof window.variables === 'function') {
            window.variables()[`${character}_shortComment`] = fallbackMessage;
        }
    }
};