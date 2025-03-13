import { Request, Response } from "express";
import { AccountDataSource } from "../rdbms";
import { Account, UserType } from "../models/orm/account";
import { Verification } from "../models/orm/verification";
import { Friendship } from "../models/orm/friendship";
import { Block } from "../models/orm/block";
import { PendingFriendship } from "../models/orm/pending_friendship";
import Joi from "joi";
import { ValidateAccountPost, ValidateAccountPut } from "../models/rest/account";
import argon2 from "argon2";
import { v4 } from "uuid";
import { Like } from "typeorm";

const accountRepo = AccountDataSource.getRepository(Account);
const friendshipRepo = AccountDataSource.getRepository(Friendship);
const pendingRepo = AccountDataSource.getRepository(PendingFriendship);
const blockRepo = AccountDataSource.getRepository(Block);

// used for verification links
// each address has a 1 in 64^32 chance to generate so conflicts are unlikely
const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";

/**
 * Retrieves data for display on the public account profile page.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const getPublicAccountStatistics = async (req: Request, res: Response) => {
    let requestedUuid = req.params.uuid;
    let matchingAccount = await accountRepo.find({
        // refine select to ONLY public data
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

    if (matchingAccount.length == 0) {
        res.status(404).send(`Cannot find an account with that UUID.`);
    } else {
        res.status(200).json(matchingAccount[0]);
    }
}

/**
 * Retrieves data for display on the server/friend listings.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const getPublicAccountShortened = async (req: Request, res: Response) => {
    let requestedUuid = req.params.uuid;
    let matchingAccount = await accountRepo.find({
        // refine select to the smallest subset of data necessary
        select: {
            userType: true,
            name: true
        },
        where: {
            uuid: requestedUuid
        }
    }
    );

    if (matchingAccount.length == 0) {
        res.status(404).send(`Cannot find an account with that UUID.`);
    } else {
        res.status(200).json(matchingAccount[0]);
    }
}

/**
 * Retrieves private data for display within the owner's settings.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const getPersonalAccountInfo = async (req: Request, res: Response) => {
    let requestedUuid = req.params.uuid;
    let personalInfo = await accountRepo.find({
        // currently, the only private data we have is email
        select: {
            email: true
        },
        where: {
            uuid: requestedUuid
        }
    }
    );

    if (personalInfo.length == 0) {
        res.status(404).send(`Cannot find an account with that UUID.`);
    } else {
        res.status(200).json(personalInfo[0]);
    }
}

/**
 * Retrieves a public friend list for an account.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
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
            { accountUuid: requestedUuid },
            { account2Uuid: requestedUuid }
        ]
    }
    );

    if (friends.length == 0) {
        res.status(404).send(`Cannot find an account with that UUID OR that account has no friends.`);
    } else {
        res.status(200).json(friends);
    }
}

/**
 * Retrieves a list of all pending friendship requests on either side (either as a sender or receiver)
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const getAccountPendingFriendships = async (req: Request, res: Response) => {
    let requestedUuid = req.params.uuid;

    // while requests are unidirectional, a person may want to see the
    // pending requests that THEY sent, as well as those that are sent TO them

    // account owner's UUID in the first col = request was sent BY them
    // account owner's UUID in the second col = request was sent TO them
    let friends = await pendingRepo.find({
        select: {
            accountUuid: true,
            account2Uuid: true
        },
        where: [
            { accountUuid: requestedUuid },
            { account2Uuid: requestedUuid }
        ]
    }
    );

    if (friends.length == 0) {
        res.status(404).send(`Cannot find an account with that UUID OR that account has no unresolved requests.`);
    } else {
        res.status(200).json(friends);
    }
}

/**
 * Retrieves a list of all account UUIDs blocked by this account.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
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

    if (blocked.length == 0) {
        res.status(404).send(`Cannot find an account with that UUID OR that account never blocked anyone.`);
    } else {
        res.status(200).json(blocked);
    }
}

/**
 * Retrieves a list of accounts with matching names to be used in search queries.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const getAccountSearchByName = async (req: Request, res: Response) => {
    let requestedName = req.params.name;

    let accounts = await accountRepo.find({
        take: 10,
        select: {
            // the name is selected for the display, the UUID is selected for making any further requests
            uuid: true,
            name: true
        },
        where: {
            // search with a wildcard
            name: Like(`%${requestedName}%`)
        }
    }
    );

    if (accounts.length == 0) {
        res.status(404).send(`Cannot find any accounts with that name.`);
    } else {
        res.status(200).json(accounts);
    }
}

/**
 * General endpoint used in creating accounts.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const postNewAccount = async (req: Request, res: Response) => {
    try {
        let accountToCreate = req.body;

        // check that all the data being passed in the body is valid (conforms to requirements outlined in the REST Account object file)
        let validationResult: Joi.ValidationResult = ValidateAccountPost(accountToCreate);

        if (validationResult.error) {
            res.status(400).json(validationResult.error);
            return;
        }

        // try to find an existing account by email; if succeeds, do not allow the creation to proceed
        let emailExists = await accountRepo.findOneBy({ email: accountToCreate.email });
        if (emailExists != null) {
            res.status(400).send(`This email is already in use.`);
            return;
        }

        // try to find an existing account by name; if succeeds, do not allow the creation to proceed
        let nameExists = await accountRepo.findOneBy({ name: accountToCreate.name });
        if (nameExists != null) {
            res.status(400).send(`This name is already in use.`);
            return;
        }

        // begin creating new accounts and associated verification entity
        let account: Account = new Account();
        let verification: Verification = new Verification();

        // theoretically, UUID will never conflict
        let newUuid = v4();

        account.uuid = newUuid;

        account.name = accountToCreate.name;
        account.password = await argon2.hash(accountToCreate.password);
        account.email = accountToCreate.email;
        // default data
        account.verified = false;
        account.userType = UserType.none;
        account.dateGenerated = new Date();
        account.gamesPlayed = 0;
        account.totalFriends = 0;
        account.totalRating = 0;
        account.verified = false;

        // try to create the account in the entity manager
        await AccountDataSource.manager.save(account);

        // generate a verification based on the newly created account
        verification.accountUuid = newUuid;
        verification.timeGenerated = new Date();
        verification.address = randomStringCreator(32);

        // try to create the verification in the entity manager
        await AccountDataSource.manager.save(verification);
        //REMOVE VERIFICATION LINK FROM MESSAGE IN FINAL VERSION!! THIS IS JUST FOR TESTING IN DEV!
        res.status(201).send(`Registration succeeded. Please verify your email. ${verification.address}`);
        return;
    } catch (error) {
        if (error instanceof Error) {
            console.log(`Issue creating new account: ${error.message}`);
        }
        else {
            console.log(`Error: ${error}`);
        }
        res.status(500).send(`Couldn't create new account.`);
    }
}

/**
 * Adds a new pending friend request to the database
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const postNewFriendRequest = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    // these checks also double in function as fetching the needed accounts to
    // create a request, and also to conform to strict TypeScript validation
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid });

    if (verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
        return;
    }
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid })

    if (verifyExistence2 == null) {
        res.status(404).send(`The requested UUID doesn't exist.`);
        return;
    }

    // check that the friendship doesn't already exist
    let toSort = [requesterUuid, requestedUuid];
    toSort.sort();
    let friends = await friendshipRepo.findOneBy({ accountUuid: toSort[0], account2Uuid: toSort[1] });

    // if it does, don't proceed
    if (friends != null) {
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
            { accountUuid: requesterUuid, account2Uuid: requestedUuid },
            { accountUuid: requestedUuid, account2Uuid: requesterUuid }
        ]
    });

    // if it does, don't proceed
    if (requests.length != 0) {
        res.status(400).send(`A request for this friendship already exists.`);
        return;
    }

    // check for blocks, since blocked players (on either side) can't send
    // requests to each other
    let blocked = await blockRepo.find({
        select: {
            accountUuid: true,
            account2Uuid: true
        },
        where: [
            { accountUuid: requesterUuid, account2Uuid: requestedUuid },
            { accountUuid: requestedUuid, account2Uuid: requesterUuid }
        ]
    });

    if (blocked.length != 0) {
        res.status(400).send(`A block exists between the two accounts.`);
        return;
    }

    // if all passes, create the request and save to the entity manager
    const pendingRequest = new PendingFriendship();
    pendingRequest.account = verifyExistence;
    pendingRequest.account2 = verifyExistence2;

    await AccountDataSource.manager.save(pendingRequest);
    res.status(201).send(`Created a friendship request.`);
    return;
}

/**
 * Adds a new block (without a requset) to the database
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const postNewBlock = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    // these checks also double in function as fetching the needed accounts to
    // create a request, and also to conform to strict TypeScript validation
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid })

    if (verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
        return;
    }
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid })

    if (verifyExistence2 == null) {
        res.status(404).send(`The requested UUID doesn't exist.`);
        return;
    }


    // check that block doesn't already exist
    let blocked = await blockRepo.findOneBy({ accountUuid: requesterUuid });

    if (blocked != null) {
        res.status(400).send(`This account was already blocked.`);
        return;
    }

    // if all passes, create the new block
    const newBlock = new Block();
    newBlock.account = verifyExistence;
    newBlock.account2 = verifyExistence2;

    // remove any friendship between the two people
    let toSort = [requesterUuid, requestedUuid];
    toSort.sort();
    let friends = await friendshipRepo.findOneBy({ accountUuid: toSort[0], account2Uuid: toSort[1] });

    if (friends != null) {
        await AccountDataSource
            .createQueryBuilder()
            .delete()
            .from(Friendship)
            .where("accountUuid = :id AND account2Uuid = :id2", { id: toSort[0], id2: toSort[1] })
            .execute().then((value) => {
                console.log(value);
            });

        // also subtract from friend statistics upon removal
        if (verifyExistence.totalFriends != null) {
            verifyExistence.totalFriends -= 1;
        }

        if (verifyExistence2.totalFriends != null) {
            verifyExistence2.totalFriends -= 1;
        }

        await accountRepo.save(verifyExistence);
        await accountRepo.save(verifyExistence2);
    }

    // remove any pending friendship requests from either person
    let possibleRequest = await pendingRepo.findOneBy({ accountUuid: requesterUuid });
    if (possibleRequest != null) {
        await AccountDataSource
            .createQueryBuilder()
            .delete()
            .from(PendingFriendship)
            .where("accountUuid = :id AND account2Uuid = :id2", { id: requesterUuid, id2: requestedUuid })
            .execute().then((value) => {
                console.log(value);
            });
    }

    let possibleRequest2 = await pendingRepo.findOneBy({ accountUuid: requestedUuid });
    if (possibleRequest2 != null) {
        await AccountDataSource
            .createQueryBuilder()
            .delete()
            .from(PendingFriendship)
            .where("accountUuid = :id AND account2Uuid = :id2", { id: requestedUuid, id2: requesterUuid })
            .execute().then((value) => {
                console.log(value);
            });
    }

    // after all passes, save to entity manager
    await AccountDataSource.manager.save(newBlock);
    res.status(201).send(`Blocked user with ID ${requestedUuid}.`);
}

/**
 * Acknowledge and create a new friendship from an accepted request. There is no better HTTP verb for this.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const postAcceptRequest = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    // these checks also double in function as fetching the needed accounts to
    // create a request, and also to conform to strict TypeScript validation
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid });

    if (verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
        return;
    }
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid });

    if (verifyExistence2 == null) {
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

    // if not, exit
    if (requests.length == 0) {
        res.status(404).send(`There is no such request for a friendship.`);
        return;
    }

    // remove the request as it's accepted
    await AccountDataSource.manager.remove(requests[0]);

    // create a new friendship by sorting the two UUIDs
    let toSort = [requesterUuid, requestedUuid];
    toSort.sort();
    const friendship = new Friendship();
    friendship.accountUuid = toSort[0];
    friendship.account2Uuid = toSort[1];

    // save to database and also update statistics for both accounts
    await AccountDataSource.manager.save(friendship);

    if (verifyExistence.totalFriends == null) {
        verifyExistence.totalFriends = 1;
    } else {
        verifyExistence.totalFriends += 1;
    }

    if (verifyExistence2.totalFriends == null) {
        verifyExistence2.totalFriends = 1;
    } else {
        verifyExistence2.totalFriends += 1;
    }

    await accountRepo.save(verifyExistence);
    await accountRepo.save(verifyExistence2);

    res.status(201).send(`Created a friendship.`);
}

/**
 * Change an account's settings.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const putNewAccountSettings = async (req: Request, res: Response) => {
    try {
        let newSettings = req.body;

        // validate new incoming data as per the REST Account file
        let validationResult: Joi.ValidationResult = ValidateAccountPut(newSettings);

        if (validationResult.error) {
            res.status(400).json(validationResult.error);
            return;
        }

        let requesterUuid = req.params.uuid;

        // does the requester UUID even exist?
        // these checks also double in function as fetching the needed accounts to
        // create a request, and also to conform to strict TypeScript validation
        let requestingAccount = await accountRepo.findOneBy({ uuid: requesterUuid });

        if (requestingAccount == null) {
            res.status(404).send(`The requester UUID doesn't exist.`);
            return;
        }

        // first evaluate new email, and if the email changes, ignore any further settings changes 
        let email = req.body.email;
        if (email != undefined && email != null) {
            // check that the email isn't already being used by someone else
            let emailExists = await accountRepo.findOneBy({ email: email });
            if (emailExists != null) {
                res.status(400).send(`This email is already in use.`);
                return;
            }

            // make a new verification for the new email
            let verification: Verification = new Verification();
            verification.accountUuid = requestingAccount.uuid;
            verification.timeGenerated = new Date();
            verification.address = randomStringCreator(32);

            await AccountDataSource.manager.save(verification);
            // remove verification status
            requestingAccount.email = email;
            requestingAccount.verified = false;

            await accountRepo.save(requestingAccount);

            //REMOVE VERIFICATION LINK FROM MESSAGE IN FINAL VERSION!! THIS IS JUST FOR TESTING IN DEV! 
            res.status(200).send(`Changed email. No other settings are changed; retry when your email is verified. Verification link: ${verification.address}`);
            return;
        }

        // can't change any settings (except email) unless the account is verified
        if (!requestingAccount.verified) {
            await accountRepo.save(requestingAccount);
            res.status(403).send('You cannot change any further settings until you verify your email.');
            return;
        }

        // names must also be unique
        let name = req.body.name;
        if (name != undefined && name != null) {
            let nameExists = await accountRepo.findOneBy({ name: name });
            if (nameExists != null) {
                res.status(400).send(`This name is already in use.`);
                return;
            }
            requestingAccount.name = name;
        }

        let about = req.body.about;
        if (about != undefined && about != null) {
            requestingAccount.about = about;
        }

        let password = req.body.password;
        if (password != undefined && password != null) {
            requestingAccount.password = await argon2.hash(password);
        }

        // save new changes
        await accountRepo.save(requestingAccount);
        res.status(204).send('Changed account settings.');
    } catch (error) {
        if (error instanceof Error) {
            console.log(`Problem updating account settings: ${error.message}`);
        }
        else {
            console.log(`Error: ${error}`);
        }
        res.status(500).send(`Unable to update account settings.`);
    }
}

/**
 * Declines (deletes) an incoming friendship request from the receiver's side.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const deleteRequest = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    // these checks also double in function as fetching the needed accounts to
    // create a request, and also to conform to strict TypeScript validation
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid })

    if (verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
        return;
    }
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid })

    if (verifyExistence2 == null) {
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

    // if not, exit
    if (requests.length == 0) {
        res.status(404).send(`There is no such request for a friendship.`);
        return;
    }

    await AccountDataSource.manager.remove(requests[0]);

    res.status(204).send(`Rejected the friendship request.`);
}

/**
 * Deletes a friendship from either side of the relationship.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const deleteFriend = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    // these checks also double in function as fetching the needed accounts to
    // create a request, and also to conform to strict TypeScript validation
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid })

    if (verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
        return;
    }
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid })

    if (verifyExistence2 == null) {
        res.status(404).send(`The requested UUID doesn't exist.`);
        return;
    }

    // try to find the friendship; if it already exists, exit
    let toSort = [requesterUuid, requestedUuid];
    toSort.sort();
    let friends = await friendshipRepo.findOneBy({ accountUuid: toSort[0], account2Uuid: toSort[1] });

    if (friends == null) {
        res.status(404).send(`No such friendship exists`);
        return;
    }

    // remove friendship and update statistics for both accounts
    await AccountDataSource.manager.remove(friends);

    if (verifyExistence.totalFriends != null) {
        verifyExistence.totalFriends -= 1;
    }

    if (verifyExistence2.totalFriends != null) {
        verifyExistence2.totalFriends -= 1;
    }

    await accountRepo.save(verifyExistence);
    await accountRepo.save(verifyExistence2);

    res.status(204).send(`Deleted the friendship.`);
}

/**
 * Deletes a friendship from the side of the instigator.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const deleteBlock = async (req: Request, res: Response) => {
    let requesterUuid = req.params.uuid;
    let requestedUuid = req.params.uuid2;

    // does the requester UUID even exist?
    // these checks also double in function as fetching the needed accounts to
    // create a request, and also to conform to strict TypeScript validation
    let verifyExistence = await accountRepo.findOneBy({ uuid: requesterUuid })

    if (verifyExistence == null) {
        res.status(404).send(`The requester UUID doesn't exist.`);
        return;
    }
    // does the requested UUID even exist?
    let verifyExistence2 = await accountRepo.findOneBy({ uuid: requestedUuid })

    if (verifyExistence2 == null) {
        res.status(404).send(`The requested UUID doesn't exist.`);
        return;
    }

    // try to find the block; if it exists, do nothing
    let block = await blockRepo.findOneBy({ accountUuid: requesterUuid, account2Uuid: requestedUuid });

    if (block == null) {
        res.status(404).send(`No such block exists.`);
        return;
    }

    await AccountDataSource.manager.remove(block);

    res.status(204).send(`Removed the block.`);
}

/**
 * Internal function used in generating a random string based off of an already existing charset.
 * 
 * @param length The number of characters that the function should output.
 * @returns A randomly generated string of characters based on charset and the passed-in length.
 */
function randomStringCreator(length: number) {
    let newString = '';

    for (let i = 0; i < length; i++) {
        newString += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return newString;
}