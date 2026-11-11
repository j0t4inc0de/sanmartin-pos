export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const targetUrl = new URL(`https://api.sangucheriasanmartin.cl${url.pathname}${url.search}`);

  const backendRequest = new Request(targetUrl.toString(), context.request);
  return await fetch(backendRequest);
};
