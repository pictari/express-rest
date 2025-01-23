import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity()
export class Verification {
    @PrimaryColumn("uuid")
    uuid!: string | null;

    @Column("text")
    address!: string | null;

    @Column("timestamp")
    timeGenerated!: Date | null;
}