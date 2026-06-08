// src/graphql/mutations.js

import { gql } from 'graphql-request';

export const CREAR_RESERVA = gql`
  mutation CrearReserva($input: CrearReservaInput!) {
    crearReserva(input: $input) {
      correlationId
      codigoReserva
      estado
      mensaje
    }
  }
`;