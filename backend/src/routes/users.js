import { getAllUsers, getUserById, createUser } from '../controllers/usersController.js';
import {fastify} from '../app.js';
const userSchema = {
  body: {
    type: 'object',
    required: ['nick', 'avatar'],
    properties: {
      nick: { type: 'string', minLength: 1 },
      avatar: { type: 'string', minLength: 1 }
    }
  }
};

export default async function routes(fastify) {
  fastify.get('/', { preHandler: [fastify.authenticate] }, getAllUsers);
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, getUserById);
  fastify.post('/', { schema: userSchema }, createUser);
  //fastify.delete('/:id', { preHandler: [fastify.authenticate] }, deleteUser);
  fastify.options('*', async (_, reply) => reply.send());
}
