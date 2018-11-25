require("./utils");
const token = "pk.eyJ1IjoiZzQzcmlrbyIsImEiOiJjam14dGNreDcxYjBqM3ZvMjk1MDNhcnhkIn0.b6BmzCbtHQNg6hfRA4uzWQ";
mapboxgl.accessToken = token;
const map = new mapboxgl.Map({
    center: [17.1493949, 48.1512907], // starting position [lng, lat]
    container: "map",
    //style: "mapbox://styles/mapbox/streets-v10",
    style: "mapbox://styles/mapbox/light-v9",
    zoom: 13, // starting zoom
});

window.updateRoads = () => {
    const parameters = {
        lat: center.coordinates[0],
        lon: center.coordinates[1],
        dist: document.getElementsByClassName("roadDistance")[0].value,
        route: document.getElementById("inputRouteType").value,
    };

    if (!parameters.route) {
        return;
    }
    const params = Object.keys(parameters).map((key) => key + "=" + parameters[key]).join("&");
    $.get(`http://localhost:3000/linesAround?${params}`, (response) => {
        if (map.getLayer("routes")) {
            map.removeLayer("routes");
            map.removeSource("routes");
        }

        if (Array.isArray(response.content)) {
            const features = response.content.map((item) => {
                const parserWay = JSON.parse(item.way);
                const values = getTypeAndValue(item);
                const result = {
                    "type": "Feature",
                    "geometry": parserWay,
                    "properties": {}
                };
                if (item.ref) {
                    result.properties.title = "Číslo spoja: " + item.ref;
                }
                return result;
            });

            map.addLayer({
                "id": "routes",
                "type": "line",
                "source": {
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": features
                    },
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

            const popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            });
            map.on("mouseenter", "routes", function (e) {
                // Change the cursor style as a UI indicator.
                map.getCanvas().style.cursor = "pointer";
                const description = e.features[0].properties.title;


                popup.setLngLat([e.lngLat.lng, e.lngLat.lat])
                    .setHTML(description)
                    .addTo(map);
            });

            map.on("mouseleave", "routes", function () {
                map.getCanvas().style.cursor = "";
                popup.remove();
            });

        }
    });
};
window.updateResults = () => {
    mapOnLoad();
};

window.myMap = map;

window.navigateTo = (x, y, zoom = 19) => {
    map.flyTo({
        center: [x, y],
        zoom,
        bearing: 0,

        speed: 2, // make the flying slow
        curve: 1, // change the speed at which it zooms out

        easing: function (t) {
            return t;
        }
    });
};

window.filterItems = (input) => {
    const inputText = input.value.toLowerCase();
    document.querySelectorAll(".panel .body li").forEach((e) => {
        const text = e.children[0].innerText.toLowerCase();
        if (text.indexOf(inputText) < 0) {
            e.classList.add("hidden");
        } else {
            e.classList.remove("hidden");
        }
        // e.style.display = text.indexOf(inputText) < 0 ? "none" : "list-item"
    });
};

const getTypeAndValue = (item) => {
    if (item.shop) {
        return ["shop", item.shop];
    } else if (item.amenity) {
        return ["amenity", item.amenity];
    } else if (item.building) {
        return ["building", item.building];
    } else if (item.sport) {
        return ["sport", item.sport];
    } else if (item.office) {
        return ["office", item.office];
    } else if (item.man_made) {
        return ["man_made", item.man_made];
    }
};

/*
map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true
}));
*/

window.filterTypes = (type) => {
    document.querySelectorAll("option.itemValue").forEach((e) => {
        if (e.classList.contains("type-" + type)) {
            e.classList.remove("hidden");
        } else {
            e.classList.add("hidden");
        }
    });
};


$.get("http://localhost:3000/stats", (response) => {
    if (Array.isArray(response.content)) {
        let typeString = "<option value=''>Typ</option>";
        let valueString = "<option value=''>Hodnota</option>";

        const types = new Set();


        response.content.forEach((e) => {
            types.add(e.type);
            valueString += `<option class="itemValue hidden type-${e.type}" value="${e.value}">${utils.translate(e.value)} (${e.count})</option>`;
        });
        types.forEach((e) => {
            typeString += `<option value="${e}">${utils.translate(e)}</option>`;
        });

        const itemType = document.getElementsByClassName("itemType")[0];
        itemType.innerHTML = typeString;
        itemType.addEventListener("change", () => {
            document.querySelectorAll("option.itemValue").forEach((item) => {
                if (item.classList.contains("type-" + itemType.value)) {
                    item.classList.remove("hidden");
                } else {
                    item.classList.add("hidden");
                }

            });
        });
        document.getElementsByClassName("itemValue")[0].innerHTML = valueString;
    }
});

window.switchParkings = () => {
    const visible = document.getElementById("showCarParks").checked;

    map.setLayoutProperty("car_parks", "visibility", visible ? "visible" : "none");
};

window.updateParkings = () => {
    const parameters = {
        private: document.getElementById("privateCarParks").checked ? 1 : 0,
        building: document.getElementById("buildingOnly").checked ? 1 : 0,
    };

    const params = Object.keys(parameters).map((key) => key + "=" + parameters[key]).join("&");
    $.get("http://localhost:3000/carParks?" + params, (response) => {
        if (Array.isArray(response.content)) {
            const features = response.content.map((item) => {
                return {
                    "type": "Feature",
                    "geometry": JSON.parse(item.way),
                    "properties": {
                        "title": "parking",
                        "landuse": item.landuse,
                        "building": item.building,
                        "surface": item.surface,
                        "access": item.access,
                    }
                };
            });

            if (map.getLayer("car_parks")) {
                map.removeLayer("car_parks");
                map.removeSource("car_parks");
            }

            map.addLayer({
                "id": "car_parks",
                "type": "fill",
                "source": {
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": features
                    }
                },
                "layout": {},
                "paint": {
                    "fill-color": "#088",
                    "fill-opacity": 1
                }
            });

            const popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            });

            map.on("mouseenter", "car_parks", function (e) {
                // Change the cursor style as a UI indicator.
                map.getCanvas().style.cursor = "pointer";
                const properties = e.features[0].properties;
                let description = "<h3>Parkovisko</h3>";

                if (utils.exists(properties.surface)) {
                    description += `Povrch: <bold>${properties.surface} (${properties.surface})</bold><br>`;
                }
                if (utils.exists(properties.access)) {
                    description += `Prístup: <bold>${utils.translate(properties.access)} (${properties.access})</bold><br>`;
                }
                if (utils.exists(properties.landuse)) {
                    description += `Využitie krajny: <bold>${utils.translate(properties.landuse)} (${properties.landuse})</bold><br>`;
                }
                if (utils.exists(properties.building)) {
                    description += `Budova: <bold>${utils.translate(properties.building)} (${properties.building})</bold><br>`;
                }

                popup.setLngLat([e.lngLat.lng, e.lngLat.lat])
                    .setHTML(description)
                    .addTo(map);
            });

            map.on("mousemove", "car_parks", (e) => {
                popup.setLngLat([e.lngLat.lng, e.lngLat.lat]);
            });

            map.on("mouseleave", "car_parks", function () {
                map.getCanvas().style.cursor = "";
                popup.remove();
            });
        }
    });
};

window.center = {
    coordinates: [17.1493949, 48.1512907],
    _geojson: {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Point",
                "coordinates": [],
            }
        }]
    },
    _coordElement: document.getElementById("coordinates"),
    setCoordinates(lng, lat) {
        this.coordinates = [lng, lat];
        this._coordElement.innerHTML = "Longitude: " + lng + "<br />Latitude: " + lat;
    },
    goToCenter(zoom = 19) {
        navigateTo(this.coordinates[0], this.coordinates[1], zoom);
    },
    init() {
        this.setCoordinates(this.coordinates[0], this.coordinates[1]);
        this.goToCenter(14);
        this._geojson.features[0].geometry.coordinates = this.coordinates;
    },

};
center.init();

const preparePointer = () => {
    const marker = new mapboxgl.Marker({
        draggable: true
    })
        .setLngLat(center.coordinates)
        .addTo(map);

    function onDragEnd() {
        const coords = marker.getLngLat();
        center.coordinates = [coords.lng, coords.lat];
        center._geojson.features[0].geometry.coordinates = [coords.lng, coords.lat];
        updateResults();
        updateRoads();
    }

    marker.on("dragend", onDragEnd);
};

window.myLocation = {};
map.on("click", "points", (e) => {
    const properties = e.features[0].properties;
    const coordinates = e.features[0].geometry.coordinates.slice();
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${token}&language=sk`;
    $.get(url, (response) => {
        const splitAndTranslate = (key, divider = ",") => {
            return key.split(divider).map(utils.translate).join(divider);
        };
        let tooltipContent = `<h1>${properties.title}</h1>
            <bold><span>${properties.type}(${splitAndTranslate(properties.type)})</span> - <span>${properties.value}(${splitAndTranslate(properties.value)})</span></bold><br>`;
        if (response.features.length) {
            let tmpAddress = "";
            if (response.features[0].properties.category) {
                tooltipContent += `Kategória: <bold>${response.features[0].properties.category}(${splitAndTranslate(response.features[0].properties.category)})</bold><br>`;
            }
            if (response.features[0].properties.address) {
                tmpAddress += response.features[0].properties.address;
            }
            if (response.features[1]) {
                const place_name = response.features[1].place_name_sk || response.features[1].place_name;
                tmpAddress += tmpAddress ? ", " + place_name : place_name;
            }

            if (tmpAddress) {
                tooltipContent += `Adresa: <bold>${tmpAddress}</bold><br>`;
            }
            if (utils.exists(properties.operator)) {
                tooltipContent += `Operator: <bold>${properties.operator}</bold><br>`;
            }
            if (utils.exists(properties.brand)) {
                tooltipContent += `Značka: <bold>${properties.brand}</bold><br>`;
            }
            if (utils.exists(properties.ref)) {
                tooltipContent += `Referencia: <bold>${properties.ref}</bold><br>`;
            }
        }
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(tooltipContent)
            .addTo(map);
    });
});


map.on("mouseenter", "points", function () {
    map.getCanvas().style.cursor = "pointer";
});
map.on("mouseleave", "points", function () {
    map.getCanvas().style.cursor = "";
});

const utils = {
    iconList: [
        "aerialway",
        "airfield",
        "airport",
        "alcohol-shop",
        "america-football",
        "amusement-park",
        "aquarium",
        "art-gallery",
        "attraction",
        "bakery",
        "bank",
        "bar",
        "barrier",
        "baseball",
        "basketball",
        "bbq",
        "beach",
        "beer",
        "bicycle",
        "bicycle-share",
        "blood-bank",
        "bowling-alley",
        "bridge",
        "building",
        "building-alt1",
        "bus",
        "cafe",
        "campsite",
        "car",
        "car-rental",
        "car-repair",
        "casino",
        "castle",
        "cemetery",
        "charging-station",
        "cinema",
        "circle",
        "circle-stroked",
        "city",
        "clothing-store",
        "college",
        "commercial",
        "communications-tower",
        "confectionary",
        "convenience-store",
        "cricket",
        "cross",
        "dam",
        "danger",
        "defibrillator",
        "dentist",
        "doctor",
        "dog-park",
        "drinking-water",
        "embassy",
        "emergency-phone",
        "entrance",
        "entrance-alt1",
        "farm",
        "fast-food",
        "fence",
        "ferry",
        "fire-station",
        "fitness-center",
        "florist",
        "fuel",
        "furniture",
        "gaming",
        "garden",
        "garden-center",
        "gift",
        "globe",
        "golf",
        "grocery",
        "hairdresser",
        "harbor",
        "hardware",
        "heart",
        "heliport",
        "home",
        "horse-riding",
        "hospital",
        "ice-cream",
        "industry",
        "information",
        "jewelry-store",
        "karaoke",
        "landmark",
        "landuse",
        "laundry",
        "library",
        "lighthouse",
        "lodging",
        "logging",
        "marker",
        "marker-stroked",
        "mobile-phone",
        "monument",
        "mountain",
        "museum",
        "music",
        "natural",
        "optician",
        "paint",
        "park",
        "park-alt1",
        "parking",
        "parking-garage",
        "pharmacy",
        "picnic-site",
        "pitch",
        "place-of-worship",
        "playground",
        "police",
        "post",
        "prison",
        "rail",
        "rail-light",
        "rail-metro",
        "ranger-station",
        "recycling",
        "religious-buddhist",
        "religious-christian",
        "religious-jewish",
        "religious-muslim",
        "residential-community",
        "restaurant",
        "restaurant-noodle",
        "restaurant-pizza",
        "restaurant-seafood",
        "roadblock",
        "rocket",
        "school",
        "scooter",
        "shelter",
        "shoe",
        "shop",
        "skateboard",
        "skiing",
        "slaughterhouse",
        "slipway",
        "snowmobile",
        "soccer",
        "square",
        "square-stroked",
        "stadium",
        "star",
        "star-stroked",
        "suitcase",
        "sushi",
        "swimming",
        "table-tennis",
        "teahouse",
        "telephone",
        "tennis",
        "theatre",
        "toilet",
        "town",
        "town-hall",
        "triangle",
        "triangle-stroked",
        "veterinary",
        "viewpoint",
        "village",
        "volcano",
        "volleyball",
        "warehouse",
        "waste-basket",
        "watch",
        "water",
        "waterfall",
        "watermill",
        "wetland",
        "wheelchair",
        "windmill",
        "zoo"],
    exists(item) {
        return item && typeof item === "string" && item.trim() !== "null";
    },
    calcCrow(lat1, lon1, lat2, lon2) {
        const toRad = (Value) => Value * Math.PI / 180;
        const R = 6371; // km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        lat1 = toRad(lat1);
        lat2 = toRad(lat2);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d;
    },
    distance(p1, p2) {
        const result = this.calcCrow(p1.geometry.coordinates[0],
            p1.geometry.coordinates[1],
            p2.geometry.coordinates[0],
            p2.geometry.coordinates[1]);
        return Math.floor(result * 100) / 100;
    },
    translate(key) {
        const translates = {
            "church": "cirkevné",
            "concert": "koncert",
            "customers": "zákazníci",
            "gallery": "galéria",
            "historic": "historický",
            "hotel": "hotel",
            "landmark": "medzník",
            "museum": "múzeum",
            "park": "park",
            "pizza": "pizza",
            "retail": "maloobchodné",
            "theater": "divadlo",

            "amenity": "vybavenie",
            "building": "budova",
            "man_made": "človekom vyrobené",
            "brand": "Značka",
            "shop": "predajňa",
            "sport": "šport",

            "arts centre": "centrum umenia",
            "atm": "bankomat",
            "baby hatch": "dieťa poklop",
            "baggage room": "miestnosť na batožinu",
            "bank": "breh",
            "bar": "bar",
            "bar;cafe": "bar, kaviareň",
            "bbq": "BBQ",
            "bench": "lavice",
            "bicycle parking": "parkovanie bicyklov",
            "bicycle rental": "požičovňa bicyklov",
            "bicycle repair station": "stanica na opravu bicyklov",
            "biergarten": "Biergarten",
            "bureau de change": "zmenáreň",
            "cafe": "kaviareň",
            "cafe;coworking space": "kaviareň, coworking priestor",
            "car assistance": "pomoc s vozidlom",
            "car rental": "požičanie auta",
            "car sharing": "zdieľanie auta",
            "car wash": "autoumývareň",
            "casino": "kasíno",
            "cinema": "kino",
            "clinic": "poliklinika",
            "clock": "hodiny",
            "college": "koľaj",
            "community centre": "komunitné centrum",
            "compressed air": "stlačený vzduch",
            "courthouse": "súd",
            "dancing school": "tanečná škola",
            "dentist": "zubár",
            "device charging station": "nabíjacej stanice zariadenia",
            "doctors": "lekári",
            "dojo": "dojo",
            "drinking water": "pitná voda",
            "driving school": "autoškola",
            "embassy": "veľvyslanectvo",
            "fast food": "rýchle občerstvenie",
            "feeding place": "miesto na kŕmenie",
            "fire station": "požiarna stanica",
            "first aid": "prvá pomoc",
            "food court": "potravinový súd",
            "fountain": "fontána",
            "fuel": "palivo",
            "gambling": "Karban",
            "grave yard": "hrobový dvor",
            "gym": "telocvičňa",
            "hookah lounge": "vodná fajka",
            "hospital": "nemocnica",
            "hunting stand": "poľovnícky stánok",
            "changing rooms": "prezliekacie kabínky",
            "charging station": "nabíjacia stanica",
            "childcare": "Starostlivosť o deti",
            "ice cream": "zmrzlina",
            "kindergarten": "materská škola",
            "language school": "jazyková škola",
            "library": "knižnica",
            "locker": "skrinku",
            "love hotel": "milý hotel",
            "marketplace": "trhovisko",
            "monastery": "kláštor",
            "nightclub": "nočný klub",
            "parking": "parkovisko",
            "parking entrance": "vstup do parkoviska",
            "parking space": "parkovacie miesto",
            "pharmacy": "lekáreň",
            "place of worship": "miesto uctievania",
            "police": "polícia",
            "post box": "Poštová schránka",
            "post office": "pošta",
            "pub": "krčma",
            "public bookcase": "verejné knižnice",
            "recycling": "recyklácia",
            "restaurant": "reštaurácia",
            "retirement home": "domov dôchodcov",
            "sauna": "sauna",
            "shelter": "prístrešia",
            "Shisha Chill": "Shisha Chill",
            "shower": "sprcha",
            "school": "školské",
            "social facility": "sociálneho zariadenia",
            "stripclub": "stripclub",
            "studio": "štúdio",
            "taxi": "taxi",
            "telephone": "telefónne",
            "theatre": "divadlo",
            "toilets": "toalety",
            "townhall": "radnica",
            "university": "univerzitnú",
            "vacant": "prázdny",
            "vending machine": "automat",
            "veterinary": "veterinár",
            "waiting room": "čakáreň",
            "waste basket": "odpadový kôš",
            "waste disposal": "zneškodňovanie odpadu",
            "waterbicycle rental": "požičovňa vodných bicyklov",
            "apartments": "apartmány",
            "bunker": "bunker",
            "entrance": "vchod",
            "garage": "garáž",
            "hut": "chata",
            "chapel": "kaplnka",
            "office": "kancelária",
            "residential": "obytný",
            "service": "služba",
            "yes": "Áno",
            "antenna": "anténa",
            "communications tower": "komunikačná veža",
            "crane": "žeriav",
            "cross": "kríž",
            "flagpole": "stožiar",
            "gasometer": "plynomer",
            "chimney": "komín",
            "lamp": "lampa",
            "monitoring station": "monitorovacej stanice",
            "street cabinet": "pouličné kabinet",
            "surveillance": "dohľad",
            "survey point": "prieskumný bod",
            "tower": "veža",
            "wastewater plant": "odpadových vôd",
            "water tap": "vodovodný kohútik",
            "water well": "voda dobre",
            "water works": "vodné diela",
            "yes": "Áno",
            "accountant": "účtovný",
            "administration": "podávanie",
            "administrative": "administratívne",
            "advertising agency": "reklamná agentúra",
            "architect": "architekt",
            "association": "združenie",
            "broadcasting": "vysielania",
            "company": "spoločnosť",
            "coworking": "coworking",
            "educational institution": "vzdelávacia inštitúcia",
            "employment agency": "pracovná agentúra",
            "energy supplier": "dodávateľom energie",
            "e-shop": "e-shop",
            "estate agent": "realitný maklér",
            "finance": "financie",
            "financial": "finančné",
            "government": "vláda",
            "guide": "navádzať",
            "charity": "dobročinnosť",
            "insurance": "poistenie",
            "it": "to",
            "lawyer": "právnik",
            "newspaper": "noviny",
            "ngo": "ngo",
            "notary": "notár",
            "political party": "politická strana",
            "printing": "tlač",
            "property management": "správa nehnuteľností",
            "religion": "náboženstvo",
            "research": "výskum",
            "security": "zabezpečenia",
            "telecommunication": "telekomunikácie",
            "therapist": "terapeut",
            "translator": "prekladateľ",
            "travel agent": "cestovné kancelárie",
            "yes": "Áno",

            "trolleybus": "trolejbus",
            "tracks": "skladieb",
            "foot": "noha",
            "bicycle": "bicykel",
            "planned_hike": "plánované túry",
            "bus": "autobus",
            "railway": "kolajnice",
            "hiking": "turistika",
            "ski": "lyže",
            "power": "moc",
            "ferry": "trajekt",
            "pilgrimage": "púť",
            "running": "beh",
            "waterway": "vodné",
            "train": "vlak",
            "road": "cestné",
            "whitewater": "Whitewater",
            "mtb": "Hoský bycikel",
            "disused": "mimo prevádzky",
            "tram": "električka",
            "horse": "kôň",

            "alcohol": "alkohol",
            "antiques": "starožitnosti",
            "art": "umenie",
            "babies": "deti",
            "baby goods": "detský tovar",
            "bag": "sáčok",
            "bakery": "pekáreň",
            "bathroom": "kúpeľňa",
            "bathroom furnishing": "vybavenie kúpeľní",
            "beauty": "krása",
            "bed": "posteľ",
            "beverages": "nápoje",
            "bicycle": "bicykel",
            "boat": "čln",
            "bookmaker": "bookmaker",
            "books": "knihy",
            "boutique": "butik",
            "butcher": "mäsiar",
            "car": "auto",
            "car parts": "autodiely",
            "carpet": "koberec",
            "car repair": "opravy automobilov",
            "cash register": "pokladňa",
            "cleaning machines": "čistiace stroje",
            "clothes": "oblečenie",
            "coffee": "káva",
            "collector": "zberateľ",
            "computer": "počítačový",
            "confectionery": "cukrovinky",
            "convenience": "pohodlie",
            "copyshop": "CopySHOP",
            "cosmetics": "kozmetika",
            "craft": "remeslo",
            "deli": "delikatesy",
            "department store": "obchodný dom",
            "digital printer": "digitálna tlačiareň",
            "dog grooming": "starostlivosť o psov",
            "doityourself": "urob si sám",
            "doors": "dvere",
            "dry cleaning": "čistenie nasucho",
            "duty free": "Bez poplatkov",
            "e-cigarette": "e-cigareta",
            "electrical": "elektrický",
            "electronics": "elektronika",
            "erotic": "erotický",
            "e-shop": "e-shop",
            "fabric": "tkanina",
            "farm": "farma",
            "fashion": "móda",
            "fireplace": "ohnisko",
            "fishing": "rybárčenie",
            "floor": "podlaha",
            "florist": "kvetinár",
            "food": "jedlo",
            "frame": "rám",
            "funeral directors": "pohrební riaditelia",
            "furniture": "nábytok",
            "games": "hry",
            "garden centre": "záhradné centrum",
            "garden furniture": "záhradný nábytok",
            "gas": "plynový",
            "general": "všeobecný",
            "gift": "darček",
            "glass": "sklo",
            "glaziery": "sklenárstvo",
            "greengrocer": "zeleninári",
            "hairdresser": "kaderník",
            "hardware": "technické vybavenie",
            "herbalist": "zberateľ",
            "hifi": "hifi",
            "hobby": "hobby",
            "honey": "med",
            "houses": "domy",
            "houseware": "domáce",
            "charity": "dobročinnosť",
            "cheese": "syr",
            "chemist": "chemik",
            "ink": "atrament",
            "interior decoration": "interiérová dekorácia",
            "jewelry": "šperky",
            "kiosk": "kiosk",
            "kitchen": "kuchyňa",
            "lamp": "lampa",
            "lamps": "lampy",
            "laundry": "bielizeň",
            "leather": "koža",
            "lift repair": "opravy výťahov",
            "lighting": "osvetlenie",
            "locksmith": "zámočník",
            "lottery": "lotérie",
            "mall": "nákupné centrum",
            "maps": "mapy",
            "massage": "masáž",
            "medical supply": "lekárske dodávky",
            "mobile phone": "mobilný telefón",
            "motorcycle": "motocykel",
            "motorcycle repair": "opravy motocyklov",
            "music": "hudba",
            "musical instrument": "hudobný nástroj",
            "newsagent": "trafika",
            "nutrition": "výživa",
            "nutrition supplements": "výživové doplnky",
            "optician": "optik",
            "oral care": "ústna starostlivosť",
            "outdoor": "vonkajšie",
            "paint": "maľovať",
            "pastry": "pečivo",
            "pawnbroker": "majiteľ záložne",
            "perfumery": "parfumérie",
            "pet": "domáce zviera",
            "photo": "fotografie",
            "plastics": "plasty",
            "printer ink": "atrament tlačiarne",
            "printing": "tlač",
            "protetics": "protetics",
            "radiotechnics": "radiotechnics",
            "rubber": "guma",
            "seafood": "morské plody",
            "security": "zabezpečenia",
            "sewing": "šitie",
            "shoes": "topánky",
            "ski": "lyže",
            "spices": "korenie",
            "sports": "športové",
            "stamps": "známky",
            "stationery": "papiernictvo",
            "supermarket": "supermarket",
            "tailor": "krajčír",
            "tattoo": "tetovanie",
            "tea": "čaj",
            "ticket": "vstupenka",
            "tobacco": "tabak",
            "toys": "hračky",
            "trade": "obchod",
            "travel agency": "cestovná kancelária",
            "trophy": "trofej",
            "tyres": "pneumatiky",
            "vacant": "prázdny",
            "vacuum cleaner": "vysávač",
            "variety store": "predajňa odrody",
            "video": "video",
            "video games": "video hry",
            "wallpaper": "tapeta",
            "water": "voda",
            "watches": "hodinky",
            "weapons": "zbrane",
            "wigs": "parochne",
            "window blind": "okenná roleta",
            "wine": "víno",
            "wool": "vlna",
            "yes": "Áno",
            "aikido": "aikido",
            "badminton": "badminton",
            "badminton;box": "badminton, box",
            "badminton;fitness;basketball": "badminton, fitness, basketbal",
            "badminton;tennis;squash": "badminton, tenis, squash",
            "basketball": "basketball",
            "boules": "petanque",
            "bowling;tenis;badminton": "bowling, tenis, bedminton",
            "canoe": "kanoe",
            "climbing": "šplhanie",
            "darts;billiards": "šípky, biliard",
            "darts;billiards;table soccer": "šípky, biliard, stolný futbal",
            "field hockey": "hokej v teréne",
            "fitness": "vhodnosť",
            "golf": "golf",
            "gym": "telocvičňa",
            "gymnastics": "gymnastika",
            "chess": "šach",
            "ice hockey": "ľadový hokej",
            "indoor cycling;tennis;badminton;squash;table tennis": "tenis, badminton, squash, stolný tenis",
            "judo": "Džudo",
            "karate": "karate",
            "karting": "karting",
            "laser tag": "laserová značka",
            "multi": "multi",
            "paintball;airsoft;lasertag": "paintballové, airsoft; Lasertag",
            "pétanque": "pétanque",
            "roller skating": "korčuľovanie",
            "rowing": "veslovanie",
            "running": "beh",
            "safety training": "bezpečnostný výcvik",
            "scuba diving": "potápanie",
            "shooting": "Streľba",
            "shooting;airsoft;paintball": "streľba, airsoft, paintball",
            "skateboard": "skateboard",
            "skating": "korčuľovanie",
            "soccer": "kopaná",
            "squash": "tekvica",
            "streetball": "streetball",
            "swimming": "plávanie",
            "table tennis": "stolný tenis",
            "taekwondo": "taekwondo",
            "tennis": "tenis",
            "water ski": "vodné lyže",
            "yoga": "jóga",
            "10pin": "10pin"

        };

        return translates[key] || translates[key.trim().toLowerCase().replace("_", " ")] || key;
    }
};

const mapOnLoad = () => {
    const maxDistance = document.querySelector("input.distance").value;
    const parkingElement = document.querySelector("input.parking");
    parkingElement.disabled = maxDistance > 1000;
    const parking = parkingElement.value;
    const parameters = {
        lat: center.coordinates[0],
        lon: center.coordinates[1],
        dist: maxDistance,
        key: encodeURIComponent(document.querySelector("input.pattern").value),
        type: document.getElementById("inputItemType").value,
        value: document.getElementById("inputItemValue").value,
    };
    if (maxDistance <= 1000 && !isNaN(parking) && parking > 0 && parking < 1000) {
        parameters.parking = parking;
    }

    const params = Object.keys(parameters).map((key) => key + "=" + parameters[key]).join("&");
    $.get(`http://localhost:3000/pointsAround?${params}`, (response) => {
        if (map.getLayer("points")) {
            map.removeLayer("cluster-count");
            map.removeLayer("clusters");
            map.removeLayer("points");
            map.removeSource("points");
        }
        if (Array.isArray(response.content)) {
            let bodyContent = "<ul>";
            const minMax = [center.coordinates[0], center.coordinates[1], center.coordinates[0], center.coordinates[1]];
            const features = response.content.map((item) => {
                const parserWay = JSON.parse(item.way);
                minMax[0] = minMax[0] ? Math.min(minMax[0], parserWay.coordinates[0]) : parserWay.coordinates[0];
                minMax[2] = minMax[2] ? Math.max(minMax[2], parserWay.coordinates[0]) : parserWay.coordinates[0];

                minMax[1] = minMax[1] ? Math.min(minMax[1], parserWay.coordinates[1]) : parserWay.coordinates[1];
                minMax[3] = minMax[3] ? Math.max(minMax[3], parserWay.coordinates[1]) : parserWay.coordinates[1];
                const values = getTypeAndValue(item);
                const result = {
                    "type": "Feature",
                    "geometry": parserWay,
                    "properties": {
                        "title": item.name,
                        "icon": (item.amenity && utils.iconList.includes(item.amenity)) ? item.amenity : "circle",
                        "operator": item.operator,
                        "ref": item.ref,
                        "brand": item.brand,
                        "type": values[0],
                        "value": values[1],
                    }
                };
                const distance = Math.round(item.dist / 10) / 100;

                bodyContent += `<li><span class="button" onclick="navigateTo(${parserWay.coordinates[0]}, ${parserWay.coordinates[1]})">${item.name}</span> - <span>${distance} km</span></li>`;
                return result;
            });
            if (minMax.length === 4) {
                map.fitBounds(minMax, {
                    padding: 100
                });
            }
            bodyContent += "</ul>";
            document.querySelector(".panel .body").innerHTML = bodyContent;

            /*
            const clusterGroup = new L.MarkerClusterGroup();
            clusterGroup.addLayer({
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
            map.addLayer(clusterGroup)
            */
            map.addLayer({
                "id": "points",
                "type": "symbol",
                "source": {
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": features
                    },
                    "cluster": document.getElementById("showClusters").checked,
                    "clusterMaxZoom": 19, // Max zoom to cluster points on
                    "clusterRadius": 50 // Radius of each cluster when clustering points (defaults to 50)
                },
                "layout": {
                    "icon-image": "{icon}-15",
                    "text-field": "{title}",
                    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                    "text-offset": [0, 0.6],
                    "text-anchor": "top"
                }
            });

            map.addLayer({
                id: "clusters",
                type: "circle",
                source: "points",
                filter: ["has", "point_count"],
                paint: {
                    // Use step expressions (https://www.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
                    // with three steps to implement three types of circles:
                    //   * Blue, 20px circles when point count is less than 100
                    //   * Yellow, 30px circles when point count is between 100 and 750
                    //   * Pink, 40px circles when point count is greater than or equal to 750
                    "circle-color": [
                        "step",
                        ["get", "point_count"],
                        "#51bbd6",
                        100,
                        "#f1f075",
                        750,
                        "#f28cb1"
                    ],
                    "circle-radius": [
                        "step",
                        ["get", "point_count"],
                        20,
                        100,
                        30,
                        750,
                        40
                    ]
                }
            });

            map.addLayer({
                id: "cluster-count",
                type: "symbol",
                source: "points",
                filter: ["has", "point_count"],
                layout: {
                    "text-field": "{point_count_abbreviated}",
                    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                    "text-size": 12
                }
            });

            map.on("click", "clusters", function (e) {
                const features = map.queryRenderedFeatures(e.point, {layers: ["clusters"]});
                const clusterId = features[0].properties.cluster_id;
                map.getSource("points").getClusterExpansionZoom(clusterId, function (err, zoom) {
                    if (err) {
                        return;
                    }

                    map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom: zoom
                    });
                });
            });

            map.on("mouseenter", "clusters", function () {
                map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", "clusters", function () {
                map.getCanvas().style.cursor = "";
            });

        }
    });
};

map.on("load", () => {
    preparePointer();
    mapOnLoad();
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
    */
    updateParkings();
});
