const routes = {};
export function register(path, handler) { routes[path] = handler; }
export function getPath() {
    const h = location.hash || '#/';
    const [path] = h.split('?');
    return path;
}
export function navigate(path) { if (getPath() !== path) {
    location.hash = path;
} }
export function startRouter() {
    const run = async () => {
        const path = getPath();
        const handler = routes[path] || routes['#/404'];
        await handler?.();
    };
    addEventListener('hashchange', run);
    run();
}
