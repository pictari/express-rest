import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Account } from "./account";
import { BrokenTelephoneGame } from "./broken_telephone_game";
import { ContentType } from "./common_enums";

@Entity()
@Unique("brokentel_entry_constraint", ["gameId", "stream", "index"])
export class BrokenTelephoneEntry {
    @PrimaryColumn({
        type: "int",
        unsigned: true,
        nullable: false
    })
    gameId!: number;

    @PrimaryColumn({
        type: "int",
        unsigned: true,
        nullable: false
    })
    stream!: number | null;

    // index of 1 = person started the stream
    @PrimaryColumn({
        type: "int",
        unsigned: true
    })
    index!: number | null;


    // represents the contributor of that entry only (owner is in BrokenTelephoneGame)
    @Column({
        type: "uuid",
        nullable: false
    })
    accountUuid!: string | null;

    @Column({
        type: "tinyint",
        unsigned: true,
        nullable: true
    })
    contentType!: ContentType | null;

    // denormalized to prevent unnecessary reads/allow for individual ratings of a deleted account to be purged for storage
    @Column({
        type: "int",
        unsigned: true,
        nullable: true
    })
    totalRating!: number | null;

    @Column({
        type: "longtext",
        nullable: true
    })
    content!: string | null;

    // equivalent to navigation properties in EntityFramework
    @ManyToOne(() => Account, {cascade: true, nullable: true, orphanedRowAction: "nullify", onDelete: "SET NULL"})
    @JoinColumn()
    account!: Account | null;

    @ManyToOne(() => BrokenTelephoneGame, {cascade: true, onDelete: "CASCADE"})
    @JoinColumn()
    game!: BrokenTelephoneGame | null;
}