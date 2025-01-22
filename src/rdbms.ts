import { DataSource } from "typeorm"
import { Account } from "./models/orm/account"
import { Verification } from "./models/orm/verification"

export const AccountDataSource = new DataSource({
    type: "mariadb",
    host: process.env.dbhost,
    port: Number(process.env.dbport),
    username: process.env.dbusername,
    password: process.env.dbpassword,
    database: process.env.db,
    entities: [Account, Verification],
    synchronize: true,
    logging: false,
})

AccountDataSource.initialize()
    .catch((error) => console.log(error))