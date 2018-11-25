import * as Knex from "knex";
import {QueryBuilder} from "knex";
import * as KnexPosgis from "knex-postgis";

const knex = Knex({
    client: "pg",
    version: "7.2",
    connection: {
        host: "localhost",
        user: "postgres",
        password: "",
        database: "gisdb",
    },
});

const st = KnexPosgis(knex);

function toPromise(builder: QueryBuilder): Promise<any> {
    return new Promise((success, reject) => {
        builder.then(success).catch(reject);
    });
}

const foods = ["bar", "bbq", "biergarten", "cafe", "drinking_water", "fast_food", "food_court", "ice_cream", "pub", "restaurant"];

class ClassDbConnection {
    public getAllPoints(): Promise<any> {
        return toPromise(knex.select(["osm_id", "name", "shop", "amenity", "building", "sport", "office", "man_made", st.asGeoJSON("way")])
            // .whereIn(["amenity"], [foods])
                .whereNotNull("shop")
            .whereNotNull("name")
                .from("valid_points"),
        );
    }

    public getLinesAround(lat: number, lon: number, distance: number, route: string): Promise<any> {
        const dist = `ST_Distance(st_transform(oldWay, 4326), ST_GeomFromText('SRID=4326;POINT(${lat} ${lon})', 4326), false)`;
        const data = knex.select(["route", "ref", st.asGeoJSON("way")])
            .from("valid_lines")
            .where(knex.raw(dist), "<", distance)
            .andWhere("route", "=", route);
        console.log(data.toSQL(), data.toQuery());
        return toPromise(data);
    };

    public getPointsAround(lat: number, lon: number, distance: number, key: string, type: string, value: string, parking: number): Promise<any> {
        let data;

        if (isNaN(parking)) {
            const dist = `ST_Distance(st_transform(oldWay, 4326), ST_GeomFromText('SRID=4326;POINT(${lat} ${lon})', 4326), false)`;
            data = knex.select(["osm_id", "name", "shop", "amenity", "building", "sport", "office", "man_made", "operator", "brand", "ref", st.asGeoJSON("way"), knex.raw(dist + " as dist")])
                .from("valid_points")
                .where(knex.raw(dist), "<", distance)
                .andWhere(knex.raw("lower(name)"), "LIKE", `%${key ? key.toLowerCase() : ""}%`)
                .andWhereRaw(type ? (value ? `${type} = '${value}'` : `${type} IS NOT NULL`) : "1 = 1")
                .orderByRaw(dist);
        } else {
            const dist = `ST_Distance(st_transform(valid_points.oldWay, 4326), ST_GeomFromText('SRID=4326;POINT(${lat} ${lon})', 4326), false)`;
            data = knex.distinct([
                "valid_points.osm_id",
                "valid_points.name",
                "valid_points.shop",
                "valid_points.amenity",
                "valid_points.building",
                "valid_points.sport",
                "valid_points.office",
                "valid_points.brand",
                "valid_points.ref",
                "valid_points.operator",
                "valid_points.man_made",
                // knex.raw(st.asGeoJSON("valid_points.way")),
                knex.raw("ST_asGeoJSON(\"valid_points\".\"way\") as way"),
                knex.raw(dist + " as dist")])
                .from("valid_points")
                //.join("all_car_parks", `st.dwithin("all_car_parks.way", "valid_points.way", ${parking}, false)`)
                .joinRaw(`JOIN all_car_parks ON ST_dwithin("all_car_parks"."way", "valid_points"."way", ${parking}, false)`)
                .where(knex.raw(dist), "<", distance)
                .andWhere(knex.raw("lower(valid_points.name)"), "LIKE", `%${key ? key.toLowerCase() : ""}%`)
                .andWhereRaw(type ? (value ? `valid_points.${type} = '${value}'` : `valid_points.${type} IS NOT NULL`) : "1 = 1")
                .orderByRaw(dist);
        }

        console.log(data.toSQL(), data.toQuery());
        return toPromise(data);
    }

    public getStats(): Promise<any> {
        return toPromise(knex.select()
            .from("stats"));
    }

    public getCarParks(): Promise<any> {
        return toPromise(knex.select(["way_area", st.asGeoJSON("way")])
            .from("all_car_parks"));
    }

    public getAllLines(): Promise<any> {
        return toPromise(knex.select(["osm_id", "name", st.asGeoJSON("way")])
            .whereNotNull("name")
            .from("all_lines"));
    }

    public getAllRoads(): Promise<any> {
        return toPromise(knex.select(["osm_id", "name", st.asGeoJSON("way")])
            .whereNotNull("name")
            .from("all_roads"));
    }

    public getAllPolygons(): Promise<any> {
        return toPromise(knex.select(["osm_id", "name", st.asGeoJSON("way")])
            .whereNotNull("name")
            .from("all_polygons"));
    }
}

export const DbConnection = new ClassDbConnection();
