import { ForbiddenError, AuthenticationError } from 'apollo-server-express';
import { AppContext } from 'src/helpers';
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Repository, In, Transaction, TransactionManager, EntityManager } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Note } from '../../entities/note.entity';
import { CreateNoteInput } from '../inputs/note.input';
import { Tag } from '../../entities';
import { getManager } from 'typeorm';

@Resolver(Note)
export class NoteResolver {
    constructor(
        @InjectRepository(Note) private readonly noteRepository: Repository<Note>,
        @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>,
    ) {}

    @Query(returns => [Note])
    async currentUserNotes(
        @Arg('limit', { defaultValue: 10 }) limit: number,
        @Arg('skip', { defaultValue: 0 }) skip: number,
        @Ctx() context: AppContext,
    ): Promise<Note[]> {
        if (!context.user) {
            throw new AuthenticationError('User not logged in');
        }
        const { username } = context.user;
        return this.noteRepository.find({
            where: { user: { username } },
            skip,
            take: limit,
            order: {
                createdAt: 'DESC',
            },
            relations: ['tags'],
        });
    }
    @Transaction()
    @Mutation(returns => Note)
    async createNote(
        @TransactionManager() manager: EntityManager,
        @Arg('input') input: CreateNoteInput,
        @Ctx() context: AppContext,
    ): Promise<any> {
        if (!context.user?.username) {
            throw new AuthenticationError('User not logged in');
        }
        const { username } = context.user;
        const { text, tags, newTags } = input;

        let noteTagsId: string[] = tags && tags.length ? tags.map(t => t.id) : [];

        if (newTags && newTags.length) {
            const createdTags = newTags.map(tag =>
                this.tagRepository.create({ ...tag, label: encodeURIComponent(tag.label) }),
            );
            await manager.save(createdTags);
            noteTagsId = noteTagsId.concat(createdTags.map(t => t.id));
        }

        const newNote = this.noteRepository.create({
            text: encodeURIComponent(text),
            user: { username },
            tags: noteTagsId.map(id => ({ id })),
        });
        await manager.save(newNote);
        return this.noteRepository.findOne(newNote.id, { relations: ['tags'] });
    }
}
