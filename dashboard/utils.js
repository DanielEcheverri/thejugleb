// --- GPT API Constants ---
const GPT_MODEL_ENDPOINT = 'https://llm.ai.e-infra.cz/v1/chat/completions';
const GPT_MODEL_NAME = 'gpt-oss-120b';
const MAX_TOKENS = 350;

/**
 * Handles the GPT API call to the e-infra.cz endpoint with robust error handling.
 * Now includes API key validation.
 */
async function callGPTApi(prompt, apiKey) {
    if (!apiKey) {
        throw new Error("GPT API key is missing.");
    }

    try {
        const response = await fetch(GPT_MODEL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` 
            },
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

        if (!response.ok) {
            let status = response.status;
            let statusText = response.statusText;
            let errorData = `Status ${status}: ${statusText}`;
            
            try {
                const jsonError = await response.json();
                errorData = jsonError.detail || jsonError.error?.message || JSON.stringify(jsonError);
                console.error(`API FAIL (${status}): Received detailed JSON error.`, jsonError);
            } catch (e) {
                const textError = await response.text();
                errorData = textError || `No readable body content.`;
                console.error(`API FAIL (${status}): Received non-JSON body.`, textError);
            }
            
            throw new Error(`GPT API HTTP error: ${status}. Details: ${errorData}`);
        }

        const data = await response.json();
        const gptResponseText = data.choices[0]?.message?.content?.trim();
        
        if (!gptResponseText) {
            console.error("GPT API returned 200 OK but content was empty or unreadable:", data);
            throw new Error("GPT API response was empty or incorrectly formatted.");
        }
        
        return gptResponseText;
    } catch (error) {
        console.error("Error in callGPTApi:", error);
        throw error;
    }
}

/**
 * Helper function to safely get window variable with fallback
 */
function getWindowVar(varName, fallback = '') {
    return window[varName] || fallback;
}

/**
 * Generate a fallback comment when API fails
 */
function generateFallbackComment(character, context = {}) {
    const phrases = [
        `${character} continues through ${context.neighborhood || 'the area'}.`,
        `${character} moves along ${context.street || 'the path'}.`,
        `${character} takes in the surroundings of ${context.city || 'the city'}.`,
        `${character} keeps moving forward.`
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Generates immersive narrative comments for character movement through the environment.
 * Uses GPT API with fallback to generic comments on failure.
 */
window.makeComments = async function(character) {
    const apiKey = window.avatar_GPT;
    const sVar = SugarCube.State.variables;
    
    // Determine character prefix for variable names
    const isBaloo = (character.toLowerCase() === 'avatar' || character.toLowerCase() === 'baloo');
    const prefix = isBaloo ? 'avatar' : 'hachi';
    
    // Build context from window variables
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
    
    // Vary the sensory focus to ensure diverse outputs
    const sensoryFocus = ['sounds', 'smells', 'lighting', 'temperature', 'physical movement', 'atmosphere'];
    const randomFocus = sensoryFocus[Math.floor(Math.random() * sensoryFocus.length)];
    const uniqueID = Date.now();
    
    const userPrompt = `[Request ID: ${uniqueID}]

CONTEXT:
- Location: ${context.street} in ${context.neighborhood}, ${context.city}
- Environment: ${context.weather} sky, ${context.time}, Pollution: ${context.pollution}
- Speed: ${context.speed}
- Near: ${context.amenity}
- Transit: ${context.stop}, ${context.type} Route ${context.route} toward ${context.heading}

TASK:
Generate ONE brief environmental observation (max 2 sentences) describing what's happening AROUND ${context.char}.
${context.char} is NOT interacting with the environment - only observing it.
//Use EXACTLY TWO details from the CONTEXT above.

SENSORY FOCUS:
Prioritize the **${randomFocus}** of the scene.

OUTPUT STYLES (choose one):
- Style 1: |VS| [${context.char}'s brief internal observation] |VS| [Third-person environmental description mentioning ${context.char}]
- Style 2: [Single environmental description with ${context.char} as a reference point]

EXAMPLES:
- "|VS| 'The haze is thick today.' |VS| A layer of smog hung over the street where ${context.char} waited."
- "Bus exhaust mingles with food smells near ${context.char} at the busy stop."
- "|VS| 'Rush hour chaos.' |VS| Commuters hurried past ${context.char} under the evening sky."`;

    try {
        const gptResponse = await callGPTApi(userPrompt, apiKey);
        window[`${character}_comment`] = gptResponse;
        console.log(`[Realism Update] ${character} (Focus: ${randomFocus}):`, gptResponse);
    } catch (error) {
        console.error(`GPT Error for ${character}:`, error);
        const fallback = generateFallbackComment(character, context);
        window[`${character}_comment`] = fallback;
        console.log(`[Fallback Comment] ${character}:`, fallback);
    }
};

/**
 * Generates short feedback comments for failed tactical movements.
 * Uses GPT API with fallback to generic message on failure.
 */
window.makeShortComments = async function(charname, movement) {
    const apiKey = window.avatar_GPT;
    const uniqueID = Date.now();
    
    const userPrompt = `[Request ID: ${uniqueID}]

Your goal is to provide short, discouraging yet encouraging feedback on a failed movement attempt.

Context: ${charname} performed "${movement}", but it was the wrong tactical choice.

Choose ONE style for the output:
- Style 1: |VS| [Short first-person thought] |VS| [Third-person narration including "${charname}" and "${movement}" that concludes the first-person thought]
- Style 2: [A single third-person narration including "${charname}" and "${movement}"]

RULES:
- Do NOT start the narration with "${charname} tried to"
- Focus on the move being the wrong choice for the situation
- Although using a narrative tone, keep the language simple
- Tone: Recognition that the move was the wrong choice for the moment

EXAMPLES:
- "|VS|'Not this move...' |VS| said ${charname} when noticing that current path didn't suit ${movement}."
- "A different approach would serve ${charname} better than that ${movement}."
- "|VS| 'Wrong timing!' |VS| screamed ${charname} since ${movement} wasn't the answer needed."`;

    try {
        const gptResponse = await callGPTApi(userPrompt, apiKey);
        window.avatar_shortComment = gptResponse;
        console.log(`[GPT] Generated comment for ${charname}:`, gptResponse);
    } catch (error) {
        console.error(`An error occurred during GPT API call for ${charname}:`, error);
        const fallbackMessage = `${charname} tried ${movement}, but nothing happened. Maybe you should try something else.`;
        window.avatar_shortComment = fallbackMessage;
        console.log(`[Fallback] Using default message for ${charname}`);
    }
};