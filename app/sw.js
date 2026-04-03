// Este código roda em segundo plano, independente da aba aberta
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando...');
    // Aqui você futuramente adicionaria o cache de arquivos para funcionar offline
});

self.addEventListener('fetch', (event) => {
    // Este evento é necessário para o PWA ser instalável, 
    // mesmo que ele apenas deixe as requisições passarem direto por enquanto.
    event.respondWith(fetch(event.request));
});