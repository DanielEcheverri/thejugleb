// --- GPT API Constants ---
const GPT_MODEL_ENDPOINT = 'https://llm.ai.e-infra.cz/v1/chat/completions';
const GPT_MODEL_NAME = 'gpt-oss-120b';
const MAX_TOKENS = 450;

/**
 * Handles the GPT API call to the e-infra.cz.
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
                    { role: "system", content: "You generate atmospheric narrative moments for a Twine game. Your job is NOT to produce the most typical or expected observation — instead, sample freely from the full range of possible moments a character might experience. Avoid the first thing that comes to mind. Use simple, everyday language — not poetic or literary. Think like a regular person noticing something specific, not a writer crafting a scene." },
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

    const isBaloo = (character.toLowerCase() === 'avatar' || character.toLowerCase() === 'baloo');
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

    const sensoryFocus = [
        'street sounds', 'parks and pets', 'street musicians', 'humidity and air quality',
        'historical markers', 'urban smells', 'street lighting', 'crowd density',
        'traffic noise', 'buildings', 'sidewalk activity', 'interesting architecture',
        'storefront displays', 'street vendors', 'public transit sounds', 'intersection chaos',
        'alleyway atmosphere', 'advertisement and signs', 'construction sites',
        'pedestrian flow', 'street weather', 'urban decay', 'city rhythm'
    ];
    const randomSFocus = sensoryFocus[Math.floor(Math.random() * sensoryFocus.length)];

    const examples = [
        `"|VS| 'Smells like rain,' |VS| said ${context.char} while steam rises from the warm asphalt."`,
        `"Neon signs flicker in puddles by ${context.char}'s feet."`,
        `As the crowd surges, ${context.char} observes and says, "|VS| 'Too many people,' |VS|".`,
        `Around ${context.char}, conversations blend with the distant hum of traffic.`,
        `"|VS| 'Things look pretty nice around ${context.street} street'," |VS| said ${context.char} while walking ${context.neighborhood}.`,
        `${context.char} hears ${context.type} number ${context.route} past ${context.stop} station.`,
        `There is some construction going on ${context.street} street. That distracts ${context.char} a bit.`,
        `"|VS| '${context.street} street looks good,'" |VS| ${context.char} notes, strolling through ${context.neighborhood}.`,
        `"|VS| Even King Louie's ruins felt more alive than the quiet ${context.neighborhood} stone huts", |VS| noted ${context.char}.`,
        `"|VS| Colonel Hathi makes a mess when he marches, but these ${context.city} humans keep their paths much cleaner."`,
        `"|VS| The Law of Akela provided a family, but ${context.city} offers a feast every single ${context.time}."`,
        `A hanging coiled rope makes ${context.char} jump, mistaking it for the treacherous Kaa.`,
        `A man bringing home a heavy crate reminds ${context.char} of the strength of Rama.`,
        `${context.char} watches children splash water, reminded of the Cubs tumbling in the summer rain.`,
        `"|VS| This ground is far too stubborn for a proper nap." — ${context.char} prods a cobblestone.`,
        `"|VS| That giant man-cub hasn't moved, Mowgli." — ${context.char} waved their paw at an advertisement.`
    ];
    const shuffledExamples = examples.slice().sort(() => Math.random() - 0.5);

    const uniqueID = Date.now();
    const userPrompt = `[Request ID: ${uniqueID}]
STORY CONTEXT:
${context.char} stands near ${context.stop} in ${context.neighborhood}, in the city of ${context.city}.
The ${context.weather} sky hangs over ${context.street}.
It's ${context.time}, there is ${context.pollution}.
There are some ${context.amenity} close.
The ${context.type} Route ${context.route} heads toward ${context.heading}.
${context.char} is walking ${context.speed}.
Generate 5 possible atmospheric moments focusing only on **${randomSFocus}**. ${context.char} observes, doesn't act.
Use simple, almost third grade, everyday language - not poetic or literary. Keep it casual and direct.
You can include something, NOT ALL, from the **STORY CONTEXT.**
You can write each in two possible ways:
1. Just describe the scene around ${context.char}
2. An inner thought plus observation: |VS| 'Brief thought' |VS| what ${context.char} notices
Consider these examples and their length:
${shuffledExamples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}
Return a JSON object with key "responses" (list of dicts). Each dict must include:
- "text": the narrative moment string only, no extra explanation.
- "probability": estimated probability from 0.0 to 1.0 relative to the full distribution. Do NOT assign equal probabilities — vary them to reflect how likely each response is.
Give ONLY the JSON object, no extra text.`;

    // VS probability-weighted sampling
    function sampleFromCandidates(candidates) {
        const total = candidates.reduce((sum, c) => sum + (c.probability || 0), 0);
        if (total <= 0) return candidates[Math.floor(Math.random() * candidates.length)].text;
        let r = Math.random() * total;
        for (const candidate of candidates) {
            r -= (candidate.probability || 0);
            if (r <= 0) return candidate.text;
        }
        return candidates[candidates.length - 1].text;
    }

    try {
        const gptResponse = await callGPTApi(userPrompt, apiKey);
        console.log(`[GPT] Generated comment:`, gptResponse);
        // Strip markdown fences if present, then parse JSON
        const clean = gptResponse.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        const candidates = parsed.responses;

        if (!candidates || candidates.length === 0) {
            throw new Error("VS response had no candidates.");
        }

        const selected = sampleFromCandidates(candidates);
        window.avatar_comment = selected;
        console.log(`[VS Comment] ${character} (Focus: ${randomSFocus}) — Candidates: ${candidates.length}`, candidates);
        console.log(`[VS Selected]`, selected);

    } catch (error) {
        console.error(`GPT/VS Error for ${character}:`, error);
        const fallback = generateFallbackComment(character, context);
        window.avatar_comment = fallback;
        console.log(`[Fallback Comment] ${character}:`, fallback);
    }
};

/**
 * Generates short feedback comments for failed tactical movements.
 * Uses GPT API with fallback to generic message on failure.
 */
window.makeShortComments = async function(charname, movement) {

    /* If busy, stop immediately */
    if (window.isCommentBusy === true) {
        console.log(`[Busy] Skipping comment for ${charname} because a request is already active.`);
        return; 
    }

    /* 2. SET LOCK */
    window.isCommentBusy = true;

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
    } finally {
        window.isCommentBusy = false;
    }
};

window.loadScene = function(passageName, character) {
    var baseURL = "https://danielecheverri.github.io/thejugleb/dashboard/scenes/";
    var url = baseURL + passageName + ".json";
    var data = null;

    // Fetch the file synchronously
    $.ajax({
        url: url,
        dataType: "json",
        async: false, 
        success: function(json) {
            data = json;
        },
        error: function() {
            console.error("Could not load " + url);
        }
    });

    // Dynamically save the data to the character-prefixed temporary variable
    if (data) {
        if (character) {
            // Construct name: "hachi" becomes "hachiScene" -> creates _hachiScene
            var varName = character + "Scene";
            SugarCube.State.temporary[varName] = data;
        } else {
            // Default fallback if no character is passed
            SugarCube.State.temporary.scene = data;
        }
    }
};
