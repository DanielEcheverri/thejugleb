window.writeToAvatar = function(databaseNode, avatarData) {
    const avatarRef = firebase.database().ref(avatarDatabase + databaseNode);
    return avatarRef.set(avatarData)
        .then(() => {
            console.log("Successfully updated " + avatarData + " in " + avatarDatabase + " node " + databaseNode);
        })
        .catch(error => {
            console.error("Error updating data:", error);
            throw error; // Re-throw the error to be caught by the caller
        });
}
  
window.writeToHachi = function(databaseNode, hachiData) {
    const hachiRef = firebase.database().ref(hachiDatabase + databaseNode);
    return hachiRef.set(hachiData)
        .then(() => {
            console.log("Successfully updated " + hachiData + " in " + hachiDatabase + " node " + databaseNode);
        })
        .catch(error => {
            console.error("Error updating data:", error);
            throw error; // Re-throw the error to be caught by the caller
        });
}

var avatar_street = "none";
var street_radious = 100;
window.fetchStreetName = function (latitude, longitude) {
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
                setTimeout(checkCoordinates, 300); // Check again after 300 milliseconds
            }
        };
        checkCoordinates();
    })
    .then(() => {
        // Construct the Nominatim API query URL
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

        // Fetch data from Nominatim API
        return fetch(nominatimUrl);
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then((data) => {
        // Extract the street name from the Nominatim response
        if (data.address && data.address.road) {
            avatar_street = data.address.road;
            return data.address.road; // Return the road/street name
        } else if (data.address && data.address.street) {
            avatar_street = data.address.street;
            return data.address.street; // Fallback if 'street' is used
        } else {
            throw new Error("Street name not found");
        }
    })
    .catch((error) => {
        console.error("Error fetching street name:", error);
        return "an unknown";
    });
};

  
var weatherDescription = null;

window.fetchWeather=function(latitude, longitude) {
    // Define a promise to fetch weather description
    const weatherPromise = new Promise((resolve, reject) => {
      const checkCoordinates = () => {
        if (typeof latitude !== "undefined" && typeof longitude !== "undefined" && latitude !== 0 && longitude !== 0) {
          resolve();
        } else {
          console.log("Fetching location");
          setTimeout(checkCoordinates, 100); // Check again after 100 milliseconds
        }
      };
      checkCoordinates();
    })
    .then(() => {
      const apiKey = '21b99074efb73ba35f476f78f1b018ec';
      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;
      // Fetch data from OpenWeather API
      return fetch(apiUrl);
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      return response.json();
    })
    .then(data => {
      // Extract the weather description and store it globally
      weatherDescription = data.weather[0].description;
      return weatherDescription;
    })
    .catch(error => {
      console.error('Error fetching weather data:', error);
      throw error; // Rethrow the error to be caught by the caller if needed
    });

    // Log the weather promise to the console
    console.log("Fetching weather data...");

    // Use the weather promise elsewhere in your code if needed
    weatherPromise.then((weatherDescription) => {
      console.log("Weather description:", weatherDescription);
    });

    // Return the weather promise
    return weatherPromise;
}

var airPollutionData = null;
window.fetchPollution = function(latitude, longitude) {
  return new Promise((resolve, reject) => {
    const apiKey = '21b99074efb73ba35f476f78f1b018ec';
    const apiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;

    // Fetch data from OpenWeather API
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch air pollution data');
        }
        return response.json();
      })
      .then(data => {
        // Extract the AQI value
        const aqiValue = data.list[0].main.aqi;

        // Map the AQI value to a qualitative description
        let qualitativeDescription;
        switch (aqiValue) {
          case 1:
            qualitativeDescription = 'fresh air';
            break;
          case 2:
            qualitativeDescription = 'clean air';
            break;
          case 3:
            qualitativeDescription = 'slightly hazy air';
            break;
          case 4:
            qualitativeDescription = 'smokey air';
            break;
          case 5:
            qualitativeDescription = 'thick polluted air';
            break;
          default:
            qualitativeDescription = 'air';
        }

        // Resolve the promise with the qualitative description
		console.log(qualitativeDescription);
        resolve(qualitativeDescription);
      })
      .catch(error => {
        console.error('Error fetching air pollution data:', error);
        reject(error); // Reject the promise if there's an error
      });
  });
}
  
// Function to determine if it's day or night
window.getTimeOfDay=function() {
      var currentTime = new Date().getHours();
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
  
var tripHeadSign;
var routeShortName;
var departureTime;
var stopName;
var stopRadius = 400;
  
window.fetchStops = async function(latitude, longitude) {
  const apiKey = 'gYW4HBUHK9kB5j8wDxwxGglMKrWl9P9J';
  const routeTypeMapping = {
    0: 'Tram',
    1: 'Metro',
    2: 'Train',
    3: 'Bus',
    4: 'Ferry',
    5: 'Cable tram',
    6: 'Cable car',
    7: 'Funicular',
    11: 'Trolleybus',
    12: 'Monorail'
  };

  try {
    // API URL for the first call to get closest stops
    const closestStopsUrl = `https://api.transit.land/api/v2/rest/stops?lon=${longitude}&lat=${latitude}&radius=${stopRadius}&apikey=${apiKey}`;

    // First API call to get closest stops
    const closestStopsResponse = await fetch(closestStopsUrl);
    const closestStopsData = await closestStopsResponse.json();
    const stops = closestStopsData.stops;

    // Find the first entry where location_type is equal to 0
    const firstStopWithType0 = stops.find(stop => stop.location_type === 0);

    // Check if such entry exists
    if (!firstStopWithType0) {
      console.error('No stop with location_type equal to 0 found');
       return {
        tripHeadSign: "to the airport",
        routeShortName: "six",
        stopName: "closest",
        routeType: "route"
      };
    }

    const onestop_id = firstStopWithType0.onestop_id;

    // API URL for the second call to get departures
    const departuresUrl = `https://api.transit.land/api/v2/rest/stops/${onestop_id}/departures?apikey=${apiKey}&limit=1`;

    // Second API call to get departures
    const departuresResponse = await fetch(departuresUrl);
    const departuresData = await departuresResponse.json();
    const departures = departuresData.stops[0]?.departures || [];
    

    // Check if departures exist
    if (departures.length === 0) {
      console.error('No departures found for the stop');
      return {
        tripHeadSign: "to the airport",
        routeShortName: "six",
        stopName: firstStopWithType0.stop_name || "closest",
        routeType: "route" // Default value
      };
    }

    // Extract relevant departure information
    const firstDeparture = departures[0];
    const tripHeadSign = firstDeparture.trip.trip_headsign;
    const routeShortName = firstDeparture.trip.route.route_short_name;
    const stopName = firstStopWithType0.stop_name;
    const routeType = routeTypeMapping[firstDeparture.trip.route.route_type] || 'route';
    
    //return  information 
    return {
        tripHeadSign: tripHeadSign || "to the airport",      // Default if tripHeadSign is missing or null
        routeShortName: routeShortName || "six",            // Default if routeShortName is missing or null
        stopName: stopName || "closest",                    // Default if stopName is missing or null
        routeType: routeType || "route"                     // Default if routeType is missing or null
    };
  } catch (error) {
    // Handle errors
    console.error('Error fetching data:', error);
      return {
        tripHeadSign: "to the airport",
        routeShortName: "six",
        stopName: "closest",
        routeType: "route"
      };
  }
};


window.fetchSpeed = function(speed) {
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
  
window.fetchAmenity = function(latitude, longitude) {
    return new Promise((resolve, reject) => {
        const checkCoordinates = () => {
            if (typeof latitude !== "undefined" && typeof longitude !== "undefined" && latitude !== 0 && longitude !== 0) {
                resolve();
            } else {
                setTimeout(checkCoordinates, 300); // Check again after 300 milliseconds
            }
        };
        checkCoordinates();
    })
    .then(() => {
        // Construct Overpass API query to find the first amenity within 100 meters
        var overpassQuery = "https://overpass-api.de/api/interpreter?data=[out:json];node(around:100," + latitude + "," + longitude + ")[amenity];out body qt 1;";
        // Fetch data from Overpass API
        return fetch(overpassQuery);
    })
    .then((response) => response.json())
    .then((data) => {
        // Loop through elements to find the first amenity
        for (let i = 0; i < data.elements.length; i++) {
            const element = data.elements[i];
            if (element.tags && element.tags['amenity']) {
                return element.tags['amenity']; // Found, return amenity type
            }
        }
        // If no amenity is found, throw an error.
        //throw new Error("No amenity found nearby");
    	return "an odd window";
    })
    .catch((error) => {
        // Handle errors
        console.error("Error fetching amenity:", error);
    });
};

  
window.fetchCity = function(latitude, longitude) {
  const format = "json"; // You can specify the format as json

  // Construct the URL for the Nominatim reverse geocoding API
  const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=${format}&lat=${latitude}&lon=${longitude}`;

  // Make a GET request to the Nominatim reverse geocoding API
  return fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
    	let city = "the city";
    	let neighborhood = "the neighborhood";
      // Check if the response contains any results
      if (data && data.address) {
        city = data.address.city || data.address.town ||data.address.county || data.address.village || data.address.hamlet;
        neighborhood = data.address.neighbourhood || data.address.suburb || data.address.quarter || data.address.locality;
        return { city, neighborhood }; // Return an object containing city and neighborhood 
        
      } else {
        return { city: "the city", neighborhood: "the neighborhood" };
        console.error("No results found");
      }
    })
    .catch(error => {
      console.error("Error fetching data: " + error.message);
    });
};

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

let cachedShortSentences;

// Simplified function to get a random sentence that is not the last one used
window.makeShortComments = async function(character, key) {
    try {
        // Fetch JSON data
        const jsonData = await fetchJSONFile(sentencesSource, cachedShortSentences);

        // Extract sentences based on character and key
        const observes = jsonData[`${character}_${key}`];
        if (!observes) {
            console.error(`No sentences found for ${character}_${key}`);
            return;
        }

        // Get all sentence keys and choose a random one
        const sentenceKeys = Object.keys(observes);
        let newSentence;
        
        // Repeat until a different sentence is chosen
        do {
            const randomKey = sentenceKeys[Math.floor(Math.random() * sentenceKeys.length)];
            newSentence = observes[randomKey];
        } while (newSentence === variables()[`${character}_shortComment`]);

        // Store the selected sentence
        variables()[`${character}_shortComment`] = newSentence;
        console.log(`Selected new comment for ${character}:`, newSentence);

    } catch (error) {
        console.error("An error occurred:", error);
    }
};
  
