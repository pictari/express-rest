import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity()
export class Account {
    @PrimaryColumn("uuid")
    uuid!: string

    @Column("char", { length: 16 })
    name!: string

    @Column("tinytext")
    about!: string

    // fun fact: maximum length of email is 320 characters
    @Column("text")
    email!: string

    @Column("text")
    password!: string

    @Column("boolean")
    verified!: boolean
}