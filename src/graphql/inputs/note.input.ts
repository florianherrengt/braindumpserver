import { InputType, Field } from 'type-graphql';
import { MaxLength } from 'class-validator';
import { Note, Tag } from '../../entities';

@InputType()
class TagNote {
    @Field({ nullable: true })
    id?: string;
    @Field({ nullable: true })
    label?: string;
}

@InputType()
export class CreateNoteInput {
    @Field({ nullable: false })
    @MaxLength(10000)
    text: string;

    @Field(type => [TagNote], { nullable: true })
    tags?: TagNote[];
}
