import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import cors from "cors";
import type { Request, Response } from "express";
import authRoutes from "./auth";
import contestRoutes from "./contest";
import problemRoutes from "./problem";

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/problems', problemRoutes);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});