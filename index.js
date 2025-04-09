import ConnectDB from "./src/config/db_connect.js";
import dotenv from "dotenv";
import app from "./app.js";

// Load environment variables from .env file for local development
dotenv.config({
    path: '.env' 
});

const PORT = process.env.PORT || 3000;

ConnectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("Error in app:", error);
    });

    // Start the server
    app.listen(PORT, () => {
        console.log(`Server is listening at ${PORT}`);
    });
})
.catch((error) => {
    console.log("MongoDB connection failed. Error:", error);
});
