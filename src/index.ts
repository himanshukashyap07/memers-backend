import "dotenv/config";
import  app  from "./app.js";
import connectDB from "./db/ConnectToDB.js";
import { apiError } from "./utils/apiErrorHandler.js";


const PORT = process.env.PORT;
connectDB().then((): void => {
    const server = app.listen(PORT || 8000, (): void => {
        console.log("server is running at port 8000");
    });
    server.on("error", (error: Error): void => {
        console.log("Error occurred in the server run.");
        throw new apiError(500,"database is not connected")
    });
}).catch((): void => {
    console.log("mongodb connection failed");
});