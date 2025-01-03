import { defineFunction } from '@aws-amplify/backend';
import { RestApi } from '@aws-amplify/backend-api';

const validateWordFunction = defineFunction({
  name: 'validateWord',
  entry: '../function/validateWord/index.ts'
});

export const api = new RestApi({
  routes: {
    '/validateWord': {
      get: validateWordFunction
    }
  }
});

export default api;