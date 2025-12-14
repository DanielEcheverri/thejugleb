// --- Global Variables (Keep these outside of functions) ---
var avatar_street = "none";
var street_radious = 100;
var weatherDescription = null;
var airPollutionData = null;
var stopRadius = 400;
let sentencesSource = 'https://danielecheverri.github.io/dashboard/sentences.json';
let cachedSentences;
let cachedShortSentences;
let characterData = {}; // Object to store data for each character
let storyComment;
// Note: Removed unused globals like 'tripHeadSign', 'routeShortName', etc.

// --- Helper Functions ---

// 1. Function to write data to Firebase (used for avatar)
function writeToAvatar(databaseNode, avatarData) {
    const avatarRef = firebase.database().ref(avatarDatabase + databaseNode);
    return avatarRef.set(avatarData)
        .then(() => {
            console.log("Successfully updated " + avatarData + " in " + avatarDatabase + " node " + databaseNode);
        })
        .catch(error => {
            console.error("Error updating data:", error);
            throw error;
        });
}

// 2. Function to write data to Firebase (used for hachi)
function writeToHachi(databaseNode, hachiData) {
    const hachiRef = firebase.database().ref(hachiDatabase + databaseNode);
    return hachiRef.set(hachiData)
        .then(() => {
            console.log("Successfully updated " + hachiData + " in " + hachiDatabase + " node " + databaseNode);
        })
        .catch(error => {
            console.error("Error updating data:", error);
            throw error;
        });
}

// 3. Function to fetch JSON from a file with a fallback
async function fetchJSONFile(filename, cachedVariable) {
    const baseURL = 'https://danielecheverri.github.io/dashboard/';
    const fallbackFilename = baseURL + filename;

    try {
        if (!cachedVariable) {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error('Primary fetch failed');
            }
            let jsonData = await response.json();

            if (jsonData === null) {
                console.warn(`Primary file fetched but jsonData is null. Trying fallback: ${fallbackFilename}`);
                const fallbackResponse = await fetch(fallbackFilename);
                if (!fallbackResponse.ok) {
                    throw new Error('Fallback file also not found');
                }
                jsonData = await fallbackResponse.json();

                if (jsonData === null) {
                    throw new TypeError('jsonData is null from both primary and fallback');
                }
            }
            // Assign to the cached variable directly (requires passing a reference or modifying the global scope)
            // Since we can't easily modify a passed variable reference in JS, 
            // you might need to handle the caching in the calling function, 
            // or modify the original function to return the data and let the caller cache it.
            // For now, I'll keep the logic as-is, assuming 'cachedVariable' is meant to be a simple check.
            return jsonData;
        } else {
            return cachedVariable;
        }
    } catch (err) {
        console.error('Error fetching JSON file:', err);
        return null;
    }
}


// 4. Function to fetch the street name
function fetchStreetName(latitude, longitude) {
    return new Promise((resolve, reject) => {
        const checkCoordinates = () => {
            if (
                typeof latitude !== "undefined" &&
                typeof longitude !== "undefined" &&
                latitude !== 0 &&
                longitude !== 0
            ) {
                resolve();
            } else {
                setTimeout(checkCoordinates, 300);
            }
        };
        checkCoordinates();
    })
    .then(() => {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
        return fetch(nominatimUrl);
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then((data) => {
        if (data.address && data.address.road) {
            avatar_street = data.address.road;
            return data.address.road;
        } else if (data.address && data.address.street) {
            avatar_street = data.address.street;
            return data.address.street;
        } else {
            throw new Error("Street name not found");
        }
    })
    .catch((error) => {
        console.error("Error fetching street name:", error);
        return "an unknown";
    });
}

// 5. Function to fetch weather description
function fetchWeather(latitude, longitude) {
    const weatherPromise = new Promise((resolve, reject) => {
        const checkCoordinates = () => {
            if (typeof latitude !== "undefined" && typeof longitude !== "undefined" && latitude !== 0 && longitude !== 0) {
                resolve();
            } else {
                console.log("Fetching location");
                setTimeout(checkCoordinates, 100);
            }
        };
        checkCoordinates();
    })
    .then(() => {
        const apiKey = '21b99074efb73ba35f476f78f1b018ec';
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;
        return fetch(apiUrl);
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }
        return response.json();
    })
    .then(data => {
        weatherDescription = data.weather[0].description;
        console.log("Weather description:", weatherDescription);
        return weatherDescription;
    })
    .catch(error => {
        console.error('Error fetching weather data:', error);
        throw error;
    });

    console.log("Fetching weather data...");
    return weatherPromise;
}

// 6. Function to fetch air pollution data
function fetchPollution(latitude, longitude) {
    return new Promise((resolve, reject) => {
        const apiKey = '21b99074efb73ba35f476f78f1b018ec';
        const apiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch air pollution data');
                }
                return response.json();
            })
            .then(data => {
                const aqiValue = data.list[0].main.aqi;
                let qualitativeDescription;
                switch (aqiValue) {
                    case 1: qualitativeDescription = 'fresh air'; break;
                    case 2: qualitativeDescription = 'clean air'; break;
                    case 3: qualitativeDescription = 'slightly hazy air'; break;
                    case 4: qualitativeDescription = 'smokey air'; break;
                    case 5: qualitativeDescription = 'thick polluted air'; break;
                    default: qualitativeDescription = 'air';
                }
                console.log(qualitativeDescription);
                resolve(qualitativeDescription);
            })
            .catch(error => {
                console.error('Error fetching air pollution data:', error);
                reject(error);
            });
    });
}

// 7. Function to determine time of day
function getTimeOfDay() {
    const currentTime = new Date().getHours();
    if (currentTime >= 6 && currentTime < 9) {
        return "early morning";
    } else if (currentTime >= 9 && currentTime < 12) {
        return "morning";
    } else if (currentTime >= 12 && currentTime < 15) {
        return "noon";
    } else if (currentTime >= 15 && currentTime < 18) {
        return "afternoon";
    } else if (currentTime >= 18 && currentTime < 21) {
        return "evening";
    } else {
        return "night";
    }
}

// 8. Function to fetch transit stop information
async function fetchStops(latitude, longitude) {
    const apiKey = 'gYW4HBUHK9kB5j8wDxwxGglMKrWl9P9J';
    const routeTypeMapping = {
        0: 'Tram', 1: 'Metro', 2: 'Train', 3: 'Bus', 4: 'Ferry', 
        5: 'Cable tram', 6: 'Cable car', 7: 'Funicular', 
        11: 'Trolleybus', 12: 'Monorail'
    };

    try {
        const closestStopsUrl = `https://api.transit.land/api/v2/rest/stops?lon=${longitude}&lat=${latitude}&radius=${stopRadius}&apikey=${apiKey}`;
        const closestStopsResponse = await fetch(closestStopsUrl);
        const closestStopsData = await closestStopsResponse.json();
        const stops = closestStopsData.stops;

        const firstStopWithType0 = stops.find(stop => stop.location_type === 0);

        if (!firstStopWithType0) {
            console.error('No stop with location_type equal to 0 found');
            return {
                tripHeadSign: "to the airport", routeShortName: "six",
                stopName: "closest", routeType: "route"
            };
        }

        const onestop_id = firstStopWithType0.onestop_id;
        const departuresUrl = `https://api.transit.land/api/v2/rest/stops/${onestop_id}/departures?apikey=${apiKey}&limit=1`;
        const departuresResponse = await fetch(departuresUrl);
        const departuresData = await departuresResponse.json();
        const departures = departuresData.stops[0]?.departures || [];

        if (departures.length === 0) {
            console.error('No departures found for the stop');
            return {
                tripHeadSign: "to the airport", routeShortName: "six",
                stopName: firstStopWithType0.stop_name || "closest", routeType: "route"
            };
        }

        const firstDeparture = departures[0];
        const routeType = routeTypeMapping[firstDeparture.trip.route.route_type] || 'route';

        return {
            tripHeadSign: firstDeparture.trip.trip_headsign || "to the airport",
            routeShortName: firstDeparture.trip.route.route_short_name || "six",
            stopName: firstStopWithType0.stop_name || "closest",
            routeType: routeType
        };
    } catch (error) {
        console.error('Error fetching data:', error);
        return {
            tripHeadSign: "to the airport", routeShortName: "six",
            stopName: "closest", routeType: "route"
        };
    }
}


// 9. Function to map speed to a descriptive phrase
function fetchSpeed(speed) {
    if (speed <= 0.1) {
        return "very slowly";
    } else if (speed <= 0.3) {
        return " slowly";
    } else if (speed <= 0.6) {
        return " moderatly pace";
    } else if (speed <= 1.0) {
        return " briskly";
    } else if (speed <= 1.5) {
        return " quickly";
    } else {
        return " very fast";
    }
}

// 10. Function to fetch the closest amenity
function fetchAmenity(latitude, longitude) {
    return new Promise((resolve, reject) => {
        const checkCoordinates = () => {
            if (typeof latitude !== "undefined" && typeof longitude !== "undefined" && latitude !== 0 && longitude !== 0) {
                resolve();
            } else {
                setTimeout(checkCoordinates, 300);
            }
        };
        checkCoordinates();
    })
    .then(() => {
        var overpassQuery = "https://overpass-api.de/api/interpreter?data=[out:json];node(around:100," + latitude + "," + longitude + ")[amenity];out body qt 1;";
        return fetch(overpassQuery);
    })
    .then((response) => response.json())
    .then((data) => {
        for (let i = 0; i < data.elements.length; i++) {
            const element = data.elements[i];
            if (element.tags && element.tags['amenity']) {
                return element.tags['amenity'];
            }
        }
        return "an odd window";
    })
    .catch((error) => {
        console.error("Error fetching amenity:", error);
        return "an odd window"; // Ensure it returns a string even on error
    });
}

// 11. Function to fetch city and neighborhood name
function fetchCity(latitude, longitude) {
    const format = "json";
    const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=${format}&lat=${latitude}&lon=${longitude}`;

    return fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            let city = "the city";
            let neighborhood = "the neighborhood";
            if (data && data.address) {
                city = data.address.city || data.address.town || data.address.county || data.address.village || data.address.hamlet || city;
                neighborhood = data.address.neighbourhood || data.address.suburb || data.address.quarter || data.address.locality || neighborhood;
                return { city, neighborhood };
            } else {
                console.error("No results found");
                return { city: "the city", neighborhood: "the neighborhood" };
            }
        })
        .catch(error => {
            console.error("Error fetching data: " + error.message);
            return { city: "the city", neighborhood: "the neighborhood" };
        });
}

// 12. Function to start making comments for a character
async function makeComments(character, key) {
    const jsonData = await fetchJSONFile(sentencesSource, cachedSentences);
    console.log("This is makeComments:"+character+key);

    const observes = jsonData[`${character}_${key}`];
    const soundscape = jsonData.soundscape;
    const approaching = jsonData.approaching;

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

    if (characterData[character]) {
        clearInterval(characterData[character].intervalId);
        delete characterData[character];
    }
    
    const approachingSentences = Object.values(approaching);
    const approachingFinal = approachingSentences[Math.floor(Math.random() * approachingSentences.length)];

    characterData[character] = {};
    characterData[character].randomSentences = {};
    characterData[character].randomSentences.observes = generateRandomSentences(observes, 10);
    characterData[character].randomSentences.soundscape = generateRandomSentences(soundscape, 10);

    characterData[character].randomSentences.observes = characterData[character].randomSentences.observes.sort(() => Math.random() - 0.5);
    characterData[character].randomSentences.soundscape = characterData[character].randomSentences.soundscape.sort(() => Math.random() - 0.5);

    characterData[character].currentIndex = { observes: 0, soundscape: 0 };

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
    }, 15000);
}

// 13. Function to stop making comments for a character
function stopComments(character) {
    if (characterData[character]) {
        clearInterval(characterData[character].intervalId);
        delete characterData[character];
    }
    console.log("Stopping comments");
}

// 14. Simplified function to get a random short sentence
async function makeShortComments(character, key) {
    try {
        const jsonData = await fetchJSONFile(sentencesSource, cachedShortSentences);

        const observes = jsonData[`${character}_${key}`];
        if (!observes) {
            console.error(`No sentences found for ${character}_${key}`);
            return;
        }

        const sentenceKeys = Object.keys(observes);
        let newSentence;
        
        do {
            const randomKey = sentenceKeys[Math.floor(Math.random() * sentenceKeys.length)];
            newSentence = observes[randomKey];
        } while (newSentence === variables()[`${character}_shortComment`]);

        variables()[`${character}_shortComment`] = newSentence;
        console.log(`Selected new comment for ${character}:`, newSentence);

    } catch (error) {
        console.error("An error occurred:", error);
    }
}