import { getAllStats, getStatsByUserId, createStats, deleteStats } from '../controllers/statsController.js';

const statsSchema = {
  body: {
    type: 'object',
    required: ['user_id'],
    properties: {
      user_id: { type: 'integer' }
    }
  }
};

export default async function routes(fastify) {
  fastify.get('/', getAllStats);
  fastify.get('/:id', getStatsByUserId);
  fastify.post('/', { schema: statsSchema }, createStats);
  fastify.delete('/:id', deleteStats);
  fastify.options('*', async (_, reply) => reply.send());
}
