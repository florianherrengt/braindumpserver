import { UserResolver } from './user.resolver';
import { Repository } from 'typeorm';
import { User } from 'src/entities';

describe('Resolvers/User', () => {
    it('getUserById', async () => {
        const fakeUser = { username: Math.random().toString() };
        const userRepository = ({ findOne: jest.fn(() => fakeUser) } as unknown) as Repository<User>;
        const resolver = new UserResolver(userRepository);
        const user = await resolver.userById(fakeUser.username);
        expect(user).toBe(fakeUser);
        expect(userRepository.findOne).toHaveBeenCalledTimes(1);
        expect(userRepository.findOne).toHaveBeenCalledWith(fakeUser.username);
    });
    it('signUp', async () => {
        const input = { username: Math.random().toString(), password: Math.random().toString() };
        const fakeUser = {}
        const userRepository = { create: jest.fn().mockResolvedValue(fakeUser), save: jest.fn() }
        const resolver = new UserResolver(userRepository as unknown as Repository<User>);
        const user = await resolver.signUp(input);
        expect(user).toBe(fakeUser);
        expect(userRepository.create).toHaveBeenCalledTimes(1);
        expect(userRepository.create.mock.calls[0][0].password).not.toEqual(input.password)
    });
});
