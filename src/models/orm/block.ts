import { Entity, PrimaryColumn, JoinColumn, ManyToOne, Unique } from "typeorm";
import { Account } from "./account";

// identical to Friendship table but denormalized for sake of read
// performance

// this is a unidirectional relationship so instigator is in the first col
@Unique("block_constraint", ["accountUuid", "account2Uuid"])
@Entity()
export class Block {
    @PrimaryColumn({
        type: "uuid",
        nullable: false
    })
    accountUuid!: string | null;

    @PrimaryColumn({
        type: "uuid",
        nullable: false
    })
    account2Uuid!: string | null;

    @ManyToOne(() => Account, {cascade: true})
    @JoinColumn()
    account!: Account | null;

    @ManyToOne(() => Account, {cascade: true})
    @JoinColumn()
    account2!: Account | null;
}