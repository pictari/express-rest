import { Entity, PrimaryColumn, JoinColumn, ManyToOne, Unique } from "typeorm";
import { Account } from "./account";

// another denormalized table, very similar to Friendship
// keep friend requests (pending friendships) separate for read performance

// this is a unidirectional relationship so instigator is in the first col
// however, the server has to ensure that there exists no request from the second party
// before creating a new one
@Unique("pending_friendship_constraint", ["accountUuid, account2Uuid"])
@Entity()
export class PendingFriendship {
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