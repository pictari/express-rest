import { Request, Response } from "express";
import { AccountDataSource } from "../rdbms";
import { Account } from "../models/orm/account";
import { Verification } from "../models/orm/verification";
import { Friendship } from "../models/orm/friendship";
import { Block } from "../models/orm/block";
import { PendingFriendship } from "../models/orm/pending_friendship";
import { UUID } from "crypto";

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

// self explanatory
export const postNewFriendRequest  = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    // these checks also double in function as fetching the needed accounts to
    // create a request
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid})

    if(verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
        return;
    } 
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid})

    if(verifyExistence2 == null) {
        res.status(404).send(`The requested UUID doesn't exist.`);
        return;
    }

    // check that the friendship doesn't already exist
    let toSort = [requesterUuid, requestedUuid];
    toSort.sort();
    let friends = await friendshipRepo.findOneBy({ accountUuid:toSort[0], account2Uuid:toSort[1]});

    if(friends != null) {
        res.status(400).send(`This friendship already exists.`);
        return;
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
        res.status(400).send(`A request for this friendship already exists.`);
        return;
    }

    const pendingRequest = new PendingFriendship();
    pendingRequest.account == verifyExistence;
    pendingRequest.account2 == verifyExistence2;
    
    await AccountDataSource.manager.save(pendingRequest);
    res.status(201).send(`Created a friendship request.`);
    return;
}

// self explanatory
export const postNewBlock  = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    // these checks also double in function as fetching the needed accounts to
    // create a request
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid})

    if(verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
        return;
    } 
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid})

    if(verifyExistence2 == null) {
        res.status(404).send(`The requested UUID doesn't exist.`);
        return;
    }


    // check that block doesn't already exist
    let blocked = await blockRepo.findOneBy({accountUuid: requesterUuid});

    if(blocked != null) {
        res.status(400).send(`This account was already blocked.`);
        return;
    }

    const newBlock = new Block();
    newBlock.account == verifyExistence;
    newBlock.account2 == verifyExistence2;

    // remove any friendship between the two people
    let toSort = [requesterUuid, requestedUuid];
    toSort.sort();
    let friends = await friendshipRepo.findOneBy({ accountUuid:toSort[0], account2Uuid:toSort[1]});

    if(friends != null) {
        await AccountDataSource
        .createQueryBuilder()
        .delete()
        .from(Friendship)
        .where("accountUuid = :id, account2Uuid = :id2", { id: toSort[0], id2: toSort[1] })
        .execute().then((value) => {
            console.log(value);
        });
    }

    // remove any pending friendship requests from either person
    let possibleRequest = await pendingRepo.findOneBy({accountUuid:requesterUuid});
    if(possibleRequest != null) {
        await AccountDataSource
        .createQueryBuilder()
        .delete()
        .from(PendingFriendship)
        .where("accountUuid = :id, account2Uuid = :id2", { id: requesterUuid, id2: requestedUuid })
        .execute().then((value) => {
            console.log(value);
        });
    }

    let possibleRequest2 = await pendingRepo.findOneBy({accountUuid:requestedUuid});
    if(possibleRequest2 != null) {
        await AccountDataSource
        .createQueryBuilder()
        .delete()
        .from(PendingFriendship)
        .where("accountUuid = :id, account2Uuid = :id2", { id: requestedUuid, id2: requesterUuid })
        .execute().then((value) => {
            console.log(value);
        });
    }
}

// there is no better HTTP verb than POST for accepting friend requests
export const postAcceptRequest  = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid})

    if(verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
        return;
    } 
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid})

    if(verifyExistence2 == null) {
        res.status(404).send(`The requested UUID doesn't exist.`);
        return;
    }

    // check that the request exists
    let requests = await pendingRepo.find({
        select: {
            accountUuid: true,
            account2Uuid: true
        },
        where: {
            accountUuid: requestedUuid,
            account2Uuid: requesterUuid
        }
    });

    if(requests.length == 0) {
        res.status(404).send(`There is no such request for a friendship.`);
        return;
    }

    await AccountDataSource.manager.remove(requests[0]);

    let toSort = [requesterUuid, requestedUuid];
    toSort.sort();
    const friendship = new Friendship();
    friendship.accountUuid == toSort[0];
    friendship.account2Uuid == toSort[1];
    
    await AccountDataSource.manager.save(friendship);
    res.status(201).send(`Created a friendship.`);
}

// effectively declines the incoming request
export const deleteRequest  = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid})

    if(verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
        return;
    } 
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid})

    if(verifyExistence2 == null) {
        res.status(404).send(`The requested UUID doesn't exist.`);
        return;
    }

    // check that the request exists
    let requests = await pendingRepo.find({
        select: {
            accountUuid: true,
            account2Uuid: true
        },
        where: {
            accountUuid: requestedUuid,
            account2Uuid: requesterUuid
        }
    });

    if(requests.length == 0) {
        res.status(404).send(`There is no such request for a friendship.`);
        return;
    }

    await AccountDataSource.manager.remove(requests[0]);

    res.status(204).send(`Rejected the friendship request.`);
}

// deletes the two way relationship
export const deleteFriend  = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid})

    if(verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
        return;
    } 
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid})

    if(verifyExistence2 == null) {
        res.status(404).send(`The requested UUID doesn't exist.`);
        return;
    }

    let toSort = [requesterUuid, requestedUuid];
    toSort.sort();
    let friends = await friendshipRepo.findOneBy({ accountUuid:toSort[0], account2Uuid:toSort[1]});

    if(friends == null) {
        res.status(404).send(`No such friendship exists`);
        return;
    }

    await AccountDataSource.manager.remove(friends);

    res.status(204).send(`Deleted the friendship.`);
}

// deletes the two way relationship
export const deleteBlock  = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid})

    if(verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
        return;
    } 
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid})

    if(verifyExistence2 == null) {
        res.status(404).send(`The requested UUID doesn't exist.`);
        return;
    }

    let block = await blockRepo.findOneBy({ accountUuid:requesterUuid, account2Uuid:requestedUuid});

    if(block == null) {
        res.status(404).send(`No such block exists.`);
        return;
    }

    await AccountDataSource.manager.remove(block);

    res.status(204).send(`Removed the block.`);
}