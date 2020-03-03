import { InputType, Field } from 'type-graphql';
import { MaxLength } from 'class-validator';
import { Note } from '../../entities';

@InputType()
export class CreateNoteInput implements Partial<Note> {
    @Field({ nullable: false })
    @MaxLength(1000)
    text: string;
}
