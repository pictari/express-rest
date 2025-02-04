import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import roomsRouter from "./routes/rooms";
import accountRouter from "./routes/account";
import "reflect-metadata";
const cors = require('cors');

dotenv.config();

const PORT = 3000;
const app: Application = express();

app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());

app.use('/rooms', roomsRouter);
app.use('/account', accountRouter);

var server = app.listen(PORT, function () {
    console.log("Listening on port: " + PORT)
});