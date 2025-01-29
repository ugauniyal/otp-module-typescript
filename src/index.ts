import express, { Request, Response, Router } from "express";
import redisClient from "./config/redisConfig.js";
import router from "./routes/otpRoutes.js";


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', true);

app.use("/api", router);




// Redis Connection
await redisClient.connect();
redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Start server
const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;