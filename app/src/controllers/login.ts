import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import { Account } from "../models/orm/account";
import { sign as jwtSign, verify as jwtVerify } from 'jsonwebtoken';
import { AccountDataSource } from '../rdbms';

const accountRepo = AccountDataSource.getRepository(Account);

export const postLogin = async (req: Request, res: Response) => {

    const email = req.body?.email;
    const password = req.body?.password;

    if (!email || !password) {
        res.status(400).send("You must provide both an email and password.");
        return;
    }

    let account = await accountRepo.findOneBy({ email: email});

    if(account == null || account.password == null) {
        res.status(401).send("Invalid credentials.")
        return;
    }

    const validatePassword = await argon2.verify(account?.password, password);

    if (!validatePassword) {
        res.status(401).send("Invalid credentials.");
        return;
    }

    res.status(201).send({ accessToken: createAccessToken(account) });
}

const createAccessToken = (account: Account): string => {

    const secret = process.env.JWTSECRET || "invalid";
    const expiry = Number(process.env.JWTEXPIRY) || 3600;

    const payload =
    {
        uuid: account.uuid,
        name: account.name,
        verified: account.verified,
        type: account.userType
    }

    const token = jwtSign(payload, secret, {expiresIn: expiry});

    return token;

}