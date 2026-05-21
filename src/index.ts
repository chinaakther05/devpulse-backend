import app from "./app"
import config from "./config";
import { initDB } from "./db";


const main = async() =>{

try {
  await initDB();
  app.listen(config.port, () =>{
      console.log(`server is running on port ${config.port}`)
    });
  
} catch (error) {
  console.error(" Failed to start the server:", error);
}

};

main();