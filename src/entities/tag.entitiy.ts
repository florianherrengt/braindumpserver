import { ObjectType, Field, ID } from 'type-graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
@ObjectType()
export class Tag {
    @Field(type => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column({ length: 50 })
    label: string;

    @ManyToOne(
        type => User,
        user => user.username,
    )
    user: User;
}
