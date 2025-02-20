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
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::RECREATION_BikeFacilities.geojson' // Replace with actual link
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
    


});

