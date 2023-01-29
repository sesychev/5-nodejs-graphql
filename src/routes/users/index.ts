import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | null> {
      if (await fastify.db.users.findOne({ key: "id", equals: request.params.id }) === null) throw fastify.httpErrors.notFound();
      return fastify.db.users.findOne({ key: 'id', equals: request.params.id }) || fastify.httpErrors.notFound();
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      return await fastify.db.users.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      if (await fastify.db.users.findOne({ key: 'id', equals: request.params.id }) === null) throw fastify.httpErrors.badRequest();
      if (await fastify.db.profiles.findOne({ key: 'userId', equals: request.params.id }) === null) throw fastify.httpErrors.badRequest();
      await Promise.all((await fastify.db.posts.findMany({ key: 'userId', equals: request.params.id })).map(async (item) => await fastify.db.posts.delete(item.id)));
      await fastify.db.profiles.delete((await fastify.db.profiles.findOne({ key: 'userId', equals: request.params.id }))!.id);
      await Promise.all((await fastify.db.users.findMany({ key: 'subscribedToUserIds', inArray: request.params.id })).map(async (item) => {
        item.subscribedToUserIds.splice(item.subscribedToUserIds.indexOf(request.params.id), 1);
        await fastify.db.users.change(item.id, { subscribedToUserIds: item.subscribedToUserIds });
      }),
      );
      return await fastify.db.users.delete(request.params.id);
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      if (await fastify.db.users.findOne({ key: 'id', equals: request.body.userId }) === null) throw fastify.httpErrors.badRequest();
      return await fastify.db.users.change(request.body.userId, { subscribedToUserIds: [...(await fastify.db.users.findOne({ key: 'id', equals: request.body.userId }))!.subscribedToUserIds, request.params.id] });
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      if (await fastify.db.users.findOne({ key: 'id', equals: request.body.userId }) === null) throw fastify.httpErrors.badRequest();
      if (!(await fastify.db.users.findOne({ key: 'id', equals: request.body.userId }))!.subscribedToUserIds.includes(request.params.id)) throw fastify.httpErrors.badRequest();
      const filtered = (await fastify.db.users.findOne({ key: 'id', equals: request.body.userId }))?.subscribedToUserIds.filter(value => value !== request.params.id)
      return await fastify.db.users.change(request.body.userId, { subscribedToUserIds: filtered });
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      if (await fastify.db.users.findOne({ key: 'id', equals: request.params.id }) === null) throw fastify.httpErrors.badRequest();
      return await fastify.db.users.change(request.params.id, request.body);
    }
  );
};

export default plugin;
