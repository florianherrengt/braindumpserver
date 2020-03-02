import * as config from 'config'
import { Arg, Ctx, Query, Resolver, Mutation, Info } from 'type-graphql';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { SignUpInput, SignInInput } from '../../inputs/user.input';
import * as jwt from 'jsonwebtoken'


@Resolver(User)
class UserResolver {
    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) { }

    @Query(returns => User, { nullable: true })
    async userById(@Arg('id') id: string): Promise<User | undefined> {
        const user = await this.userRepository.findOne(id);
        return user;
    }
    @Query(returns => String, { nullable: true })
    async signIn(@Arg('input') input: SignInInput): Promise<string> {
        const user = await this.userRepository.findOne({ where: { username: input.username } });
        if (!user || !bcrypt.compareSync(input.password, user.password)) {
            throw new Error('Incorrect username/password')
        }
        return jwt.sign({ userId: user.id }, config.get('Jwt.secret'));
    }
    @Mutation(returns => User)
    async signUp(@Arg('input') input: SignUpInput): Promise<User> {
        const newUser = this.userRepository.create({ ...input, password: bcrypt.hashSync(input.password) });
        await this.userRepository.save(newUser);
        if (!newUser) {
            throw new Error('cannot create new user');
        }
        return newUser;
    }
}

export { UserResolver };
