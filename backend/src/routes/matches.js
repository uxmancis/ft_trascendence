import { getAllMatches, getMatchById, createMatch, deleteMatch } from '../controllers/matchesController.js';

const matchSchema = {
  body: {
    type: 'object',
    required: ['player1_id', 'player2_id', 'score_p1', 'score_p2', 'winner_id'],
    properties: {
      player1_id: { type: 'integer' },
      player2_id: { type: 'integer' },
      score_p1: { type: 'integer' },
      score_p2: { type: 'integer' },
      winner_id: { type: 'integer' },
      duration_seconds: { type: 'integer' }
    }
  }
};

export default async function routes(fastify) {
  fastify.get('/', getAllMatches);
  fastify.get('/:id', getMatchById);
  fastify.post('/', { schema: matchSchema }, createMatch);
  fastify.delete('/:id', deleteMatch);
  fastify.options('*', async (_, reply) => reply.send());
}
