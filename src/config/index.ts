import dotenv from "dotenv";
import { env } from "process";

dotenv.config({ quiet: true });

const config = {
    port:env.PORT as string,
    database_url: env.DATABASE_URL as string,
    jwt_secret: process.env.JWT_SECRET || "mySuperSecretLongTokenKey123456!", 
    jwt_expires_in: process.env.JWT_EXPIRES_IN || "1d"
}

export default config

