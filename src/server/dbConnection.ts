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

class ClassDbConnection {
    public getAllPoints(): Promise<any> {
        return toPromise(knex.select(["osm_id", "name", st.asGeoJSON("way")])
            .whereNotNull("name")
            .from("valid_points"));
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
