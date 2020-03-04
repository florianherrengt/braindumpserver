import * as config from 'config';
import * as express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import * as TypeORM from 'typeorm';
import { Container } from 'typedi';
import * as jwt from 'jsonwebtoken';
import { User, Note, Tag } from './entities';
import { NoteResolver, UserResolver, TagResolver } from './graphql/resolvers';
import { JwtObject, createContext } from './helpers';
import * as cors from 'cors';

export const createApp = async () => {
    const app = express();
    app.use(cors());
    TypeORM.useContainer(Container);
    await TypeORM.createConnection({
        type: 'sqlite',
        database: 'local.db',
        synchronize: true,
        // dropSchema: true,
        entities: [User, Note, Tag],
    });

    const schema = await buildSchema({
        resolvers: [UserResolver, NoteResolver, TagResolver],
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
