import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity()
export class Verification {
    @PrimaryColumn("uuid")
    uuid!: string

    @Column("text")
    address!: string

    @Column("timestamp")
    timeGenerated!: Date
}