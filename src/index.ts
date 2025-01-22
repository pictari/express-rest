import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import roomsRouter from "./routes/rooms";
import "reflect-metadata";
const cors = require('cors');

const PORT = 3000;
const app: Application = express();

app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());

app.use('/rooms', roomsRouter)

var server = app.listen(PORT, function () {
    console.log("Listening on port: " + PORT)
});