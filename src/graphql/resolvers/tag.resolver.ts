import { ForbiddenError } from 'apollo-server-express';
import { AppContext } from 'src/helpers';
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Tag } from '../../entities';
import { CreateTagInput } from '../inputs/tag.input';

@Resolver(Tag)
export class TagResolver {
    constructor(@InjectRepository(Tag) private readonly tagRepository: Repository<Tag>) {}

    @Query(returns => [Tag])
    async currentUserTags(@Ctx() context: AppContext): Promise<Tag[]> {
        if (!context.user) {
            throw new ForbiddenError('User not logged in');
        }
        const { username } = context.user;
        return this.tagRepository.find({
            where: { user: { username } },
        });
    }
    @Mutation(returns => Tag)
    async createTag(@Arg('input') input: CreateTagInput, @Ctx() context: AppContext): Promise<Tag> {
        if (!context.user) {
            throw new ForbiddenError('User not logged in');
        }
        const { username } = context.user;
        const newTag = this.tagRepository.create({ ...input, user: { username } });
        await this.tagRepository.save(newTag);
        return newTag;
    }
}
