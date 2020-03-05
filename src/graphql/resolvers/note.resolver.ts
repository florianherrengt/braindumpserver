import { ForbiddenError, AuthenticationError } from 'apollo-server-express';
import { AppContext } from 'src/helpers';
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Repository, In } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Note } from '../../entities/note.entity';
import { CreateNoteInput } from '../inputs/note.input';
import { Tag } from '../../entities';

@Resolver(Note)
export class NoteResolver {
    constructor(@InjectRepository(Note) private readonly noteRepository: Repository<Note>, @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>) { }

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
            relations: ['tags']
        });
    }
    @Mutation(returns => Note)
    async createNote(@Arg('input') input: CreateNoteInput, @Ctx() context: AppContext): Promise<any> {
        if (!context.user?.username) {
            throw new AuthenticationError('User not logged in');
        }
        const { username } = context.user;
        let { text, tags } = input;

        text = encodeURIComponent(text)
        let noteTags: string[] = []

        if (tags && tags.length) {
            const existingTags = await this.tagRepository.find({ select: ['id', 'label'], where: { label: In(tags.map(t => t.label)) } })
            const existingTagsId = existingTags.map(t => t.id)
            const existingTagsLabel = existingTags.map(t => t.label)
            noteTags = noteTags.concat(existingTagsId)
            const tagsToCreate = tags.filter(tag => !existingTagsLabel.includes(tag.label || 'new_id')).map(({ label }) => ({ label, user: { username } }))
            const newTags = tagsToCreate.map(tag => this.tagRepository.create(tag))
            await this.tagRepository.save(newTags)
            noteTags = noteTags.concat(newTags.map((t) => t.id))
        }

        const newNote = this.noteRepository.create({ text, user: { username }, tags: noteTags.map((id) => ({ id })) });
        await this.noteRepository.save(newNote);
        return this.noteRepository.findOne(newNote.id, { relations: ['tags'] });
    }
}
