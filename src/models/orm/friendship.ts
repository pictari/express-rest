import { Entity, PrimaryColumn, JoinColumn, ManyToOne, Unique } from "typeorm";
import { Account } from "./account";

// identical to Block table but denormalized for sake of read
// performance

// this is a bidirectional relationship so the UUIDs need to be SORTED
// before inserts
@Unique("friendship_constraint", ["accountUuid", "account2Uuid"])
@Entity()
export class Friendship {
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