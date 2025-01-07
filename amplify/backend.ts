import { defineBackend } from '@aws-amplify/backend';
//import { api } from './backend/api/validateWordApi';
import { auth } from './auth/resource';
import { data } from './data/resource';

defineBackend({
  auth,
  //api,
  data,
});
