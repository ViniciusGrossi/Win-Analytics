// Share Target handler: intercepts POST /importar from Android share sheet,
// stores the shared image in Cache API, then redirects to the app.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/importar' && event.request.method === 'POST') {
    event.respondWith(
      event.request.formData().then((formData) => {
        const image = formData.get('image');
        if (image && image instanceof File) {
          return caches.open('share-target').then((cache) =>
            cache.put('/shared-image', new Response(image, {
              headers: { 'Content-Type': image.type || 'image/jpeg' },
            }))
          ).then(() => Response.redirect('/importar?shared=1', 303));
        }
        return Response.redirect('/importar', 303);
      }).catch(() => Response.redirect('/importar', 303))
    );
  }
});
