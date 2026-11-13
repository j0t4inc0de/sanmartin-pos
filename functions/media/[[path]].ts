export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const targetUrl = new URL(`https://api.sangucheriasanmartin.cl${url.pathname}${url.search}`);
  const backendRequest = new Request(targetUrl.toString(), context.request);
  try {
    return await fetch(backendRequest);
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Media backend no disponible',
        detail: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
