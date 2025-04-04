import { DataSource } from "typeorm"
import { Account } from "./models/orm/account"
import { Verification } from "./models/orm/verification"
import { Friendship } from "./models/orm/friendship";
import { Block } from "./models/orm/block";
import { PendingFriendship } from "./models/orm/pending_friendship";
import dotenv from "dotenv";
import { BrokenTelephoneEntry } from "./models/orm/broken_telephone_entry";
import { BrokenTelephoneGame } from "./models/orm/broken_telephone_game";
import { BrokenTelephoneRating } from "./models/orm/broken_telephone_rating";

dotenv.config();

/**
 * Configured database connection using information from secrets.
 */
export const AccountDataSource = new DataSource({
    type: "mariadb",
    host: process.env.DBHOST,
    port: Number(process.env.DBPORT),
    username: process.env.DBUSERNAME,
    password: process.env.DBPASSWORD,
    database: process.env.DB,
    entities: [Account, Verification, Friendship, Block, PendingFriendship, BrokenTelephoneGame, BrokenTelephoneEntry, BrokenTelephoneRating],
    synchronize: true,
    logging: false, 
});

AccountDataSource.initialize()
    .catch((error) => console.log(error));