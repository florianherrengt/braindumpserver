// @ts-nocheck
import { ClassType, ObjectType, Field, Int } from 'type-graphql';

// see https://michallytek.github.io/type-graphql/docs/generic-types.html
export function PaginatedResponse<TItem>(TItemClass: ClassType<TItem>) {
    // `isAbstract` decorator option is mandatory to prevent registering in schema
    @ObjectType(`Paginated${TItemClass.name}Response`, { isAbstract: true })
    class PaginatedResponseClass {
        // here we use the runtime argument
        @Field(type => [TItemClass])
        // and here the generic type
        items: TItem[];

        @Field(type => Int)
        total: number;

        @Field()
        hasMore: boolean;
    }
    return PaginatedResponseClass;
}