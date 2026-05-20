import dotenv from "dotenv";
import { env } from "process";

dotenv.config({ quiet: true });

const config = {
    port:env.PORT as string,
    database_url: env.DATABASE_URL as string
}

export default config

