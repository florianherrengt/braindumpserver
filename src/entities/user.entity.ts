import { ObjectType, Field } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Note } from './note.entity';

@Entity()
@ObjectType()
export class User {
    @Field()
    @PrimaryColumn({ nullable: false, length: 100 })
    username: string;

    @Column({ nullable: false, length: 100 })
    password: string;

    @OneToMany(
        type => Note,
        note => note.id,
    )
    notes: Note[];
}
