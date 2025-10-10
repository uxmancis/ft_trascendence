export type RouteHandler = () => Promise<void> | void;

const routes: Record<string, RouteHandler> = {};
export function register(path: string, handler: RouteHandler){ routes[path] = handler; }

export function getPath() {
  const h = location.hash || '#/';
  const [path] = h.split('?');
  return path;
}

export function navigate(path: string){ if (getPath() !== path){ location.hash = path; } }

export function startRouter() {
  const run = async () => {
    const path = getPath();
    const handler = routes[path] || routes['#/404'];
    await handler?.();
  };
  addEventListener('hashchange', run);
  run();
}
