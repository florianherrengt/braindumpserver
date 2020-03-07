import { InputType, Field, Int } from 'type-graphql';
import { MaxLength } from 'class-validator';
import { Note, Tag } from '../../entities';

@InputType()
class NewTagNote {
    @Field({ nullable: false })
    label: string;
}

@InputType()
class TagNote {
    @Field({ nullable: false })
    id: string;
}

@InputType()
export class CreateNoteInput {
    @Field({ nullable: false })
    @MaxLength(10000)
    text: string;

    @Field(type => [TagNote], { nullable: true })
    tags?: Tag[];

    @Field(type => NewTagNote, { nullable: true })
    newTags?: NewTagNote[];
}
