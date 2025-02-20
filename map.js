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
