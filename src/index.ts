import app from "./app"
import config from "./config";
import { initDB } from "./db";


const main = async() =>{
  initDB();
  
    app.listen(config.port, () =>{
      console.log(`server is running on port ${config.port}`)
    });
};

main();