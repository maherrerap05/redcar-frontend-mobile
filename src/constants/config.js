// src/constants/config.js

// URL pública del Marketplace Event Gateway expuesta via ngrok.
// IMPORTANTE: ngrok genera una URL nueva cada vez que se reinicia.
// Si reinicias ngrok, actualiza esta URL y reinicia Expo.
export const GATEWAY_GRAPHQL_URL = 'https://redcar-api.duckdns.org/gateway/graphql';

// IVA aplicado en Ecuador
export const IVA_PORCENTAJE = 0.15;

// Tiempo de polling en milisegundos para consultar el estado de la reserva
export const POLLING_INTERVALO_MS = 3000;

// Máximo de intentos de polling antes de mostrar timeout
export const POLLING_MAX_INTENTOS = 20;