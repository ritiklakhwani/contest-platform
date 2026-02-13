import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRoutes from "./auth";
import contestRoutes from "./contest";
import problemRoutes from "./problem";

const app = express();

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
});
app.use(limiter);

app.use("", authRoutes)
app.use("", contestRoutes);
app.use("", problemRoutes);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});