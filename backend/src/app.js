// src/app.js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PORT, HOST, NODE_ENV } from './config.js';

import usersRoutes from './routes/users.js';
import matchesRoutes from './routes/matches.js';
import statsRoutes from './routes/stats.js';


// ====== Logging “humano” ======
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'warn' : 'info');
// PRETTY por defecto en dev; en prod sólo si lo fuerzas con PRETTY_LOGS=true
const PRETTY = (process.env.PRETTY_LOGS === 'true') || NODE_ENV !== 'production';

const logger = PRETTY
? {
      level: LOG_LEVEL,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          singleLine: true,
          ignore: 'pid,hostname',
        },
      },
    }
  : { level: LOG_LEVEL };

const fastify = Fastify({ logger });

await fastify.register(cors, {
  origin: true, // permite todos los orígenes dinámicamente
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  try {
    const json = JSON.parse(body);
    done(null, json);
  } catch (err) {
    done(err);
  }
});


// Manejador global de errores (json claro)
fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    error: error.name,
    message: error.message,
    stack: NODE_ENV === 'development' ? error.stack : undefined,
  });
});

// ====== Access log conciso (saltando preflights) ======
fastify.addHook('onResponse', (req, reply, done) => {
  if (req.method === 'OPTIONS') return done(); // no log para preflight
  // NEW: usar reply.elapsedTime (ms) en lugar de getResponseTime()
  const rtMs = typeof reply.elapsedTime === 'number' ? reply.elapsedTime : 0;
  const rt = rtMs.toFixed(1);
  req.log.info(`${req.method} ${req.url} -> ${reply.statusCode} ${rt}ms`);
  done();
});

// Rutas
fastify.register(usersRoutes, { prefix: '/users' });
fastify.register(matchesRoutes, { prefix: '/matches' });
fastify.register(statsRoutes, { prefix: '/stats' });

// Inicio
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`🚀 Backend listo en http://${HOST}:${PORT} (${NODE_ENV || 'unknown'})`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Shutdown bonito
const shutdown = async (signal) => {
  try {
    fastify.log.info(`👋 ${signal} recibido. Cerrando...`);
    await fastify.close();
    process.exit(0);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
