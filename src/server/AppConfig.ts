export class AppConfig {
    public static readonly PORT = process.env.PORT || 3000;
    public static readonly ROOT_FOLDER = __dirname + "/..";
    public static readonly ROOT_PATH = "/.";
}
