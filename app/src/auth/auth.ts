import { Request, Response, NextFunction } from "express";
import { verify as jwtVerify } from "jsonwebtoken";
import { UserType } from "../models/orm/account";

/**
 * Verifies that the JWT signature is valid and then decodes it as part of res.locals.payload
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 * @param next Next function to call in the route function chain.
 * @returns Can return void early depending on where verification fails in the series.
 */
export const verifyJWT = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    // JWT verification should automatically fail if the Authorization header is missing
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader?.startsWith('Bearer')) {
        res.status(401).send("No Bearer auth header found. Make sure that you're inserting the token in an appropriate header.");
        return;
    }

    // JWT verification should fail if no actual token is passed in
    const token: string | undefined = authHeader.split(' ')[1];

    if (!token) {
        res.status(401).send("You must include your token after Bearer.");
        return;
    }

    // the server should refuse to pass any JWT validation if the secret key is misconfigured
    if(process.env.JWTSECRET == undefined) {
        res.status(500).send("The server has a misconfigured secret key. Please let the administrators know.");
        return;
    }

    const secret = process.env.JWTSECRET;


    // try to verify the token using the secret key - add the decoded payload to res.locals and call next function if it passes
    try {
        const payload = jwtVerify(token, secret);
        res.locals.payload = payload;
        next();
    } catch (err) {
        res.status(403).send("Your token either expired or does not conform to the secret key.");
        return;
    }
};

/**
 * Validates that the user has administrator privileges when accessing an endpoint.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 * @param next Next function to call in the route function chain.
 */
export const verifyAdministrator = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const jwtRole = res.locals?.payload?.type;
    if (jwtRole == UserType.admin) {
        next();
    }
    else {
        res.status(403).send("This is a resource scoped to administrators.");
    }
};

/**
 * Validates that the user has moderator or above privileges when accessing an endpoint.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 * @param next Next function to call in the route function chain.
 */
export const verifyModerator = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const jwtRole = res.locals?.payload?.type;
    if (jwtRole == UserType.admin || jwtRole == UserType.moderator) {
        next();
    }
    else {
        res.status(403).send("This is a resource scoped to moderators and above.");
    }
};

/**
 * Validates that the user has moderator or above privileges when accessing an endpoint, OR they own the resource being requested.
 * :uuid in an endpoint must indicate the owner.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 * @param next Next function to call in the route function chain.
 */
export const verifyOwner = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const jwtRole = res.locals?.payload?.type;
    const requestedId = req.params.uuid;
    const userId = res.locals?.payload?.uuid;
    if (jwtRole == UserType.admin || jwtRole == UserType.moderator || userId == requestedId) {
        next();
    }
    else {
        res.status(403).send("This resource is scoped to its owner and moderators.");
    }
};

/**
 * Validates that the user passed email verification in endpoints that should be guarded against
 * dubiously owned accounts.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 * @param next Next function to call in the route function chain.
 */
export const verifyVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const verifyStatus = res.locals?.payload?.verified;
    if (verifyStatus == true) {
        next();
    }
    else {
        res.status(403).send("You must verify your email address before you can access this endpoint.");
    }
};