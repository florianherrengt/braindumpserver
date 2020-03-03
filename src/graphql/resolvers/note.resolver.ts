import { ForbiddenError } from 'apollo-server-express';
import { AppContext } from 'src/helpers';
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Note } from '../../entities/note.entity';
import { CreateNoteInput } from '../inputs/note.input';

@Resolver(Note)
export class NoteResolver {
    constructor(@InjectRepository(Note) private readonly noteRepository: Repository<Note>) { }

    @Query(returns => [Note])
    async currentUserNotes(
        @Arg('limit', { defaultValue: 10 }) limit: number,
        @Arg('skip', { defaultValue: 0 }) skip: number,
        @Ctx() context: AppContext,
    ): Promise<Note[]> {
        if (!context.user) {
            throw new ForbiddenError('User not logged in');
        }
        const { username } = context.user;
        return this.noteRepository.find({
            where: { user: { username } },
            skip,
            take: limit,
            order: {
                createdAt: 'DESC',
            },
        });
    }
    @Mutation(returns => Note)
    async createNote(@Arg('input') input: CreateNoteInput, @Ctx() context: AppContext): Promise<Note> {
        console.log(context)
        if (!context.user) {
            throw new ForbiddenError('User not logged in');
        }
        const { username } = context.user;
        const newNote = this.noteRepository.create({ ...input, user: { username } });
        await this.noteRepository.save(newNote);
        return newNote;
    }
}
