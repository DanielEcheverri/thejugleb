(function(global) {
// Console log is now safe inside the function scope
console.log("Loading Fetch Functions...");

// --- Global Variables (Declared using 'var' or 'let/const' for local scope) ---
// Note: We use global.variableName for the few variables that MUST be globally accessible
// or must persist state. For Twine variables, use the 'variables()' macro access.

global.avatar_street = "none";
global.street_radious = 100;
global.weatherDescription = null;
global.airPollutionData = null;
global.stopRadius = 400;

// Removed unused global: tripHeadSign, routeShortName, departureTime, stopName

// --- Functions attached to the global object (window) ---

global.fetchAmenity = function(latitude, longitude) {
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
    	return "an odd window";
    })
    .catch((error) => {
        // Handle errors
        console.error("Error fetching amenity:", error);
        return "an odd window"; // Ensure a return value on error
    });
};

  
global.fetchCity = function(latitude, longitude) {
  const format = "json";

  const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=${format}&lat=${latitude}&lon=${longitude}`;

  return fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
    	let city = "the city";
    	let neighborhood = "the neighborhood";
      if (data && data.address) {
        city = data.address.city || data.address.town ||data.address.county || data.address.village || data.address.hamlet;
        neighborhood = data.address.neighbourhood || data.address.suburb || data.address.quarter || data.address.locality;
        return { city, neighborhood }; 
        
      } else {
        console.error("No results found");
        return { city: "the city", neighborhood: "the neighborhood" };
      }
    })
    .catch(error => {
      console.error("Error fetching data: " + error.message);
      return { city: "the city", neighborhood: "the neighborhood" }; // Ensure a return value on error
    });
};


global.fetchStreetName = function (latitude, longitude) {
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
            global.avatar_street = data.address.road;
            return data.address.road; 
        } else if (data.address && data.address.street) {
            global.avatar_street = data.address.street;
            return data.address.street; 
        } else {
            throw new Error("Street name not found");
        }
    })
    .catch((error) => {
        console.error("Error fetching street name:", error);
        return "an unknown";
    });
};

global.fetchSpeed = function(speed) {
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


global.fetchWeather=function(latitude, longitude) {
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
      global.weatherDescription = data.weather[0].description;
      return global.weatherDescription;
    })
    .catch(error => {
      console.error('Error fetching weather data:', error);
      throw error;
    });

    console.log("Fetching weather data...");

    weatherPromise.then((weatherDescription) => {
      console.log("Weather description:", weatherDescription);
    });

    return weatherPromise;
}


global.fetchPollution = function(latitude, longitude) {
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
  
global.getTimeOfDay=function() {
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
  
// Removed unused global variables: tripHeadSign, routeShortName, departureTime, stopName
  
global.fetchStops = async function(latitude, longitude) {
  const apiKey = 'gYW4HBUHK9kB5j8wDxwxGglMKrWl9P9J';
  const routeTypeMapping = {
    0: 'Tram', 1: 'Metro', 2: 'Train', 3: 'Bus', 4: 'Ferry',
    5: 'Cable tram', 6: 'Cable car', 7: 'Funicular',
    11: 'Trolleybus', 12: 'Monorail'
  };

  try {
    const closestStopsUrl = `https://api.transit.land/api/v2/rest/stops?lon=${longitude}&lat=${latitude}&radius=${global.stopRadius}&apikey=${apiKey}`;

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
        tripHeadSign: "to the airport",
        routeShortName: "six",
        stopName: firstStopWithType0.stop_name || "closest",
        routeType: "route"
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
        tripHeadSign: "to the airport",
        routeShortName: "six",
        stopName: "closest",
        routeType: "route"
      };
  }
};

// End of IIFE
})(window);