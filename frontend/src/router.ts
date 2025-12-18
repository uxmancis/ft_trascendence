import { logTerminal } from './components/IDEComponets/Terminal';
import { t } from './i18n/i18n';

export type RouteHandler = () => Promise<void> | void;

const routes: Record<string, RouteHandler> = {};
let currentHandler: RouteHandler | null = null;

export function register(path: string, handler: RouteHandler){ routes[path] = handler; }

export function getPath() {
  const h = location.hash || '#/';
  const [path] = h.split('?');
  return path;
}

export function getCurrentHandler(): RouteHandler | null {
  return currentHandler;
}

export function navigate(path: string){ 
  if (getPath() !== path){ 
    location.hash = path; 
  } 
}

export function startRouter() {
  const run = async () => {
    const path = getPath();
    const handler = routes[path] || routes['#/404'];
    currentHandler = handler;
    logTerminal(`${t('log.route')}: ${path}`);
    await handler?.();
  };
  addEventListener('hashchange', run);
  run();
}
