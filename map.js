mapboxgl.accessToken = 'pk.eyJ1Ijoic2h1Y2hhbmdsaXU5NTEiLCJhIjoiY203Y2szaXhkMHBpeDJqcHB2dGpwcDRqcCJ9.Ht-97qojwT341BmDV-upfQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-71.09415, 42.36027],
    zoom: 12,
    minZoom: 5,
    maxZoom: 18
});

let timeFilter = -1; 

const timeSlider = document.getElementById('time-slider');
const selectedTime = document.getElementById('selected-time');
const anyTimeLabel = document.getElementById('any-time');

function formatTime(minutes) {
    const date = new Date(0, 0, 0, 0, minutes);
    return date.toLocaleTimeString('en-US', { timeStyle: 'short' });
}

function updateTimeDisplay() {
    timeFilter = Number(timeSlider.value);

    if (timeFilter === -1) {
        selectedTime.textContent = '';
        anyTimeLabel.style.display = 'block';
    } else {
        selectedTime.textContent = formatTime(timeFilter);
        anyTimeLabel.style.display = 'none';
    }
}

// Listen for input events on the slider
timeSlider.addEventListener('input', updateTimeDisplay);
updateTimeDisplay();

map.on('load', () => {
    map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson'
    });

    map.addLayer({
        id: 'bike-lanes',
        type: 'line',
        source: 'boston_route',
        paint: {
            'line-color': '#32D400',
            'line-width': 5,
            'line-opacity': 0.6
        }        
    });

    map.addSource('cambridge_route', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson' 
    });

    map.addLayer({
        id: 'cambridge-bike-lanes',
        type: 'line',
        source: 'cambridge_route',
        paint: {
            'line-color': '#FFA500',
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

    d3.json(jsonUrl).then(jsonData => {
        stations = jsonData.data.stations;
        console.log('Loaded Station Data:', stations);

        d3.csv(trafficDataUrl).then(data => {
            console.log('Loaded Traffic Data:', data);

            let departures = d3.rollup(data, v => v.length, d => d.start_station_id);
            let arrivals = d3.rollup(data, v => v.length, d => d.end_station_id);

            stations = stations.map(station => {
                let id = station.short_name; 
                station.arrivals = arrivals.get(id) ?? 0;
                station.departures = departures.get(id) ?? 0;
                station.totalTraffic = station.arrivals + station.departures;
                return station;
            });

            console.log('Updated Stations:', stations);

            const radiusScale = d3.scaleSqrt()
                .domain([0, d3.max(stations, d => d.totalTraffic)])
                .range([0, 25]);

            svg.selectAll('circle')
                .data(stations)
                .enter()
                .append('circle')
                .attr('fill', 'steelblue')
                .attr('stroke', 'white')
                .attr('stroke-width', 1)
                .attr('opacity', 0.6)
                .attr("r", d => radiusScale(d.totalTraffic)) // Added radius
                .each(function(d) {
                    d3.select(this)
                        .append('title')
                        .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
                });

            function updatePositions() {
                if (stations.length === 0) return;

                svg.selectAll('circle')
                    .attr('cx', d => getCoords(d).cx)
                    .attr('cy', d => getCoords(d).cy)
                    .attr('r', d => radiusScale(d.totalTraffic))
                    .select('title')
                    .text(d => `${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
            }

            updatePositions();
            map.on('move', updatePositions);
            map.on('zoom', updatePositions);
            map.on('resize', updatePositions);
            map.on('moveend', updatePositions);
        });
    });
});


