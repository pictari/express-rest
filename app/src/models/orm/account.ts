import { Entity, Column, PrimaryColumn } from "typeorm";

// the properties in this entity are explicitly defined as nullable
// (or not) in order to get a consistent result in case TypeORM
// sometimes parses "| null" as "always make this entity nullable"
@Entity()
export class Account {
    @PrimaryColumn({
        type: "uuid",
        nullable: false,
        unique: true
    })
    uuid!: string | null;

    // fun fact: maximum length of email is a hotly debated topic
    // people can't decide if it's 254 or 320
    @Column({
        type: "text",
        nullable: true
    })
    email!: string | null;

    @Column({
        type: "boolean",
        nullable: true
    })
    verified!: boolean | null;

    @Column({
        type: "tinyint",
        unsigned: true,
        nullable: true
    })
    userType!: UserType | null;

    @Column({
        type: "text",
        nullable: true
    })
    password!: string | null;

    @Column("char", { length: 16, nullable: true })
    name!: string | null;

    @Column({
        type: "tinytext",
        nullable: true
    })
    about!: string | null;

    @Column({
        type: "timestamp",
        nullable: true
    })
    dateGenerated!: Date | null;

    @Column({
        type: "int",
        unsigned: true,
        nullable: true
    })
    gamesPlayed!: number | null;

    @Column({
        type: "int",
        unsigned: true,
        nullable: true
    })
    totalRating!: number | null;

    @Column({
        type: "tinyint",
        unsigned: true,
        nullable: true
    })
    totalFriends!: number | null;
}

export enum UserType {
    admin,
    moderator,
    none
}