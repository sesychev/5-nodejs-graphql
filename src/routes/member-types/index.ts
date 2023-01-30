import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (_request, _reply): Promise<
    MemberTypeEntity[]
  > {
    return await fastify.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, _reply): Promise<MemberTypeEntity | null> {
      if (await fastify.db.memberTypes.findOne({ key: 'id', equals: request.params.id }) === null) throw fastify.httpErrors.notFound();
      return await fastify.db.memberTypes.findOne({ key: 'id', equals: request.params.id });
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, _reply): Promise<MemberTypeEntity> {
      if (await fastify.db.memberTypes.findOne({ key: 'id', equals: request.params.id }) === null) throw fastify.httpErrors.badRequest();
      return await fastify.db.memberTypes.change(request.params.id, request.body);
    }
  );
};

export default plugin;
