import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { Account } from "./account";

@Entity()
export class Relationship {
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

    @Column({
        type: "tinyint",
        unsigned: true,
        nullable: true
    })
    relationshipType!: RelationshipType | null;
}

export enum RelationshipType {
    friend,
    blocked
}