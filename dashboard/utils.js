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