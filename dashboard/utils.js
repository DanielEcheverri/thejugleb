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
                    { role: "system", content: "You are a concise, third-person narrator for a Twine game. Use simple, everyday language - not poetic or literary. Keep it casual and direct. Think like a regular person, not a writer" },
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
    const sensoryFocus = ['street sounds','parks and pets', 'street musicians', 'humidity and air quality','historical markers', 'urban smells', 'street lighting', 'crowd density', 'traffic noise', 'buildings', 'sidewalk activity','interesting architecture', 'storefront displays', 'street vendors', 'public transit sounds', 'intersection chaos', 'alleyway atmosphere', 'advertisement and signs', 'construction sites', 'pedestrian flow', 'street weather', 'urban decay', 'city rhythm'];
    const randomSFocus = sensoryFocus[Math.floor(Math.random() * sensoryFocus.length)];
    const uniqueID = Date.now();
    
    const userPrompt = `[Request ID: ${uniqueID}]

STORY CONTEXT:
${context.char} stands near ${context.stop} in ${context.neighborhood}, in the city of ${context.city} . 
The ${context.weather} sky hangs over ${context.street}. 
It's ${context.time}, there is ${context.pollution}.
There are some ${context.amenity} close.
The ${context.type} Route ${context.route} heads toward ${context.heading}.
${context.char} is walking ${context.speed}.

Write one **VERY, VERY SHORT** atmospheric moment focusing only on **${randomSFocus}**. ${context.char} observes, doesn't act.
Dont forget to use simple, almost third grade, everyday language - not poetic or literary. Keep it casual and direct.
You can include something, NOT ALL, from the **STORY CONTEXT.**

You can write it in two possible ways:
1. Just describe the scene around ${context.char}
2. An inner thought plus observation: |VS| 'Brief thought' |VS| what ${context.char} notices

Consider these four examples and their lenght:
1. "|VS| 'Smells like rain,' |VS| said ${context.char} whiel steam rises from the warm asphalt."
2. "Neon signs flicker in puddles by ${context.char}'s feet."
3. As the crowd surges, ${context.char} observes, "|VS| 'Too many people,' |VS|".
4. Around ${context.char}, conversations blend with the distant hum of traffic.`

    try {
        const gptResponse = await callGPTApi(userPrompt, apiKey);
        window[`${character}_comment`] = gptResponse;
        console.log(`[Realism Update] ${character} (Focus: ${randomSFocus}):`, gptResponse);
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
Dont forget to use simple, almost third grade, everyday language - not poetic or literary. Keep it casual and direct.

Context: ${charname} performed "${movement}", but it was the wrong choice.

Choose ONE style for the output:
- Style 1: |VS| [Short first-person thought] |VS| [Third-person narration including "${charname}" and "${movement}" that concludes the first-person thought]
- Style 2: [A single third-person narration including "${charname}" and "${movement}"]

RULES:
- Do NOT start the narration with "${charname} tried to"
- Focus on the move being the wrong choice for the situation
- Although using a narrative tone, keep the language simple
- Tone: Recognition that the move was the wrong choice for the moment

EXAMPLES:
- "|VS|'Not this move...' |VS| said ${charname} when noticing that ${movement} didnt do much."
- "A different approach would serve ${charname} better than ${movement}."
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

// window.loadSceneJSON = function(sceneId) {
//     SugarCube.State.variables.inScene = true;

//     var jsonPath = "https://danielecheverri.github.io/thejugleb/dashboard/scenes/" + sceneId + ".json";
//     console.log("[JSON Loader] Attempting to load: " + jsonPath);
    
//     $.getJSON(jsonPath)
//         .done(function(data) {
//             console.log("[JSON Loader] Success:", data);
            
//             // Store in setup
//             SugarCube.setup.sceneData = data;
            
//             // CHECK: Does the element exist?
//             console.log("[DEBUG] #logic_slot exists?", $("#logic_slot").length > 0);
            
//             // Inject engine
//             var snippet = '<<set _scene to setup.sceneData>>' + 
//                           '<<include "Logic_AvatarEngine">>';
            
//             $("#logic_slot").empty().wiki(snippet);
            
//             // CHECK: What was injected?
//             console.log("[DEBUG] #logic_slot HTML:", $("#logic_slot").html());
//         })
//         .fail(function(jqxhr, textStatus, error) {
//             console.error("[JSON Loader] FAILED:", textStatus, error);
//             $("#logic_slot").html("<div style='color:red;'>Failed to load scene: " + sceneId + "</div>");
//         });
// };

window.loadScene = function(filename) {
    var containerId = "avatar_story";
    var basePath = "https://danielecheverri.github.io/thejugleb/dashboard/scenes/";

    console.log("[Debug] 1. Function called for: " + filename);

    var runLoader = function() {
        console.log("[Debug] 2. Container found. Fetching...");
        var container = document.getElementById(containerId);
        
        // VISUAL DEBUG: Add a red border so we can see if the div survives
        container.style.border = "2px solid red"; 

        fetch(basePath + filename)
            .then(function(response) {
                if (!response.ok) throw new Error("Scene missing");
                return response.json();
            })
            .then(function(data) {
                console.log("[Debug] 3. JSON Loaded. Injecting Engine...");
                
                // Set global to ensure persistence
                State.variables.loaded_scene_data = data;
                
                // Inject
                $(container).empty().wiki('<<set _scene to $loaded_scene_data>><<include "Logic_AvatarEngine">>');
                
                console.log("[Debug] 4. Injection Complete.");
            })
            .catch(function(error) {
                console.error("[Debug] ERROR:", error);
            });
    };

    if (document.getElementById(containerId)) {
        runLoader();
    } else {
        console.log("[Debug] Container not ready. Waiting for :passagedisplay");
        $(document).one(":passagedisplay", runLoader);
    }
};