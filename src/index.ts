import "dotenv/config";
import app from "./app.js";
import connectDB from "./db/ConnectToDB.js";

const PORT = process.env.PORT || 8000;

// Handle database connection and server startup
const initializeApp = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server is running at port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to initialize app:", error);
    }
};

initializeApp();

// Export for Vercel
export default app;