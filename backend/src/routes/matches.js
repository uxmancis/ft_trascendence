// src/routes/matchesRoutes.js
import { getAllMatches, getMatchById, createMatch, deleteMatch } from '../controllers/matchesController.js';

const nonNegInt = { type: 'integer', minimum: 0 };

const matchSchema = {
  body: {
    type: 'object',
    required: ['player1_id', 'player2_id', 'score_p1', 'score_p2', 'winner_id'],
    additionalProperties: false,
    properties: {
      player1_id: { type: 'integer' },
      player2_id: { type: 'integer' },
      score_p1: nonNegInt,
      score_p2: nonNegInt,
      winner_id: { type: 'integer' },
      duration_seconds: nonNegInt
    }
  }
};

export default async function routes(fastify) {
  fastify.get('/', getAllMatches);
  fastify.get('/:id', getMatchById);
  fastify.post('/', { schema: matchSchema }, createMatch);
  fastify.delete('/:id', deleteMatch);
}
