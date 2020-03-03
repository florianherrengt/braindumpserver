import { ObjectType, Field } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
@ObjectType()
export class Note {
    @Field()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column({ length: 1000 })
    text: string;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(
        type => User,
        user => user.username,
    )
    user: User;
}
