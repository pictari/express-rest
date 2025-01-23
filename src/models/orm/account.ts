import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity()
export class Account {
    @PrimaryColumn("uuid")
    uuid!: string | null;

    @Column({
        type: "tinyint",
        unsigned: true
    })
    userType!: UserType | null;

    @Column("char", { length: 16 })
    name!: string | null;

    @Column("tinytext")
    about!: string | null;

    // fun fact: maximum length of email is 320 characters
    @Column("text")
    email!: string | null;

    @Column("text")
    password!: string | null;

    @Column("boolean")
    verified!: boolean | null;
}

export enum UserType {
    admin,
    moderator,
    none
}