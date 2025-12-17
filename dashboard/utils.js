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

window.makeComments = async function(charname) {
    try {
        const apiKey = avatar_GPT;
        if (!apiKey) throw new Error("GPT API key missing.");

        // 1. Gather the data from your game state
        // This assumes your variables() and other getters are globally accessible
        const data = {
            weather: variables().storyWeather,
            time: variables().storyTime,
            city: variables().storyCity,
            neighborhood: variables().storyNeighborhood,
            pollution: variables().storyPollution,
            // Dynamic character-specific data
            speed: charname === 'Baloo' ? variables().avatar_walking_speed : variables().hachi_walking_speed,
            amenity: charname === 'Baloo' ? variables().avatar_amenity : variables().hachi_amenity,
            t_stop: charname === 'Baloo' ? variables().avatar_t_stop : variables().hachi_t_stop,
            t_route: charname === 'Baloo' ? variables().avatar_t_route : variables().hachi_t_route,
            t_heading: charname === 'Baloo' ? variables().avatar_t_heading : variables().hachi_t_heading,
            t_type: charname === 'Baloo' ? variables().avatar_t_type : variables().hachi_t_type,
            street: charname === 'Baloo' ? window.avatar_street : window.hachi_street
        };

        // 2. Build the immersive prompt
        const userPrompt = `
            Context: Describe a short background scene for ${charname} based on these current settings:
            - Location: ${data.neighborhood}, ${data.city} (Street: ${data.street})
            - Environment: ${data.weather}, ${data.time}, Pollution level: ${data.pollution}
            - Current Transit: At ${data.t_stop} (${data.t_type}), Route ${data.t_route} heading to ${data.t_heading}
            - Status: Moving at ${data.speed} speed, near a ${data.amenity}.

            TASK: Generate a 3-sentence max background scene using the |VS| format.
            - Part 1 (First-person): ${charname}'s internal thought about the environment or transit.
            - Part 2 (Third-person): A narrative description of the atmosphere surrounding ${charname}.

            RULES:
            - Format as: |VS| [Thought] |VS| [Narration]
            - Do not mention all data points; pick the most atmospheric ones to weave together.
            - The narration must include "${charname}".
        `;

        const gptResponse = await callGPTApi(userPrompt, apiKey);
        
        // Save to a different variable to avoid overwriting movement feedback
        window.avatar_backgroundScene = gptResponse;
        console.log(`[GPT Scene] for ${charname}:`, gptResponse);

    } catch (error) {
        console.error("Error generating scene:", error);
        window.avatar_backgroundScene = `|VS| "Another day in ${variables().storyCity}." |VS| ${charname} continues moving through the streets.`;
    }
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
                'Authorization': `Bearer ${apiKey}` 
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
