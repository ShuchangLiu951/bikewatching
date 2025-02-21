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

let filteredTrips = [];
let filteredArrivals = new Map();
let filteredDepartures = new Map();
let filteredStations = [];

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

    const svg = d3.select('#map').select('svg');
    let stations = [];

    const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';

    d3.json(jsonurl).then(jsonData => {
        console.log('Loaded JSON Data:', jsonData);  
        stations = jsonData.data.stations;
        console.log('Stations Array:', stations);
    
        d3.csv('https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv').then(trips =>{


        for (let trip of trips) {

            trip.started_at = new Date(trip.started_at);
            trip.ended_at = new Date(trip.ended_at);
        }


        let departures = d3.rollup(
            trips,
            (v) => v.length,
            (d) => d.start_station_id,
        );

        let arrivals = d3.rollup(
            trips,
            (v) => v.length,
            (d) => d.end_station_id,
        );

        stations = stations.map((station) => {
            let id = station.short_name;
            station.arrivals = arrivals.get(id) ?? 0;
            station.departures = departures.get(id) ?? 0;
            station.totalTraffic = station.arrivals + station.departures;
                
            return station;
        });

        let radiusScale = d3
            .scaleSqrt()
            .domain([0, d3.max(stations, (d) => d.totalTraffic)])
            .range([0,25]);

        let stationFlow = d3.scaleQuantize().domain([0, 1]).range([0, 0.5, 1]);



        circles = svg.selectAll('circle')
            .data((timeFilter == -1) ? stations : filteredStations)
            .enter()
            .append('circle')
            .attr('r', d => radiusScale(d.totalTraffic))               
            .attr('fill', 'steelblue')  
            .attr('stroke', 'white')    
            .attr('stroke-width', 1)    
            .attr('opacity', 0.6)      
            .each(function(d) {
            
            d3.select(this)
            .append('title')
            .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
            })
            .style("--departure-ratio", d => stationFlow(d.departures / d.totalTraffic))

            
        updatePositions();


        function minutesSinceMidnight(date) {
        return date.getHours() * 60 + date.getMinutes();
        }

        function filterTripsbyTime() {
            filteredTrips = timeFilter === -1
                ? trips
                : trips.filter((trip) => {
                    const startedMinutes = minutesSinceMidnight(trip.started_at);
                    const endedMinutes = minutesSinceMidnight(trip.ended_at);
                    return (
                        Math.abs(startedMinutes - timeFilter) <= 60 ||
                        Math.abs(endedMinutes - timeFilter) <= 60
                    );
        });

                
            let filteredDepartures = d3.rollup(
                filteredTrips,
                (v) => v.length,
                (d) => d.start_station_id,
            );

            let filteredArrivals = d3.rollup(
                filteredTrips,
                (v) => v.length,
                (d) => d.end_station_id,
            );

            filteredStations = stations.map((station) => {
                station = { ...station };
                let id = station.short_name;
                station.arrivals = filteredArrivals.get(id) ?? 0;
                station.departures = filteredDepartures.get(id) ?? 0;
                station.totalTraffic = station.arrivals + station.departures;
                
                return station;
            });
            radiusScale = d3
            .scaleSqrt()
            .domain([0, d3.max(filteredStations, (d) => d.totalTraffic)])
            .range([0, 25]);
            
            svg.selectAll('circle')
            .data(filteredStations)
            .attr('r', d => radiusScale(d.totalTraffic))
            .each(function(d) {
                
                d3.select(this).select('title')
                    .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
            })
            .style("--departure-ratio", d => stationFlow(d.departures / d.totalTraffic)) 
            
            updatePositions()
        }

        timeSlider.addEventListener('input', () => {
            updateTimeDisplay();   
            filterTripsbyTime();        
        });
    })

    }).catch(error => {
            console.error('Error loading JSON:', error);  
    });
});


let circles;

function updatePositions() {
 circles
   .attr('cx', d => getCoords(d).cx)  
   .attr('cy', d => getCoords(d).cy); 

}

function getCoords(station) {
 const point = new mapboxgl.LngLat(+station.lon, +station.lat);  
 const { x, y } = map.project(point);  
 return { cx: x, cy: y };  
}
 
map.on('move', updatePositions);     
map.on('zoom', updatePositions);    
map.on('resize', updatePositions);   
map.on('moveend', updatePositions);  

