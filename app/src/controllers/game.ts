import { Request, Response } from "express";
import { BrokenTelephoneEntry } from "../models/orm/broken_telephone_entry";
import { BrokenTelephoneGame } from "../models/orm/broken_telephone_game";
import { BrokenTelephoneRating } from "../models/orm/broken_telephone_rating";
import { AccountDataSource } from "../rdbms";

const brokentelRepo = AccountDataSource.getRepository(BrokenTelephoneGame);
const brokentelEntryRepo = AccountDataSource.getRepository(BrokenTelephoneEntry);
const brokentelRatingsRepo = AccountDataSource.getRepository(BrokenTelephoneRating);

export const getMostRecentGame = async (req: Request, res: Response) => {
    // the function for finding just one entity doesn't seem to accept ORDER BY
    let recentGame = await brokentelRepo.find({
        take: 1,
        order: {
            gameId: {
                direction: "DESC"
            }
         }
    });

    if(recentGame.length == 0) {
        res.status(404).send(`Cannot find any more recent games.`);
    } else {
        res.status(200).json(recentGame[0]);
    }
}

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