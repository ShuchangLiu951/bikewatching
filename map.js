// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2h1Y2hhbmdsaXU5NTEiLCJhIjoiY203Y2szaXhkMHBpeDJqcHB2dGpwcDRqcCJ9.Ht-97qojwT341BmDV-upfQ';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map', // ID of the div where the map will render
    style: 'mapbox://styles/mapbox/streets-v12', // Map style
    center: [-71.09415, 42.36027], // [longitude, latitude]
    zoom: 12, // Initial zoom level
    minZoom: 5, // Minimum allowed zoom
    maxZoom: 18 // Maximum allowed zoom
});


map.on('load', () => {
    // Add Boston bike lanes as a data source
    map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson'
    });

    // Add a layer to visualize bike lanes
    map.addLayer({
        id: 'bike-lanes',
        type: 'line',
        source: 'boston_route',
        paint: {
            'line-color': '#32D400', // Brighter green color
            'line-width': 5, // Thicker lines
            'line-opacity': 0.6 // More visible
        }        
    });

    map.addSource('cambridge_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::RECREATION_BikeFacilities.geojson' 
    });
    
    
    // Load the Bluebikes JSON file
    const jsonUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';

    d3.json(jsonUrl)
        .then(jsonData => {
            console.log('Loaded JSON Data:', jsonData); // Verify structure

            // Extract station data
            const stations = jsonData.data.stations;
            console.log('Stations Array:', stations); // Verify array extraction
        })
        .catch(error => {
            console.error('Error Loading JSON:', error);
        });



    // Select the SVG layer and initialize an empty array for stations
    const svg = d3.select('#map').select('svg');
    let stations = [];

    function getCoords(station) {
        const point = new mapboxgl.LngLat(+station.lon, +station.lat);
        const { x, y } = map.project(point);
        return { cx: x, cy: y };
    }

    
    d3.json(jsonUrl).then(jsonData => {
        stations = jsonData.data.stations;
    
        const circles = svg.selectAll('circle')
            .data(stations)
            .enter()
            .append('circle')
            .attr('r', 5) // Circle size
            .attr('fill', 'steelblue') // Fill color
            .attr('stroke', 'white') // Border color
            .attr('stroke-width', 1)
            .attr('opacity', 0.8);
    });

    
    function updatePositions() {
        svg.selectAll('circle')
            .attr('cx', d => getCoords(d).cx)
            .attr('cy', d => getCoords(d).cy);
    }

    updatePositions();
    
    map.on('move', updatePositions);
    map.on('zoom', updatePositions);
    map.on('resize', updatePositions);
    map.on('moveend', updatePositions);
    


});

