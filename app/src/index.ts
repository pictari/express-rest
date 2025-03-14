import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import roomsRouter from "./routes/rooms";
import accountRouter from "./routes/account";
import verificationRouter from "./routes/verification";
import authRouter from "./routes/auth";
import gameRouter from "./routes/game";
import "reflect-metadata";
const cors = require('cors');

dotenv.config();

const PORT = 3000;
const app: Application = express();

//TODO: limit CORS once we're out of testing phase
app.use(cors());

app.use(morgan("tiny"));
app.use(express.json());

// register all endpoint routers
app.use('/rooms', roomsRouter);
app.use('/account', accountRouter);
app.use('/verification', verificationRouter);
app.use('/login', authRouter);
app.use('/game', gameRouter);

var server = app.listen(PORT, function () {
    console.log("Listening on port: " + PORT)
});