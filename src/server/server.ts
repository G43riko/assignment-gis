import * as bodyParser from "body-parser";
import * as express from "express";
import * as path from "path";
import {AppConfig} from "./AppConfig";
import {DbConnection} from "./dbConnection";

let serverInstance: Server;

export class Server {
    public app: express.Application;

    public constructor() {
        this.app = express();
        this.app.use(bodyParser.json());
        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
            res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
            res.setHeader("Access-Control-Allow-Credentials", "true");
            next();
        });

        this.app.get(AppConfig.ROOT_PATH, (req, res) => res.send("Hello World!"));

        this.app.get("/points", (req, res) => {
            Server.send(res, DbConnection.getAllPoints());
        });
        this.app.get("/linesAround", (req, res) => {
            Server.send(res, DbConnection.getLinesAround(parseFloat(req.query.lat),
                parseFloat(req.query.lon),
                parseFloat(req.query.dist),
                req.query.route));
        });
        this.app.get("/pointsAround", (req, res) => {
            Server.send(res, DbConnection.getPointsAround(parseFloat(req.query.lat),
                parseFloat(req.query.lon),
                parseFloat(req.query.dist),
                req.query.key,
                req.query.type,
                req.query.value,
                req.query.parking));
        });
        this.app.get("/lines", (req, res) => {
            Server.send(res, DbConnection.getAllLines());
        });
        this.app.get("/carParks", (req, res) => {
            Server.send(res, DbConnection.getCarParks());
        });
        this.app.get("/roads", (req, res) => {
            Server.send(res, DbConnection.getAllRoads());
        });
        this.app.get("/stats", (req, res) => {
            Server.send(res, DbConnection.getStats());
        });
        this.app.get("/polygons", (req, res) => {
            Server.send(res, DbConnection.getAllPolygons());
        });
        this.app.get("/test", (req, res) => {
            res.sendFile(path.resolve("dist/pages/index.html"));
        });

        this.app.listen(AppConfig.PORT, () => console.log(`Example app listening on port ${AppConfig.PORT}!`));
    }

    public static bootstrap(): Server {
        if (!serverInstance) {
            serverInstance = new Server();
        }
        return serverInstance;
    }

    private static send(res: express.Response, data: Promise<any>): void {
        data.then((content) => {
            res.json({
                content,
                message: null,
                error: null,
            });
        }).catch((error) => {
            res.json({
                content: null,
                message: error.message,
                error,
            });
        });
    }

}
