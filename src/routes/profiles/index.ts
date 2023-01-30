import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    return await fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | null> {
      if (await fastify.db.profiles.findOne({ key: "id", equals: request.params.id }) === null) throw fastify.httpErrors.notFound();
      return await fastify.db.profiles.findOne({ key: "id", equals: request.params.id });
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      if (await fastify.db.memberTypes.findOne({ key: 'id', equals: request.body.memberTypeId }) === null) throw fastify.httpErrors.badRequest();
      if (await fastify.db.profiles.findOne({ key: 'userId', equals: request.body.userId })) throw fastify.httpErrors.badRequest();
      return await fastify.db.profiles.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      if (await fastify.db.profiles.findOne({ key: 'id', equals: request.params.id }) === null) throw fastify.httpErrors.badRequest();
      return await fastify.db.profiles.delete(request.params.id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      if (await fastify.db.profiles.findOne({ key: 'id', equals: request.params.id }) === null) throw fastify.httpErrors.badRequest();
      return await fastify.db.profiles.change(request.params.id, request.body);
    }
  );
};

export default plugin;
