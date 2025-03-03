import { Entity, PrimaryColumn, JoinColumn, ManyToOne, Unique } from "typeorm";
import { Account } from "./account";

// identical to Friendship table but denormalized for sake of read
// performance

// this is a unidirectional relationship so instigator is in the first col

/**
 * A TypeORM data object to hold and define a Block record from the database. Has a
 * *-1 relationship with Account.
 */
@Unique("block_constraint", ["accountUuid", "account2Uuid"])
@Entity()
export class Block {
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