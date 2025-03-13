import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from "typeorm";
import { Account } from "./account";

/**
 * A TypeORM data object to hold and define a Verification record from the database. Has a
 * 1-1 relationship with Account.
 */
@Entity()
export class Verification {
    @PrimaryColumn({
        type: "uuid",
        nullable: false,
        unique: true
    })
    accountUuid!: string | null;

    @OneToOne(() => Account, {cascade: true})
    @JoinColumn()
    account!: Account | null;

    @Column({
        type: "text",
        nullable: true,
        unique: true
    })
    address!: string | null;

    @Column({
        type: "timestamp",
        nullable: true
    })
    timeGenerated!: Date | null;
}