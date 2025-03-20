import { Request, Response } from "express";
import { BrokenTelephoneEntry } from "../models/orm/broken_telephone_entry";
import { BrokenTelephoneGame } from "../models/orm/broken_telephone_game";
import { BrokenTelephoneRating } from "../models/orm/broken_telephone_rating";
import { AccountDataSource } from "../rdbms";
import { ContentType } from "../models/orm/common_enums";
import Joi from "joi";
import { ValidateRatingPostOrPut } from "../models/rest/rating";
import { Account } from "../models/orm/account";

const brokentelRepo = AccountDataSource.getRepository(BrokenTelephoneGame);
const brokentelEntryRepo = AccountDataSource.getRepository(BrokenTelephoneEntry);
const brokentelRatingsRepo = AccountDataSource.getRepository(BrokenTelephoneRating);
const accountRepo = AccountDataSource.getRepository(Account);

/**
 * Gets the IDs of ten latest games. Paginated.
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const getRecentGames = async (req: Request, res: Response) => {
    let page = Number(req.params.page);
    let recentGames;
    if(isNaN(page) || page <= 0) {
        recentGames = await brokentelRepo.find({
            take: 10,
            order: {
                gameId: {
                    direction: "DESC"
                }
            }
        });
    } else {
        recentGames = await brokentelRepo.find({
            take: 10,
            skip: 10 * page,
            order: {
                gameId: {
                    direction: "DESC"
                }
            }
        });
    }


    if(recentGames.length == 0) {
        res.status(404).send(`Cannot find any more recent games.`);
    } else {
        res.status(200).json(recentGames);
    }
}

/**
 * Gets only the first drawing from a given game. Used for display.
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const getOnlyFirstDrawing = async (req: Request, res: Response) => {
    let gameId = Number(req.params.id);

    if(isNaN(gameId)) {
        res.status(400).send(`ID must be an integer.`);
        return;
    }

    let drawing = await brokentelEntryRepo.find({
        take: 1,
        select: {
            content: true
        },
        where: {
            gameId: gameId,
            stream: 0,
            contentType: ContentType.image
        },
        order: {
            index: {
                direction: "ASC"
            }
        }
    });


    if(drawing.length == 0) {
        res.status(404).send(`Cannot find drawings for that game.`);
    } else {
        res.status(200).json(drawing[0]);
    }
}

/**
 * Gets all the details (about entries) for a given game.
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const getGameDetails = async (req: Request, res: Response) => {
    let gameId = Number(req.params.id);

    if(isNaN(gameId)) {
        res.status(400).send(`ID must be an integer.`);
        return;
    }

    let data = await brokentelEntryRepo.find({
        select : {
            gameId: false
        },
        where: {
            gameId: gameId
        }
    });


    if(data.length == 0) {
        res.status(404).send(`Cannot find finished entries for that game.`);
    } else {
        res.status(200).json(data);
    }
}

/**
 * Gets a given account's latest 10 games.
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const getRecentAccountEntries = async (req: Request, res: Response) => {
    let uuid = req.params.uuid;

    let data = await brokentelEntryRepo.find({
        take: 10,
        where: {
            accountUuid: uuid
        },
        order: {
            gameId: {
                direction: "DESC"
            }
        }
    });
    // .createQueryBuilder()
    // .select()
    // .where("accountUuid = :id", { id: uuid})
    // .limit(10)
    // .orderBy()
    // .getMany();

    if(data.length == 0) {
        res.status(404).send(`Cannot find any finished drawings for that account.`);
    } else {
        res.status(200).json(data);
    }
}

/**
 * Gets all the ratings that a given account has given to entries within a game.
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const getPersonalRatingsForGame = async (req: Request, res: Response) => {
    let uuid = req.params.uuid;
    let id = Number(req.params.id);

    if(isNaN(id)) {
        res.status(400).send(`ID must be an integer.`);
        return;
    }
    
    let data = await brokentelRatingsRepo.find({
        select: {
            entryId: false,
            accountUuid: false
        },
        where: {
            accountUuid: uuid,
            entryId: id
        }
    });


    if(data.length == 0) {
        res.status(404).send(`This account hasn't rated anything in that game.`);
    } else {
        res.status(200).json(data);
    }
}

/**
 * Assigns a new rating to an entry and updates relevant statistics.
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const postNewRating = async (req: Request, res: Response) => {
    let uuid;
    try {
        uuid = res.locals.payload.uuid;
    } catch(e) {
        console.log(e);
        res.status(400).send(`Couldn't extract the UUID from your token.`);
        return;
    }
    let id = Number(req.params.id);
    let stream = Number(req.params.stream);
    let index = Number(req.params.index);

    if(isNaN(id) || isNaN(stream) || isNaN(index)) {
        res.status(400).send(`ID, Stream and Index must be integers.`);
        return;
    }

    let body = req.body;
    let validationResult: Joi.ValidationResult = ValidateRatingPostOrPut(body);

    if (validationResult.error) {
        res.status(400).json(validationResult.error);
        return;
    }
    
    let data = await brokentelRatingsRepo.findOneBy({entryId: id, entryStream: stream, entryIndex: index, accountUuid: uuid});

    if(data != null) {
        res.status(400).send(`This account already rated this entry.`);
        return;
    }

    let entryExists = await brokentelEntryRepo.findOneBy({gameId: id, stream: stream, index: index});

    if(entryExists == null) {
        res.status(404).send(`No such contribution exists in that game.`);
        return;
    }
    

    try {
        let newRating : BrokenTelephoneRating = new BrokenTelephoneRating();
        newRating.accountUuid = uuid;
        newRating.rating = body.rating;
        newRating.entryId = entryExists.gameId;
        if(entryExists.stream == null || entryExists.index == null) {
            res.status(500).send(`Data for that entry is malformed. No ratings will be made for it until it is fixed.`);
            return;
        }

        newRating.entryStream = entryExists.stream;
        newRating.entryIndex = entryExists.index;
        entryExists.totalRating += body.rating;

        AccountDataSource.manager.save(newRating);
        AccountDataSource.manager.save(entryExists);

        if(entryExists.accountUuid != null) {
            let accountExists = await accountRepo.findOneBy({uuid: entryExists.accountUuid});
            if(accountExists != null) {
                accountExists.totalRating += body.rating;
                AccountDataSource.manager.save(accountExists);
            }
        }
        res.status(201).send(`Created a new rating.`);
    } catch (error) {
        if (error instanceof Error) {
            console.log(`Issue creating new rating: ${error.message}`);
        }
        else {
            console.log(`Error: ${error}`);
        }
        res.status(500).send(`Couldn't create a new rating.`);
    }
}

/**
 * Replaces a rating to an entry and updates relevant statistics. Similar to POST route but exists separately for semantic reasons.
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const putRating = async (req: Request, res: Response) => {
    let uuid;
    try {
        uuid = res.locals.payload.uuid;
    } catch(e) {
        console.log(e);
        res.status(400).send(`Couldn't extract the UUID from your token.`);
        return;
    }
    let id = Number(req.params.id);
    let stream = Number(req.params.stream);
    let index = Number(req.params.index);

    if(isNaN(id) || isNaN(stream) || isNaN(index)) {
        res.status(400).send(`ID, Stream and Index must be integers.`);
        return;
    }

    let body = req.body;
    let validationResult: Joi.ValidationResult = ValidateRatingPostOrPut(body);

    if (validationResult.error) {
        res.status(400).json(validationResult.error);
        return;
    }
    
    let data = await brokentelRatingsRepo.findOneBy({entryId: id, entryStream: stream, entryIndex: index, accountUuid: uuid});

    if(data == null) {
        res.status(404).send(`This account didn't rate this entry yet or the entry/rating was deleted.`);
        return;
    }

    let entryExists = await brokentelEntryRepo.findOneBy({gameId: id, stream: stream, index: index});

    if(entryExists == null) {
        res.status(404).send(`You shouldn't be able to get this message; your rating exists but the entry itself doesn't. Please contact an administrator.`);
        return;
    }

    try {
        let previous = data.rating;
        data.rating = body.rating;
        if(entryExists.totalRating == null) {
            res.status(500).send(`The ratings for this entry exist in a malformed state. Please contact an administrator.`);
            return;
        }
        entryExists.totalRating += (body.rating - previous);

        AccountDataSource.manager.save(data);
        AccountDataSource.manager.save(entryExists);

        if(entryExists.accountUuid != null) {
            let accountExists = await accountRepo.findOneBy({uuid: entryExists.accountUuid});
            if(accountExists != null) {
                if(accountExists.totalRating != null) {
                    accountExists.totalRating += (body.rating - previous);
                    AccountDataSource.manager.save(accountExists);
                }
            }
        }
        res.status(204).send(`Updated the rating.`);
    } catch (error) {
        if (error instanceof Error) {
            console.log(`Issue updating the rating: ${error.message}`);
        }
        else {
            console.log(`Error: ${error}`);
        }
        res.status(500).send(`Couldn't update the rating.`);
    }
}

/**
 * Deletes a rating from an entry and updates relevant statistics.
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const deleteRating = async (req: Request, res: Response) => {
    let uuid;
    try {
        uuid = res.locals.payload.uuid;
    } catch(e) {
        console.log(e);
        res.status(400).send(`Couldn't extract the UUID from your token.`);
        return;
    }
    let id = Number(req.params.id);
    let stream = Number(req.params.stream);
    let index = Number(req.params.index);

    if(isNaN(id) || isNaN(stream) || isNaN(index)) {
        res.status(400).send(`ID, Stream and Index must be integers.`);
        return;
    }
    
    let data = await brokentelRatingsRepo.findOneBy({entryId: id, entryStream: stream, entryIndex: index, accountUuid: uuid});

    if(data == null) {
        res.status(404).send(`This account didn't rate this entry yet or the entry was deleted.`);
        return;
    }

    let entryExists = await brokentelEntryRepo.findOneBy({gameId: id, stream: stream, index: index});

    if(entryExists == null) {
        res.status(404).send(`You shouldn't be able to get this message; your rating exists but the entry itself doesn't. Please contact an administrator.`);
        return;
    }

    if(entryExists.totalRating == null) {
        res.status(500).send(`The ratings for this entry exist in a malformed state. Please contact an administrator.`);
        return;
    }

    try {
        entryExists.totalRating -= data.rating;

        AccountDataSource.manager.remove(data);
        AccountDataSource.manager.save(entryExists);

        if(entryExists.accountUuid != null) {
            let accountExists = await accountRepo.findOneBy({uuid: entryExists.accountUuid});
            if(accountExists != null) {
                if(accountExists.totalRating != null) {
                    accountExists.totalRating -= data.rating;
                    AccountDataSource.manager.save(accountExists);
                }
            }
        }
        res.status(204).send(`Deleted the rating.`);
    } catch (error) {
        if (error instanceof Error) {
            console.log(`Issue deleting the rating: ${error.message}`);
        }
        else {
            console.log(`Error: ${error}`);
        }
        res.status(500).send(`Couldn't delete the rating.`);
    }
}