import * as config from 'config';
import * as express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import * as TypeORM from 'typeorm';
import { Container } from 'typedi';
import * as jwt from 'jsonwebtoken';
import { UserResolver } from './graphql/resolvers/user.resolver';
import { User, Note } from './entities';
import { NoteResolver } from './graphql/resolvers/note.resolver';
import { JwtObject, createContext, } from './helpers';

export const createApp = async () => {
    const app = express();
    TypeORM.useContainer(Container);
    await TypeORM.createConnection({
        type: 'sqlite',
        database: 'local.db',
        // synchronize: true,
        // dropSchema: true,
        entities: [User, Note],
    });

    const schema = await buildSchema({
        resolvers: [UserResolver, NoteResolver],
        container: Container,
    });

    const apolloServer = new ApolloServer({
        schema,
        tracing: true,
        context: ({ req }) => {
            const token = (req.header('Authorization') || '').split(' ')[1];
            if (!token) {
                return {};
            }
            try {
                const user = jwt.verify(token, config.get('Jwt.secret')) as JwtObject;
                return createContext({ username: user.username });
            } catch (e) {
                return {};
            }
        },
    });

    apolloServer.applyMiddleware({ app, path: '/api/graphql' });
    return app;
};
