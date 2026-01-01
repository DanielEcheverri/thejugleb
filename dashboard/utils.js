console.log("Loading Utilities Functions...");

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
                    { role: "system", content: "You are a concise, third-person narrator for a Twine game." },
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

window.characterData = window.characterData || {};
window.makeComments = async function(character) {
    const apiKey = avatar_GPT;
    if (!apiKey) return;

    const sVar = SugarCube.State.variables;

    if (sVar[`${character}_arriving`]) {
        return;
    }

    const isBaloo = (character.toLowerCase() === 'avatar' || character === 'baloo');
    const prefix = isBaloo ? 'avatar' : 'hachi';
    
    const context = {
        char: character,
        street: window[`${prefix}_street`] || "the current path",
        neighborhood: sVar.storyNeighborhood || "this district",
        city: sVar.storyCity || "the city",
        weather: sVar.storyWeather || "changing",
        time: sVar.storyTime || "now",
        pollution: sVar.storyPollution || "variable",
        speed: sVar[`${prefix}_walking_speed`] || "normal",
        amenity: sVar[`${prefix}_amenity`] || "the surroundings",
        stop: sVar[`${prefix}_t_stop`],
        route: sVar[`${prefix}_t_route`],
        heading: sVar[`${prefix}_t_heading`],
        type: sVar[`${prefix}_t_type`]
    };

    // This ensures the prompt text is different every single time you run the function.
    const sensoryFocus = ['sounds', 'smells', 'lighting', 'temperature', 'physical movement', 'atmosphere'];
    const randomFocus = sensoryFocus[Math.floor(Math.random() * sensoryFocus.length)];
    const uniqueID = Date.now(); // A timestamp to break any API caching

    const userPrompt = `
        [Request ID: ${uniqueID}] 

        ACTUAL DATA:
        - Location: ${context.street} in ${context.neighborhood}, ${context.city}.
        - Environment: ${context.weather} sky, ${context.time}, Pollution Index: ${context.pollution}.
        - Movement: Moving ${context.speed} past a ${context.amenity}.
        - Transit Context: Standing at ${context.stop} for the ${context.type} (Route ${context.route}) heading toward ${context.heading}.

        TASK:
        Generate ONE immersive narrative comment (max 2 sentences) for ${context.char}.
        The comment MUST reference two specific details from the ACTUAL DATA.
        
        VARIATION REQUIREMENT:
        Prioritize describing the **${randomFocus}** of the scene.

        STYLES (Select one):
        - Style 1: |VS| [Internal thought about the data] |VS| [Narrator observation of ${context.char}]
        - Style 2: [A single descriptive sentence about ${context.char} and the surroundings]

    `;

    try {
        const gptResponse = await callGPTApi(userPrompt, apiKey);
        sVar[`${character}_comment`] = gptResponse;
        console.log(`[Realism Update] ${character} (Focus: ${randomFocus}):`, gptResponse);
    } catch (error) {
        console.error("GPT Error:", error);
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

// --- GPT API Constants ---
const GPT_MODEL_ENDPOINT = 'https://llm.ai.e-infra.cz/v1/chat/completions';
const GPT_MODEL_NAME = 'gpt-oss-120b';
const MAX_TOKENS = 250;

window.makeShortComments = async function(charname, movement) {
    try {
        const apiKey = avatar_GPT; 
        
        if (!apiKey) {
             console.error("GPT API key (avatar_GPT) is missing. Using fallback comment.");
             throw new Error("GPT API key is required to use this function.");
        }
        
        // Prepare the user prompt based on the arguments.
       const userPrompt = `
       Your goal is to provide short, discouraging yet encouraging feedback on a failed movement attempt. 
       Context: ${charname} performed "${movement}", but it was the wrong tactical choice.

        Choose ONE style for the output:
        Style 1: |VS| [Short first-person thought] |VS| [ followed by a Third-person narration including "${charname}" and "${movement}" that concludes the first-person thought.]
        Style 2: [A single third-person narration including "${charname}" and "${movement}"]

        RULES:
        - Do NOT start the narration with "${charname} tried to".
        - Focus on the move being the wrong choice for the situation.
        - Although using a narrative tone, keep the language simple.
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
