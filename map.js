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

    map.addLayer({
        id: 'cambridge-bike-lanes',
        type: 'line',
        source: 'cambridge_route',
        paint: {
            'line-color': '#FFA500', // Orange for distinction
            'line-width': 5,
            'line-opacity': 0.6
        }
    });

    // Load the Bluebikes JSON file
    const jsonUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';

    const svg = d3.select('#map').select('svg');
    let stations = [];

    function getCoords(station) {
        const point = map.project(new mapboxgl.LngLat(+station.lon, +station.lat));
        return { cx: point.x, cy: point.y };
    }

    // Load station data
    d3.json(jsonUrl).then(jsonData => {
        stations = jsonData.data.stations;

        svg.selectAll('circle')
            .data(stations)
            .enter()
            .append('circle')
            .attr('r', 5) // Fixed circle size
            .attr('fill', 'steelblue')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('opacity', 0.6);

        updatePositions(); // Ensure circles appear correctly
    });

    function updatePositions() {
        svg.selectAll('circle')
            .attr('cx', d => getCoords(d).cx)
            .attr('cy', d => getCoords(d).cy);
    }

    // Ensure markers move correctly when zooming/panning
    map.on('move', updatePositions);
    map.on('zoom', updatePositions);
    map.on('resize', updatePositions);
    map.on('moveend', updatePositions);
});
