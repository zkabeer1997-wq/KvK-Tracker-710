const SOURCES = {
  gatehouse: {
    url: 'https://raw.githubusercontent.com/ETdoFresh/kenney.nl/master/castle-kit-1.0/Models/wallNarrowGate.obj',
    type: 'text/plain; charset=utf-8',
  },
  wall: {
    url: 'https://raw.githubusercontent.com/ETdoFresh/kenney.nl/master/castle-kit-1.0/Models/wallNarrow.obj',
    type: 'text/plain; charset=utf-8',
  },
  trebuchet: {
    url: 'https://raw.githubusercontent.com/ETdoFresh/kenney.nl/master/castle-kit-1.0/Models/siegeTrebuchet.obj',
    type: 'text/plain; charset=utf-8',
  },
  sword: {
    url: 'https://raw.githubusercontent.com/ETdoFresh/kenney.nl/master/castle-kit-1.0/Models/sword.obj',
    type: 'text/plain; charset=utf-8',
  },
  sentry: {
    url: 'https://raw.githubusercontent.com/ETdoFresh/kenney.nl/master/castle-kit-1.0/Models/knightBlue.obj',
    type: 'text/plain; charset=utf-8',
  },
  knight: {
    url: 'https://raw.githubusercontent.com/ilrein/warptracker/main/public/models/knight.glb',
    type: 'model/gltf-binary',
  },
};

export async function GET(_request, { params }) {
  const source = SOURCES[params.asset];
  if (!source) {
    return new Response('Unknown kingdom asset.', { status: 404 });
  }

  try {
    const upstream = await fetch(source.url, {
      next: { revalidate: 86400 },
      headers: { Accept: '*/*' },
    });

    if (!upstream.ok) {
      return new Response('Kingdom asset is temporarily unavailable.', { status: 502 });
    }

    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': source.type,
        'Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Kingdom asset is temporarily unavailable.', { status: 502 });
  }
}
