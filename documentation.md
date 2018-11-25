# Overview
Aplikácia zobrazuje a umožnuje filtrovať rôzne zariadenia a budovy v oblasti Bratislavy
 - Umožnuje vyfiltrovať zariadenia podla typu:
    - vybavenia (bar, kaviareň, sauna, zmrzlina atď)
    - budovy(garáž, kancelária, bunker atď)
    - administratívy (eshop, banka, vládna budova atď)
    - obchodu (šport, hračky, nábytok, oblečenie atď)
    - značka (shell, omw, jurki atď)
    - značka (shell, omw, jurki atď)
    - operator(Slovenská pošta, Polícia SR, VUB, Terno atď)
    - športových aktivýt (tenys, šípky, šplhanie atď)
 - Umožnuje vyfiltrovať zariadenia podla názvu
 - Umožnuje vyfiltrovať zariadenia podla vzidalenosti od určitého bodu
 - Umožnuje vyfiltrovať zariadenia podla vzdialenosti od najbližšieho parkoviska
 - umožnuje nájsť trasy do určitej vzdialenosti od bodu záujmu
 - umožnuje vyfiltrovať trasy podla typu(trolejbu, autobus, vlak, cyklotrasa, trajekt atď)
 - Umožnuje zapnúť/vypnúť clustrovanie bodov na mape
 - Farebne odlišuje clustre na základe množstva zariadené obsiahnutých v ňom
 - Zoraďuje všetky zariadenia podla vziadlenosti od najbližších až po tie najvzialenejšie
 
 

![Screenshot](screenshot.png)

Aplikácia je rozdelená na 3 základné časti. Časť ktorú vidí používatel a interaguje s ňou sa nazíva Frontend(#frontend). 
Na frontend je použité MapboxAPI a MapboxGL ktorý využíva grafickú akceleráciu pre rýchle vykreslovanie mapy.
Všetky dáta sú uložené v databáze(#database). Databáza obsahuje rôzne pohlady a indexy ktoré ulahčujú prácu s ňou.
Frontend a Databázu prepája Backend(#backend). Backend prevádza geo dáta do geojson formátu ktorý je podporovaný frontendom. 
taktiež sú tu premenené jednotlivé requesty na SQL query ktoré sa posielajú do databázy

# Frontend

Frontendová časť je vlaste statická webová stránka ktorá používa MapboxGL knižnicu pre zobrazenie mapy a interakcie s ňou.
Obrazovka je rozdelené na 3 časti. Na mapu kde sa zobrazujú všetky zariadenia ktoré spľňajú kritéria aktuálne nastavených filtrov 
a na lavý panel kde je možné v hornej časti meniť rôzne filtre ktorých výsledky sa zobrazia v panely v dolnej časti. 
Každý výsledok v panely má napísanu vzdialenosť v akej sa nachádza od bodu záujmu.
Každé zariadenie v panelý sa nachádza taktiež aj na mapke. Je znázornené ikonkou hovoriaca o aký typ zariadenia ide(Ak je takáto ikonka podporovaná). 
Po kliknutí na názov zariadenia v panely bude kamera automaticky presmerované na pozíciu vybraného zariadenia.
Po kliknutí na zariadenie na mapke sa nám zobrazí okno ktoré obsahuje základní informácie o mieste(adresu, typ, kategóriu, názov)
Na mape taktiež vidno aj parkovacie miesta. Parkovacie miesta sú veľmi dôležité pre každého návštevníka Bratislavy. 
V prípade že ich používatel nepotrebuje je ich možné skryť. 
Pri výbere trasy sa zobrazia na mapke farebne odlíšené trasy. 
Po prejdení kurzorom myšli na trasu sa nám zobrazí okno ktoré obsahuje základné informácie o trase(napríklad číslo spoja)


# Backend
Backend je umplementovaný v jazyku Typescript a beží na NodeJS. Pre komunikáciu s databázov používa knižnicu Knex ktorá taktiež podporuje aj geodáta

# Database

Databáza využíva 4 základné tabuľky
 - planet_osm_point - kde sa nachádzajú všetky miesta
 - planet_osm_line - kde sa nachádzajú všetky čiary a krivky
 - planet_osm_polygon - kde sa nachádzajú všetky plochy
 - planet_osm_road - kde sa nachádzajú všetky cesty

Pre jednoduchšie prácu s ťabulky sme si vytvorili materializované pohlady ktoré vyfiltruju nepotrebné dáta. Aplikácia využíva tieto
 - valid_points - obsahuje vyfiltrované body a taktiež index na názov(`name`), súradnice(`way`) a typ
 - valid_routes - obsahuje vyfiltrované cesty, obsahuje index na súradnice(`way`) a stĺpec 'route'
 - all_car_parks  - obsahuje všetky polygóny ktoré sú typu parking. Index je na súradnice (`way`)

## Data

Dáta sú priamo vyexportované s OpenStreetMap.
Vyexportovaná časť zahŕňa Bratislavu zo širokým okolým.


## Api

**`GET /linesAround`**

Všetky routy v okoĺý
 
 parametre:
- `lat` - geografická šírka hladaného bodu
- `lon` - geografická výška hladaného bodu
- `dist` - maximálna vzialenosť trasy od hladaného bodu
- `route` - typ hladaného bodu
    
**`GET /linesAround`** 

Všetky body v okolý

 parametre:
- `lat` - geografická šírka hladaného bodu
- `lon` - geografická výška hladaného bodu
- `dist` - maximálna vzialenosť trasy od hladaného bodu
- `key` - typ hladaného bodu (shop, amenity ...)
- `type` - hodnota typu hladaného bodu (shoes, food ....)
- `value` - názov hladaného bodu
- `parking` - maximálna vzidalenosť hladaného bodu od cesty

**`GET /carParks`**

Všetky parkoviská

#Scenáre

## Vyhladať všetky reštaurácie ktoré sa nechádzajú do 200 metrov od križovatky Bajkalská - prievozská

## Vyhladať všetky pekárne ktoré sú 1 km od autobusovej stanice mlinské nivy a do 50 metrov od nich sa nachdádza parkovisko

## Zobraziť všetky trasy trolejbusov do vzdialenosti 100 metrov od trhoviska miletičova