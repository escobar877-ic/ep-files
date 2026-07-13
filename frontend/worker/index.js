import handler from 'vinext/server/app-router-entry';
import { handleApiRequest } from './api.js';

export default {
  async fetch(request, env, context) {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }
    return handler.fetch(request, env, context);
  },
};
