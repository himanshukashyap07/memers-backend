import "dotenv/config";
import  app  from "./app.js";
import connectDB from "./db/ConnectToDB.js";

const PORT = process.env.PORT || 8000;

// Handle database connection and server startup
const initializeApp = async () => {
    try {
        await connectDB();
        
        // Only start the server listener if we're not running in a serverless environment
        // Vercel handles the listener itself
        if (process.env.NODE_ENV !== "production") {
            app.listen(PORT, () => {
                console.log(`Server is running at port ${PORT}`);
            });
        }
    } catch (error) {
        console.error("Failed to initialize app:", error);
    }
};

initializeApp();

// Export for Vercel
export default app;