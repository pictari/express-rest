import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from "typeorm";
import { Account } from "./account";

@Entity()
export class Verification {
    // these two don't look like they're going to work
    // but they made typeORM opinionated to sImPliFy tHe iNtErNaLs
    // ???
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
        nullable: true
    })
    address!: string | null;

    @Column({
        type: "timestamp",
        nullable: true
    })
    timeGenerated!: Date | null;
}