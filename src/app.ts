import * as config from 'config'
import * as express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { UserResolver } from './graphql/resolvers/user.resolver';
import * as TypeORM from 'typeorm';
import { Container } from 'typedi';
import * as jwt from 'jsonwebtoken'

export const createApp = async () => {
    const app = express();
    TypeORM.useContainer(Container);
    await TypeORM.createConnection();

    const schema = await buildSchema({
        resolvers: [UserResolver],
        container: Container,
    });

    const apolloServer = new ApolloServer({
        schema,
        tracing: true,
        context: ({ req }) => {
            const token = (req.header("Authorization") || '').split(' ')[1]
            if (!token) {
                return {}
            }
            try {
                return { user: jwt.verify(token, config.get('Jwt.secret')) }
            } catch (e) {
                return {}
            }
        }
    });

    apolloServer.applyMiddleware({ app, path: '/api/graphql' });
    return app;
};
