import * as config from 'config'
import { Arg, Ctx, Query, Resolver, Mutation, Info } from 'type-graphql';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { SignUpInput, SignInInput } from '../../inputs/user.input';
import * as jwt from 'jsonwebtoken'

export interface JwtObject {
    username: string
}

const createJwt = (user: User): string => {
    if (!user.username) {
        throw new Error('Jwt needs a username')
    }
    const jwtContent: JwtObject = { username: user.username }
    return jwt.sign(jwtContent, config.get('Jwt.secret'));
}

@Resolver(User)
class UserResolver {
    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) { }

    @Query(returns => User, { nullable: true })
    async userById(@Arg('username') username: string): Promise<User | undefined> {
        const user = await this.userRepository.findOne(username);
        return user;
    }
    @Query(returns => String, { nullable: true })
    async signIn(@Arg('input') input: SignInInput): Promise<string> {
        const user = await this.userRepository.findOne({ where: { username: input.username } });
        if (!user || !bcrypt.compareSync(input.password, user.password)) {
            throw new Error('Incorrect username/password')
        }

        return createJwt(user)
    }
    @Mutation(returns => String)
    async signUp(@Arg('input') input: SignUpInput): Promise<string> {
        const newUser = this.userRepository.create({ ...input, password: bcrypt.hashSync(input.password) });
        await this.userRepository.save(newUser);
        if (!newUser) {
            throw new Error('cannot create new user');
        }
        return createJwt(newUser)
    }
}

export { UserResolver };
