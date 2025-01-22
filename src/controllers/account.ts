import { Request, Response } from "express";
import { AccountDataSource } from "../rdbms";
import { Account } from "../models/orm/account";
import { Verification } from "../models/orm/verification";

const accountRepo = AccountDataSource.getRepository(Account);
const verificationRepo = AccountDataSource.getRepository(Verification);

export const getPublicAccountInfo = async (req: Request, res: Response) =>
{
    let requestedUuid = req.params.uuid;
    let matchingAccount = await accountRepo.find({
            select: {
                userType: true,
                name: true,
                about: true
            },
            where: {
                uuid: requestedUuid
            }
        }
    )

    if(matchingAccount.length == 0) {
        res.status(404).send(`Cannot find an account with that UUID.`);
    } else {
        res.status(200).json(matchingAccount[0]);
    }
}

export const getPersonalAccountInfo = async (req: Request, res: Response) => {
    let requestedUuid = req.params.uuid;
    let personalInfo = await accountRepo.find({
            select: {
                email: true
            },
            where: {
                uuid: requestedUuid
            }
        }
    )

    if(personalInfo.length == 0) {
        res.status(404).send(`Cannot find an account with that UUID.`);
    } else {
        res.status(200).json(personalInfo[0]);
    }
}