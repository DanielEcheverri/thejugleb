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

// --- GPT API Constants (kept here for context) ---
const GPT_MODEL_ENDPOINT = 'https://llm.ai.e-infra.cz/v1/chat/completions';
const GPT_MODEL_NAME = 'gpt-oss-120b';
const MAX_TOKENS = 250;

/**
 * Handles the GPT API call to the e-infra.cz endpoint with robust error handling.
 */
async function callGPTApi(prompt, apiKey) {
    // We assume the user has placed the fix for window.variables elsewhere
    
    try {
        const response = await fetch(GPT_MODEL_ENDPOINT, {
            method: 'POST',
            mode: 'cors', // Ensure CORS is explicitly set
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` // Using the key from $avatar_GPT
            },
            // Using the standard Chat Completions API payload structure
            body: JSON.stringify({
                model: GPT_MODEL_NAME,
                messages: [
                    { role: "system", content: "You are a concise, third-person narrator for a Twine game. Your goal is to provide short, discouraging yet encouraging feedback on a failed movement attempt." },
                    { role: "user", content: prompt }
                ],
                max_tokens: MAX_TOKENS,
                temperature: 1 
            })
        });
        
        // --- CRITICAL DEBUGGING STEP ---
        if (!response.ok) {
            let status = response.status;
            let statusText = response.statusText;
            let errorData = `Status ${status}: ${statusText}`;

            try {
                // Try to read JSON data for detailed error messages (common with APIs)
                const jsonError = await response.json();
                errorData = jsonError.detail || jsonError.error?.message || JSON.stringify(jsonError);
                console.error(`API FAIL (${status}): Received detailed JSON error.`, jsonError);
            } catch (e) {
                // If it's not JSON, read it as text
                const textError = await response.text();
                errorData = textError || `No readable body content.`;
                console.error(`API FAIL (${status}): Received non-JSON body.`, textError);
            }

            // Throw the specific error details
            throw new Error(`GPT API HTTP error: ${status}. Details: ${errorData}`);
        }
        // --- END CRITICAL DEBUGGING STEP ---

        const data = await response.json();
        
        // Extract the generated text
        const gptResponseText = data.choices[0]?.message?.content?.trim();
        
        if (!gptResponseText) {
            // This catches a 200 OK response with an empty content field
            console.error("GPT API returned 200 OK but content was empty or unreadable:", data);
            throw new Error("GPT API response was empty or incorrectly formatted.");
        }

        return gptResponseText;

    } catch (error) {
        // Re-throw the error to be caught by the makeShortComments function
        console.error("Error in callGPTApi:", error);
        throw error;
    }
}

window.makeShortComments = async function(charname, movement) {
    try {
        const apiKey = avatar_GPT; 
        
        if (!apiKey) {
             console.error("GPT API key (avatar_GPT) is missing. Using fallback comment.");
             throw new Error("GPT API key is required to use this function.");
        }
        
        // Prepare the user prompt based on the arguments.
       const userPrompt = `
        Context: ${charname} performed "${movement}", but it was the wrong tactical choice.

        Choose ONE style for the output:
        Style 1: |VS| [Short first-person thought] |VS| [ followeed by a Third-person narration including "${charname}" and "${movement}" that concludes the first-person thought.]
        Style 2: [A single third-person narration including "${charname}" and "${movement}"]

        RULES:
        - Do NOT start the narration with "${charname} tried to".
        - Focus on the move being the wrong choice for the situation.
        - Tone: Recognition that the move was the wrong choice for the moment.

        EXAMPLES:
        - "|VS|'Not this move...' |VS| said ${charname} when noticing that current path didn't suit ${movement}."
        - "A different approach would serve ${charname} better than that ${movement}."
        - "|VS| 'Wrong timing!' |VS| screamed ${charname} since ${movement} wasn't the answer needed."
        `;

        // Call the API
        const gptResponse = await callGPTApi(userPrompt, apiKey);

        // Target variable is hardcoded to 'avatar_shortComment'
        const targetVarName = `avatar_shortComment`; 
        window[targetVarName] = gptResponse; 
        console.log(`[GPT] Generated comment for ${charname}:`, gptResponse);

    } catch (error) {
        console.error("An error occurred during GPT API call:", error);
        
        // Use the arguments for the fallback message
        const safeName = charname;
        const safeMovement = movement;
        
        const fallbackMessage = `${safeName} tried ${safeMovement}, but nothing happened. Maybe you should try something else.`;
        
        // Target variable for fallback is also hardcoded to 'avatar_shortComment'
        const targetVarName = `avatar_shortComment`; 
        window[targetVarName] = fallbackMessage;
    }
};
