console.log("Loaded");

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