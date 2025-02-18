import { Request, Response } from "express";
import { AccountDataSource } from "../rdbms";
import { Account, UserType } from "../models/orm/account";
import { Verification } from "../models/orm/verification";
import { Friendship } from "../models/orm/friendship";
import { Block } from "../models/orm/block";
import { PendingFriendship } from "../models/orm/pending_friendship";
import Joi, { date } from "joi";
import { ValidateAccountPost, ValidateAccountPut } from "../models/rest/account";
import argon2 from "argon2";
import { v4 } from "uuid";

const accountRepo = AccountDataSource.getRepository(Account);
const verificationRepo = AccountDataSource.getRepository(Verification);
const friendshipRepo = AccountDataSource.getRepository(Friendship);
const pendingRepo = AccountDataSource.getRepository(PendingFriendship);
const blockRepo = AccountDataSource.getRepository(Block);

// used for verification links
const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";

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

// general endpoint for account creation
export const postNewAccount = async (req: Request, res: Response) => { 
    try {
        let accountToCreate = req.body;

        let validationResult : Joi.ValidationResult = ValidateAccountPost(accountToCreate);

        if (validationResult.error) {
            res.status(400).json(validationResult.error);
            return;
        }

        
        let emailExists = await accountRepo.findOneBy({ email: accountToCreate.email});
        if(emailExists != null) {
            res.status(400).send(`This email is already in use.`);
            return;
        }

        let account : Account = new Account();
        let verification : Verification = new Verification();

        // theoretically, UUID will never conflict
        let newUuid = v4();

        account.uuid = newUuid;

        account.name = accountToCreate.name;
        account.password = await argon2.hash(accountToCreate.password);
        account.verified = false;
        account.userType = UserType.none;
        account.dateGenerated = new Date();
        account.gamesPlayed = 0;
        account.totalFriends = 0;
        account.totalRating = 0;
        account.verified = false;
        account.email = accountToCreate.email;
        
        await AccountDataSource.manager.save(account);

        verification.accountUuid = newUuid;
        verification.timeGenerated = new Date();
        verification.address = randomStringCreator(32);

        await AccountDataSource.manager.save(verification);

        res.status(201).send(`Registration succeeded. Please verify your email.`);
    } catch(error) {
        if (error instanceof Error) {
            console.log(`Issue creating new account: ${error.message}`);
        }
        else {
            console.log(`Error: ${error}`);
        }
        res.status(400).send(`Couldn't create new account.`);
    }
}

// self explanatory
export const postNewFriendRequest  = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    // these checks also double in function as fetching the needed accounts to
    // create a request
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid});

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

    // check for blocks, since blocked players (on either side) can't send
    // requests to each other
    let blocked = await blockRepo.findOneBy({accountUuid: requesterUuid});

    if(blocked != null) {
        res.status(400).send(`A block exists between the two accounts.`);
        return;
    }

    let blocked2 = await blockRepo.findOneBy({accountUuid: requestedUuid});

    if(blocked2 != null) {
        res.status(400).send(`A block exists between the two accounts.`);
        return;
    }

    const pendingRequest = new PendingFriendship();
    pendingRequest.account = verifyExistence;
    pendingRequest.account2 = verifyExistence2;
    
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
    newBlock.account = verifyExistence;
    newBlock.account2 = verifyExistence2;

    // remove any friendship between the two people
    let toSort = [requesterUuid, requestedUuid];
    toSort.sort();
    let friends = await friendshipRepo.findOneBy({ accountUuid:toSort[0], account2Uuid:toSort[1]});

    if(friends != null) {
        await AccountDataSource
        .createQueryBuilder()
        .delete()
        .from(Friendship)
        .where("accountUuid = :id AND account2Uuid = :id2", { id: toSort[0], id2: toSort[1] })
        .execute().then((value) => {
            console.log(value);
        });

        if(verifyExistence.totalFriends != null) {
            verifyExistence.totalFriends -= 1;
        }
    
        if(verifyExistence2.totalFriends != null) {
            verifyExistence2.totalFriends -= 1;
        }
    
        await accountRepo.save(verifyExistence);
        await accountRepo.save(verifyExistence2);
    }

    // remove any pending friendship requests from either person
    let possibleRequest = await pendingRepo.findOneBy({accountUuid:requesterUuid});
    if(possibleRequest != null) {
        await AccountDataSource
        .createQueryBuilder()
        .delete()
        .from(PendingFriendship)
        .where("accountUuid = :id AND account2Uuid = :id2", { id: requesterUuid, id2: requestedUuid })
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
        .where("accountUuid = :id AND account2Uuid = :id2", { id: requestedUuid, id2: requesterUuid })
        .execute().then((value) => {
            console.log(value);
        });
    }

    await AccountDataSource.manager.save(newBlock);
    res.status(201).send(`Blocked user with ID ${requestedUuid}.`);
}

// there is no better HTTP verb than POST for accepting friend requests
export const postAcceptRequest  = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid});

    if(verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
        return;
    } 
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid});

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
    friendship.accountUuid = toSort[0];
    friendship.account2Uuid = toSort[1];
    
    await AccountDataSource.manager.save(friendship);

    if(verifyExistence.totalFriends == null) {
        verifyExistence.totalFriends = 1;
    } else {
        verifyExistence.totalFriends += 1;
    }

    if(verifyExistence2.totalFriends == null) {
        verifyExistence2.totalFriends = 1;
    } else {
        verifyExistence2.totalFriends += 1;
    }

    await accountRepo.save(verifyExistence);
    await accountRepo.save(verifyExistence2);
    
    res.status(201).send(`Created a friendship.`);
}

// change settings for account
// complete email checks when the account create route is done
export const putNewAccountSettings = async (req: Request, res: Response) => {
    try {
        let newSettings = req.body;

        let validationResult : Joi.ValidationResult = ValidateAccountPut(newSettings);

        if (validationResult.error) {
            res.status(400).json(validationResult.error);
            return;
        }

        let requesterUuid = req.params.uuid;

        // does the requester UUID even exist?
        let requestingAccount = await accountRepo.findOneBy({ uuid: requesterUuid});

        if(requestingAccount == null) {
            res.status(404).send(`The requester UUID doesn't exist.`);
            return;
        } 

        let email = req.body.email;
        if(email != undefined && email != null) {
            let emailExists = await accountRepo.findOneBy({ email: email});
            if(emailExists != null) {
                res.status(400).send(`This email is already in use.`);
                return;
            }
            let verification : Verification = new Verification();
            verification.accountUuid = requestingAccount.uuid;
            verification.timeGenerated = new Date();
            verification.address = randomStringCreator(32);
    
            await verificationRepo.create(verification);
            requestingAccount.email = email;
            requestingAccount.verified = false;
        }

        if(!requestingAccount.verified) {
            await accountRepo.save(requestingAccount);
            res.status(403).send('You cannot change any further settings until you verify your email.');
            return;
        }

        let about = req.body.about;
        if(about != undefined && about != null) {
            requestingAccount.about == about;
        }

        let name = req.body.name;
        if(name != undefined && name != null) {
            requestingAccount.name == name;
        }

        let password = req.body.password;
        if(password != undefined && password != null) {
            requestingAccount.password = await argon2.hash(password);
        }
        
        await accountRepo.save(requestingAccount);
        res.status(204).send('Changed account settings.');
    } catch(error) {
        if (error instanceof Error) {
            console.log(`Problem updating account settings: ${error.message}`);
        }
        else {
            console.log(`Error: ${error}`);
        }
        res.status(400).send(`Unable to update account settings.`);
    }
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

    if(verifyExistence.totalFriends != null) {
        verifyExistence.totalFriends -= 1;
    }

    if(verifyExistence2.totalFriends != null) {
        verifyExistence2.totalFriends -= 1;
    }

    await accountRepo.save(verifyExistence);
    await accountRepo.save(verifyExistence2);

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

function randomStringCreator(length: number) {
    let newString = '';

    for(let i = 0; i < length; i++) {
        newString += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return newString;
}