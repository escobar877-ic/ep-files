import handler from 'vinext/server/app-router-entry';
import { handleApiRequest } from './api.js';

export default {
  async fetch(request, env, context) {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      try {
        return await handleApiRequest(request, env);
      } catch (error) {
        console.error('Unhandled EP Files API error', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
      }
    }
    return handler.fetch(request, env, context);
  },
};
