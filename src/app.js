mapboxgl.accessToken = "pk.eyJ1IjoiZzQzcmlrbyIsImEiOiJjam14dGNreDcxYjBqM3ZvMjk1MDNhcnhkIn0.b6BmzCbtHQNg6hfRA4uzWQ";
const map = new mapboxgl.Map({
    center: [17.1493949, 48.1512907], // starting position [lng, lat]
    container: "map",
    //style: "mapbox://styles/mapbox/streets-v10",
    style: "mapbox://styles/mapbox/light-v9",
    zoom: 13, // starting zoom
});

map.on("load", () => {
    $.get("http://localhost:3000/points", (response) => {
        if (Array.isArray(response.content)) {
            const features = response.content.map((item) => {
                return {
                    "type": "Feature",
                    "geometry": JSON.parse(item.way),
                    "properties": {
                        "title": item.name,
                        "icon": "monument"
                    }
                };
            });

            map.addLayer({
                "id": "points",
                "type": "symbol",
                "source": {
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": features
                    }
                },
                "layout": {
                    "icon-image": "{icon}-15",
                    "text-field": "{title}",
                    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                    "text-offset": [0, 0.6],
                    "text-anchor": "top"
                }
            });
        }
    });
    /*
    $.get("http://localhost:3000/roads", (response) => {
        if (Array.isArray(response.content)) {
            const features = response.content.map((item) => {
                return {
                    "type": "Feature",
                    "geometry": JSON.parse(item.way),
                    "properties": {
                        "title": item.name,
                    }
                }
            });

            map.addLayer({
                "id": "route",
                "type": "line",
                "source": {
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": features
                    }
                },
                "layout": {
                    "line-join": "round",
                    "line-cap": "round"
                },
                "paint": {
                    "line-color": "#888",
                    "line-width": 8
                }
            });
        }
    });
    $.get("http://localhost:3000/polygons", (response) => {
        if (Array.isArray(response.content)) {
            const features = response.content.map((item) => {
                return {
                    "type": "Feature",
                    "geometry": JSON.parse(item.way),
                    "properties": {
                        "title": item.name,
                    }
                }
            });

            map.addLayer({
                'id': 'maine',
                'type': 'fill',
                'source': {
                    'type': 'geojson',
                    "data": {
                        "type": "FeatureCollection",
                        "features": features
                    }
                },
                'layout': {},
                'paint': {
                    'fill-color': '#088',
                    'fill-opacity': 0.1
                }
            });
        }
    });
    */
});
