const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// --- Metro Data ---
// A comprehensive data structure for the Patna Metro network.
// This includes all stations, their corresponding lines, and interchange information.
const metroData = {
    stations: {
        // Line 1 Stations
        "Danapur Cantonment": { line: 1, interchange: false },
        "Saguna More": { line: 1, interchange: false },
        "RPS More": { line: 1, interchange: false },
        "Patliputra": { line: 1, interchange: false },
        "Rukanpura": { line: 1, interchange: false },
        "Raja Bazar": { line: 1, interchange: false },
        "Patna Zoo": { line: 1, interchange: false },
        "Vikas Bhawan": { line: 1, interchange: false },
        "Vidyut Bhawan": { line: 1, interchange: false },
        "Patna Junction": { line: 1, interchange: true },
        "Mithapur": { line: 1, interchange: false },
        "Ramkrishna Nagar": { line: 1, interchange: false },
        "Jaganpur": { line: 1, interchange: false },
        "Khemni Chak": { line: 1, interchange: true },

        // Line 2 Stations
        "New ISBT": { line: 2, interchange: false },
        "Zero Mile": { line: 2, interchange: false },
        "Bhoothnath": { line: 2, interchange: false },
        // "Khemni Chak" is already defined for Line 1, it serves as an interchange
        "Malahi Pakri": { line: 2, interchange: false },
        "Rajendra Nagar": { line: 2, interchange: false },
        "Moin Ul Haq Stadium": { line: 2, interchange: false },
        "Patna University": { line: 2, interchange: false },
        "PMCH": { line: 2, interchange: false },
        "Gandhi Maidan": { line: 2, interchange: false },
        "Akashvani": { line: 2, interchange: false },
        // "Patna Junction" is already defined for Line 1, it serves as an interchange
    },
    lines: {
        1: [
            "Danapur Cantonment", "Saguna More", "RPS More", "Patliputra",
            "Rukanpura", "Raja Bazar", "Patna Zoo", "Vikas Bhawan",
            "Vidyut Bhawan", "Patna Junction", "Mithapur", "Ramkrishna Nagar",
            "Jaganpur", "Khemni Chak"
        ],
        2: [
            "Patna Junction", "Akashvani", "Gandhi Maidan", "PMCH",
            "Patna University", "Moin Ul Haq Stadium", "Rajendra Nagar",
            "Malahi Pakri", "Khemni Chak", "Bhoothnath", "Zero Mile", "New ISBT"
        ]
    },
    interchanges: {
        "Patna Junction": [1, 2],
        "Khemni Chak": [1, 2]
    }
};

// --- Constants ---
// These constants are based on the provided system specifications and reasonable estimations.
const AVERAGE_SPEED_KMPH = 34;
const TIME_PER_STATION_MINS = 2; // Approximate time including stoppage
const COST_PER_STATION_INR = 5; // A hypothetical cost per station
const INTERCHANGE_TIME_MINS = 5; // Estimated time to change lines

/**
 * Finds the shortest route between two stations.
 * @param {string} startStation - The name of the starting station.
 * @param {string} endStation - The name of the destination station.
 * @returns {object|null} An object containing the route details or null if no path is found.
 */
function findRoute(startStation, endStation) {
    if (!metroData.stations[startStation] || !metroData.stations[endStation]) {
        return null; // Invalid station names
    }

    const startNode = metroData.stations[startStation];
    const endNode = metroData.stations[endStation];

    // --- Case 1: Same Line ---
    if (startNode.line === endNode.line) {
        const line = metroData.lines[startNode.line];
        const startIndex = line.indexOf(startStation);
        const endIndex = line.indexOf(endStation);
        const path = line.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
        if (startIndex > endIndex) path.reverse();

        return {
            path: path,
            interchanges: 0,
            changeAt: null
        };
    }

    // --- Case 2: Different Lines (Requires Interchange) ---
    let bestRoute = null;

    for (const interchangeStation in metroData.interchanges) {
        // Find path from start to interchange
        const line1 = metroData.lines[startNode.line];
        const startIndex1 = line1.indexOf(startStation);
        const interchangeIndex1 = line1.indexOf(interchangeStation);
        
        if (interchangeIndex1 === -1) continue;

        const path1 = line1.slice(Math.min(startIndex1, interchangeIndex1), Math.max(startIndex1, interchangeIndex1) + 1);
        if (startIndex1 > interchangeIndex1) path1.reverse();

        // Find path from interchange to end
        const line2 = metroData.lines[endNode.line];
        const interchangeIndex2 = line2.indexOf(interchangeStation);
        const endIndex2 = line2.indexOf(endStation);

        if (interchangeIndex2 === -1) continue;

        const path2 = line2.slice(Math.min(interchangeIndex2, endIndex2), Math.max(interchangeIndex2, endIndex2) + 1);
        if (interchangeIndex2 > endIndex2) path2.reverse();
        
        const fullPath = [...path1, ...path2.slice(1)]; // Avoid duplicating the interchange station
        
        if (!bestRoute || fullPath.length < bestRoute.path.length) {
            bestRoute = {
                path: fullPath,
                interchanges: 1,
                changeAt: interchangeStation
            };
        }
    }
    
    return bestRoute;
}


// --- API Endpoint ---
app.get('/api/route', (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ error: 'Please provide "from" and "to" station names.' });
    }

    const route = findRoute(from, to);

    if (!route) {
        return res.status(404).json({ error: 'Could not find a route between the specified stations. Please check the station names.' });
    }

    const numberOfStations = route.path.length - 1;
    const estimatedTime = (numberOfStations * TIME_PER_STATION_MINS) + (route.interchanges * INTERCHANGE_TIME_MINS);
    const estimatedPrice = numberOfStations * COST_PER_STATION_INR;

    const response = {
        from: from,
        to: to,
        route: route.path,
        numberOfStations: numberOfStations,
        numberOfInterchanges: route.interchanges,
        changeAt: route.changeAt,
        estimatedTimeMinutes: estimatedTime,
        estimatedPriceINR: estimatedPrice
    };

    res.json(response);
});

// --- Server Start ---
app.listen(port, () => {
    console.log(`Patna Metro API server listening at http://localhost:${port}`);
    console.log('Try visiting: http://localhost:3000/api/route?from=Danapur%20Cantonment&to=New%20ISBT');
});
