console.log("Loaded");

var tripHeadSign;
var routeShortName;
var departureTime;
var stopName;
var stopRadius = 400;

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