import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Unique, Column, Index } from "typeorm";
import { Account } from "./account";
import { BrokenTelephoneEntry } from "./broken_telephone_entry";

@Entity()
@Unique("brokentel_rating_constraint", ["entryId", "entryStream", "entryIndex","accountUuid"])
export class BrokenTelephoneRating {
    @PrimaryColumn({
        type: "int",
        unsigned: true,
        nullable: false
    })
    entryId!: number;

    @PrimaryColumn({
        type: "int",
        unsigned: true,
        nullable: false
    })
    entryStream!: number;

    @PrimaryColumn({
        type: "int",
        unsigned: true,
        nullable: false
    })
    entryIndex!: number;

    @PrimaryColumn({
        type: "uuid",
        nullable: false
    })
    accountUuid!: string;

    // there's no rating without the rating score, so this must not be null
    @Column({
        type: "tinyint",
        unsigned: true,
        nullable: false
    })
    rating!: number;

    // equivalent to navigation properties in EntityFramework
    @ManyToOne(() => Account, {cascade: true, onDelete: "CASCADE"})
    @JoinColumn()
    account!: Account | null;

    @ManyToOne(() => BrokenTelephoneEntry, {cascade: true, onDelete: "CASCADE"})
    @JoinColumn()
    entry!: BrokenTelephoneEntry | null;
}