import { Entity, Column, PrimaryColumn, Index } from "typeorm";

// the properties in this entity are explicitly defined as nullable
// (or not) in order to get a consistent result in case TypeORM
// sometimes parses "| null" as "always make this entity nullable"

/**
 * A TypeORM data object to hold and define an Account record from the database.
 */
@Entity()
export class Account {
    @PrimaryColumn({
        type: "uuid",
        nullable: false,
        unique: true
    })
    uuid!: string | null;

    // max length of email is possibly 320 characters but I'm finding conflicting info
    @Column({
        type: "text",
        nullable: true,
        unique: true
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

    @Column({
        type: "char",
        length: 16,
        nullable: true,
        unique: true
    })
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

/**
 * Enum that holds the current privilege levels we recognize, from admin (highest) to none (lowest).
 */
export enum UserType {
    admin,
    moderator,
    none
}