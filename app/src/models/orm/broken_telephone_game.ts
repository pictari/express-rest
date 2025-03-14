import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Account } from "./account";

@Entity()
export class BrokenTelephoneGame {
    @PrimaryGeneratedColumn({
        type: "int",
        unsigned: true
    })
    gameId!: number | null;

    // represents the owner
    @Column({
        type: "uuid",
        nullable: true
    })
    accountUuid!: string | null;

    // equivalent to navigation properties in EntityFramework
    @ManyToOne(() => Account, {nullable: true, orphanedRowAction: "nullify", onDelete: "SET NULL"})
    @JoinColumn()
    account!: Account | null;
}