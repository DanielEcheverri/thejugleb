console.log("Loaded");

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