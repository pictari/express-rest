import { Entity, PrimaryColumn, JoinColumn, ManyToOne, Unique } from "typeorm";
import { Account } from "./account";

// identical to Block table but denormalized for sake of read
// performance

// this is a bidirectional relationship so the UUIDs need to be SORTED
// before inserts and searches

/**
 * A TypeORM data object to hold and define a Friendship record from the database. Has a
 * *-1 relationship with Account.
 */
@Unique("friendship_constraint", ["accountUuid", "account2Uuid"])
@Entity()
export class Friendship {
    @PrimaryColumn({
        type: "uuid",
        nullable: false
    })
    accountUuid!: string | null;

    // the ugly name in here and similar data classes is TypeORM's fault; latest versions made
    // creation of FK opinionated based on the column name
    @PrimaryColumn({
        type: "uuid",
        nullable: false
    })
    account2Uuid!: string | null;

    // equivalent to navigation properties in EntityFramework
    @ManyToOne(() => Account, {cascade: true})
    @JoinColumn()
    account!: Account | null;

    @ManyToOne(() => Account, {cascade: true})
    @JoinColumn()
    account2!: Account | null;
}