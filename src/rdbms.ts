import { DataSource } from "typeorm"
import { Account } from "./models/orm/account"
import { Verification } from "./models/orm/verification"
import { Friendship } from "./models/orm/friendship";
import { Block } from "./models/orm/block";
import { PendingFriendship } from "./models/orm/pending_friendship";

export const AccountDataSource = new DataSource({
    type: "mariadb",
    host: process.env.dbhost,
    port: Number(process.env.dbport),
    username: process.env.dbusername,
    password: process.env.dbpassword,
    database: process.env.db,
    entities: [Account, Verification, Friendship, Block, PendingFriendship],
    synchronize: true,
    logging: false,
});

AccountDataSource.initialize()
    .catch((error) => console.log(error));