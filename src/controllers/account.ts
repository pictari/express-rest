import { Request, Response } from "express";
import { AccountDataSource } from "../rdbms";
import { Account } from "../models/orm/account";
import { Verification } from "../models/orm/verification";
import { Friendship } from "../models/orm/friendship";
import { Block } from "../models/orm/block";
import { PendingFriendship } from "../models/orm/pending_friendship";

const accountRepo = AccountDataSource.getRepository(Account);
const verificationRepo = AccountDataSource.getRepository(Verification);
const friendshipRepo = AccountDataSource.getRepository(Friendship);
const pendingRepo = AccountDataSource.getRepository(PendingFriendship);
const blockRepo = AccountDataSource.getRepository(Block);

// use case is profile page
export const getPublicAccountStatistics = async (req: Request, res: Response) =>
{
    let requestedUuid = req.params.uuid;
    let matchingAccount = await accountRepo.find({
            select: {
                userType: true,
                name: true,
                about: true,
                dateGenerated: true,
                gamesPlayed: true,
                totalRating: true,
                totalFriends: true
            },
            where: {
                uuid: requestedUuid
            }
        }
    );

    if(matchingAccount.length == 0) {
        res.status(404).send(`Cannot find an account with that UUID.`);
    } else {
        res.status(200).json(matchingAccount[0]);
    }
}

// use case is room and friend listings
export const getPublicAccountShortened = async (req: Request, res: Response) =>
{
        let requestedUuid = req.params.uuid;
        let matchingAccount = await accountRepo.find({
                select: {
                    userType: true,
                    name: true
                },
                where: {
                    uuid: requestedUuid
                }
            }
        );
    
        if(matchingAccount.length == 0) {
            res.status(404).send(`Cannot find an account with that UUID.`);
        } else {
            res.status(200).json(matchingAccount[0]);
        }
}

// use case is personal settings
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
    );

    if(personalInfo.length == 0) {
        res.status(404).send(`Cannot find an account with that UUID.`);
    } else {
        res.status(200).json(personalInfo[0]);
    }
}

// use case is profile page (both for visitors and the owner)
export const getAccountFriends = async (req: Request, res: Response) => {
    let requestedUuid = req.params.uuid;

    // friends are bidirectional (both can terminate the relationship)
    // so the other UUID can be in either field due to sorting
    let friends = await friendshipRepo.find({
            select: {
                accountUuid: true,
                account2Uuid: true
            },
            where: [
                {accountUuid: requestedUuid},
                {account2Uuid: requestedUuid}
            ]
        }
    );

    if(friends.length == 0) {
        res.status(404).send(`Cannot find an account with that UUID OR that account has no friends.`);
    } else {
        res.status(200).json(friends);
    }
}

// use case is profile page (only for the owner)
export const getAccountPendingFriendships = async (req: Request, res: Response) => {
    let requestedUuid = req.params.uuid;

    // while requests are unidirectional, a person may want to see the
    // pending requests that THEY sent, as well as those that are sent TO them

    // account owner's UUID in the first col = request was sent BY them
    // account owner's UUID in the second col = request was sent TO them
    let friends = await friendshipRepo.find({
        select: {
            accountUuid: true,
            account2Uuid: true
        },
        where: [
            {accountUuid: requestedUuid},
            {account2Uuid: requestedUuid}
        ]
    }
);

    if(friends.length == 0) {
        res.status(404).send(`Cannot find an account with that UUID OR that account has no unresolved requests.`);
    } else {
        res.status(200).json(friends);
    }
}

// use case is profile page (only for the owner)
export const getAccountBlockedList = async (req: Request, res: Response) => {
    let requestedUuid = req.params.uuid;

    // for blocks, the instigating account is always the first one as it's
    // unidirectional
    let blocked = await blockRepo.find({
            select: {
                account2Uuid: true
            },
            where: {
                accountUuid: requestedUuid
            }
        }
    );

    if(blocked.length == 0) {
        res.status(404).send(`Cannot find an account with that UUID OR that account never blocked anyone.`);
    } else {
        res.status(200).json(blocked);
    }
}

export const postNewFriendRequest  = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid})

    if(verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
    } 
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid})

    if(verifyExistence2 == null) {
        res.status(404).send(`The requested UUID doesn't exist.`);
    }

    // check that the request doesn't exist already

    // account owner's UUID in the first col = request was sent BY them
    // account owner's UUID in the second col = request was sent TO them
    let requests = await pendingRepo.find({
        select: {
            accountUuid: true,
            account2Uuid: true
        },
        where: [
            {accountUuid: requesterUuid, account2Uuid: requestedUuid},
            {accountUuid: requestedUuid, account2Uuid: requesterUuid}
        ]
    });

    if(requests.length != 0) {
        // 409 = Conflict
        res.status(409).send(`A request for this friendship already exists.`);
    }

    const pendingRequest = new PendingFriendship()
    pendingRequest.account == verifyExistence;
    pendingRequest.account2 == verifyExistence2;
    
    await AccountDataSource.manager.save(pendingRequest);
    res.status(201).send(`Created a friendship request.`);
}