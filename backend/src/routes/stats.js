import { getAllStats, getStatsByUserId, createStats, deleteStats } from '../controllers/statsController.js';
import {fastify} from '../app.js';

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
  fastify.get('/', { preHandler: [fastify.authenticate] }, getAllStats);
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, getStatsByUserId);
  fastify.post('/', { preHandler: [fastify.authenticate], schema: statsSchema }, createStats);
  fastify.delete('/:id',{ preHandler: [fastify.authenticate] }, deleteStats);
  fastify.options('*', async (_, reply) => reply.send());
}
