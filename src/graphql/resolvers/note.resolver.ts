import { ForbiddenError, AuthenticationError } from 'apollo-server-express';
import { AppContext } from 'src/helpers';
import { Arg, Ctx, Mutation, Query, Resolver, Int } from 'type-graphql';
import { Repository, In, Transaction, TransactionManager, EntityManager } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Note } from '../../entities/note.entity';
import { CreateNoteInput } from '../inputs/note.input';
import { Tag } from '../../entities';
import { getManager } from 'typeorm';
import { PaginatedResponse } from './PaginatedResponse';

// @ts-ignore
const PaginatedNoteResponse = PaginatedResponse(Note);
type PaginatedNoteResponse = InstanceType<typeof PaginatedNoteResponse>;

@Resolver(Note)
export class NoteResolver {
    constructor(
        @InjectRepository(Note) private readonly noteRepository: Repository<Note>,
        @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>,
    ) {}

    @Query(returns => PaginatedNoteResponse)
    async currentUserNotes(
        @Arg('tagsId', () => [String], { defaultValue: [] }) tagsId: string[],
        @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
        @Arg('skip', () => Int, { defaultValue: 0 }) skip: number,
        @Ctx() context: AppContext,
    ): Promise<PaginatedNoteResponse> {
        const { user } = context;
        if (!user) {
            throw new AuthenticationError('User not logged in');
        }
        let notesQuery = this.noteRepository
            .createQueryBuilder('notes')
            .leftJoinAndSelect('notes.tags', 'tag')
            .where('notes.userUsername = :username', { username: user.username });

        if (tagsId.length) {
            notesQuery = notesQuery.where('tag.id IN (:...tagsId)', {
                tagsId,
            });
        }
        const [items, total] = await notesQuery
            .orderBy('notes.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return {
            items,
            hasMore: total !== items.length + skip,
            total,
        };
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
        const { text, tags } = input;

        let noteTagsId: string[] = tags && tags.length ? tags.map(t => t.id) : [];

        const newNote = this.noteRepository.create({
            text: encodeURIComponent(text),
            user: { username },
            tags: noteTagsId.map(id => ({ id })),
        });
        await manager.save(newNote);
        return this.noteRepository.findOne(newNote.id, { relations: ['tags'] });
    }
}
