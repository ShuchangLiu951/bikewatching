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

    
    const jsonUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
    const trafficDataUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv';

    const svg = d3.select('#map').select('svg');
    let stations = [];

    function getCoords(station) {
        const point = map.project(new mapboxgl.LngLat(+station.lon, +station.lat));
        return { cx: point.x, cy: point.y };
    }

    // Load station data FIRST
    d3.json(jsonUrl).then(jsonData => {
        stations = jsonData.data.stations;

        console.log('Loaded Station Data:', stations); // Debugging

        // Now, fetch traffic data
        d3.csv(trafficDataUrl).then(data => {
            console.log('Loaded Traffic Data:', data); // Debugging

            let departures = d3.rollup(data, v => v.length, d => d.start_station_id);
            let arrivals = d3.rollup(data, v => v.length, d => d.end_station_id);

            // Update station traffic data
            stations = stations.map(station => {
                let id = station.short_name;
                station.arrivals = arrivals.get(id) ?? 0;
                station.departures = departures.get(id) ?? 0;
                station.totalTraffic = station.arrivals + station.departures;
                return station;
            });

            console.log('Updated Stations:', stations); // Debugging

            // Define radius scale AFTER traffic data is available
            const radiusScale = d3.scaleSqrt()
                .domain([0, d3.max(stations, d => d.totalTraffic)])
                .range([3, 25]);

            // Create circles AFTER stations are updated
            svg.selectAll('circle')
                .data(stations)
                .enter()
                .append('circle')
                .attr('fill', 'steelblue')
                .attr('stroke', 'white')
                .attr('stroke-width', 1)
                .attr('opacity', 0.6)
                .each(function(d) {
                    d3.select(this)
                        .append('title')
                        .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
                });

            // Function to update positions and sizes
            function updatePositions() {
                if (stations.length === 0) return; // Ensure stations exist

                svg.selectAll('circle')
                    .attr('cx', d => getCoords(d).cx)
                    .attr('cy', d => getCoords(d).cy)
                    .attr('r', d => radiusScale(d.totalTraffic))
                    .select('title')
                    .text(d => `${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
            }

            // Ensure markers move correctly
            updatePositions();
            map.on('move', updatePositions);
            map.on('zoom', updatePositions);
            map.on('resize', updatePositions);
            map.on('moveend', updatePositions);
        });
    });
    

});
