import express, {
   type Application,
    type Request, 
    type Response } from "express";
import { authRoute } from "./modules/auth/auth.route";
import { globalErrorHandler } from "./middlewares/error.middleware";
import { issuesRoute } from "./modules/issues/issues.route";


const app :Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res:Response)=>{

 res.status(200).json({
    success: true,
    message: 'Welcome to DevPulse Server!',
    author:"DevPulse"
 });

})



app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);


app.use(globalErrorHandler);
export default app