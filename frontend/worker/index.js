import handler from 'vinext/server/app-router-entry';

export default {
  fetch(request, env, context) {
    return handler.fetch(request, env, context);
  },
};
