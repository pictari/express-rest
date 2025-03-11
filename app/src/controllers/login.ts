import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import { Account } from "../models/orm/account";
import { sign as jwtSign, verify as jwtVerify } from 'jsonwebtoken';
import { AccountDataSource } from '../rdbms';

const accountRepo = AccountDataSource.getRepository(Account);

/**
 * Responds with a JWT if the credentials are in order (appropriate and matching with an extant account)
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 * @returns Returns early if the request body is missing email/password, or the credentials don't match.
 */
export const postLogin = async (req: Request, res: Response) => {

    const email = req.body?.email;
    const password = req.body?.password;

    // no point in going any further without email/password
    if (!email || !password) {
        res.status(400).send("You must provide both an email and password.");
        return;
    }


    // return with 401 if email doesn't match any account
    let account = await accountRepo.findOneBy({ email: email});

    if(account == null || account.password == null) {
        res.status(401).send("Invalid credentials.")
        return;
    }

    const validatePassword = await argon2.verify(account?.password, password);

    // return with 401 if password doesn't match what's stored for that account
    if (!validatePassword) {
        res.status(401).send("Invalid credentials.");
        return;
    }

    // return a JWT if all other checks succeed
    res.status(201).send({ accessToken: createAccessToken(account) });
}

/**
 * Internal method used to create a JWT based on account data.
 * @param account The account to base JWT data on.
 * @returns The JWT token as a base64 encoded string.
 */
const createAccessToken = (account: Account): string => {
    // fall back on an invalid secret if none is registered in the environment file
    const secret = process.env.JWTSECRET || "invalid";
    // fall back on an hour length if none is defined in environment
    const expiry = Number(process.env.JWTEXPIRY) || 3600;

    const payload =
    {
        uuid: account.uuid,
        name: account.name,
        verified: account.verified,
        type: account.userType
    }

    // sign the above data
    const token = jwtSign(payload, secret, {expiresIn: expiry});

    return token;

}