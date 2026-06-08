// src/api/gatewayClient.js

import { GraphQLClient } from 'graphql-request';
import { GATEWAY_GRAPHQL_URL } from '../constants/config';

// Cliente GraphQL configurado hacia el Marketplace Event Gateway.
// graphql-request envía todas las operaciones como POST a la URL configurada.
const client = new GraphQLClient(GATEWAY_GRAPHQL_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;