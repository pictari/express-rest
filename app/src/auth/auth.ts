import { Request, Response, NextFunction } from "express";
import { verify as jwtVerify } from "jsonwebtoken";

export const verifyJWT = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {


    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader?.startsWith('Bearer')) {
        res.status(401).send("No Bearer auth header found. Make sure that you're inserting the token in an appropriate header.");
        return;
    }

    const token: string | undefined = authHeader.split(' ')[1];

    if (!token) {
        res.status(401).send();
        return;
    }

    if(process.env.JWTSECRET == undefined) {
        res.status(500).send("The server has a misconfigured secret key. Please let the administrators know.");
        return;
    }

    const secret = process.env.JWTSECRET;

    try {
        const payload = jwtVerify(token, secret);
        res.locals.payload = payload;
        next();
    } catch (err) {
        res.status(403).send();
        return;
    }
};

export const verifyAdministrator = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const jwtRole = res.locals?.payload?.type;
    if (jwtRole == 0) {
        next();
    }
    else {
        res.status(403).send("This is a resource scoped to administrators.");
    }
};

export const verifyModerator = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const jwtRole = res.locals?.payload?.type;
    if (jwtRole == 0 || jwtRole == 1) {
        next();
    }
    else {
        res.status(403).send("This is a resource scoped to moderators and above.");
    }
};

export const verifyOwner = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const jwtRole = res.locals?.payload?.type;
    const requestedId = req.params.uuid;
    const userId = res.locals?.payload?.uuid;
    if (jwtRole == 0 || jwtRole == 1 || userId == requestedId) {
        next();
    }
    else {
        res.status(403).send("This resource is scoped to its owner and moderators.");
    }
};

export const verifyVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const verifyStatus = res.locals?.payload?.verification;
    if (verifyStatus == true) {
        next();
    }
    else {
        res.status(403).send("You must verify your email address before you can access this endpoint.");
    }
};