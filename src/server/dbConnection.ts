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

    public getPointsAround(lat: number, lon: number, distance: number, key: string, type: string, value: string, parking: number, privateOnly: boolean, building: boolean, inMall: boolean): Promise<any> {
        const dist = `ST_Distance(st_transform(valid_points.oldWay, 4326), ST_GeomFromText('SRID=4326;POINT(${lat} ${lon})', 4326), false)`;
        let data = knex.select([
            "valid_points.osm_id",
            "valid_points.name",
            "valid_points.shop",
            "valid_points.amenity",
            "valid_points.building",
            "valid_points.sport",
            "valid_points.office",
            "valid_points.brand",
            "valid_points.man_made",
            "valid_points.ref",
            "valid_points.operator",
            knex.raw("ST_asGeoJSON(\"valid_points\".\"way\") as way"),
            knex.raw(dist + " as dist")])
            .from("valid_points");

        if (!isNaN(parking)) {
            data = data.joinRaw(`JOIN all_car_parks ON ST_dwithin("all_car_parks"."way", "valid_points"."way", ${parking}, false)`);
        }
        if (inMall) {
            data = data.joinRaw(`JOIN valid_polygons ON ST_Contains("valid_polygons"."way", "valid_points"."way") AND "valid_polygons"."shop" = 'mall'`);
            /*
            data = data.and.whereExists(() => {
                knex.select(knex.raw(1)).from("valid_polygons").where()
            })
            */
        }

        data = data.where(knex.raw(dist), "<", distance)
            .andWhere(knex.raw("lower(valid_points.name)"), "LIKE", `%${key ? key.toLowerCase() : ""}%`)
            .andWhereRaw(type ? (value ? `valid_points.${type} = '${value}'` : `valid_points.${type} IS NOT NULL`) : "1 = 1");


        data = data.orderByRaw(dist);

        console.log(data.toSQL(), data.toQuery());
        return toPromise(data);
    }

    public getStats(): Promise<any> {
        return toPromise(knex.select()
            .from("stats"));
    }

    public getCarParks(alsoPrivate: boolean, building: boolean): Promise<any> {
        let query = knex.select(["way_area", "landuse", "building", "surface", "access", st.asGeoJSON("way")]);
        if (!alsoPrivate) {
            query = query.andWhere(knex.raw("(access != 'private' OR access IS NULL)"));
        }
        if (building) {
            query = query.andWhereNot("building", null);
        }
        console.log(query.toQuery());
        return toPromise(query.from("all_car_parks"));
    }

    public getAllLines(): Promise<any> {
        return toPromise(knex.select(["osm_id", "name", st.asGeoJSON("way")]).whereNotNull("name")
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
