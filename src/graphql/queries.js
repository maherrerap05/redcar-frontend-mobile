// src/graphql/queries.js

import { gql } from 'graphql-request';

// ── Localizaciones ────────────────────────────────────────────────────────────

export const GET_LOCALIZACIONES = gql`
  query {
    obtenerLocalizaciones {
      idLocalizacion
      nombreLocalizacion
      direccionLocalizacion
      estadoLocalizacion
    }
  }
`;

// ── Categorías ────────────────────────────────────────────────────────────────

export const GET_CATEGORIAS = gql`
  query {
    obtenerCategoriasVehiculo {
      idCategoriaVehiculo
      nombreCategoriaVehiculo
    }
  }
`;

// ── Vehículos disponibles ─────────────────────────────────────────────────────

export const GET_VEHICULOS_DISPONIBLES = gql`
  query ObtenerVehiculosDisponibles(
    $idLocalizacionRecogida: Int!
    $fechaHoraRecogida: String!
    $fechaHoraDevolucion: String!
  ) {
    obtenerVehiculosDisponibles(
      idLocalizacionRecogida: $idLocalizacionRecogida
      fechaHoraRecogida: $fechaHoraRecogida
      fechaHoraDevolucion: $fechaHoraDevolucion
    ) {
      idVehiculo
      modeloVehiculo
      aniofabricacIon
      tipoTransmision
      tipoCombustible
      capacidadPasajeros
      capacidadMaletas
      numeroPuertas
      aireAcondicionado
      precioBaseDia
      imagenReferencialUrl
      estadoVehiculo
      idCategoriaVehiculo
    }
  }
`;

// ── Extras ────────────────────────────────────────────────────────────────────

export const GET_EXTRAS = gql`
  query {
    obtenerExtras {
      idExtra
      nombreExtra
      descripcionExtra
      valorFijo
    }
  }
`;

// ── Estado de reserva (polling) ───────────────────────────────────────────────

export const GET_ESTADO_RESERVA = gql`
  query ConsultarEstadoReserva($correlationId: UUID!) {
    consultarEstadoReserva(correlationId: $correlationId) {
      correlationId
      estado
      codigoReserva
      mensaje
      codigoError
      numeroFactura
      estadoFactura
      fechaEmisionFactura
      fechaReservaUtc
      cantidadDias
      subtotalVehiculo
      subtotalExtras
      subtotal
      iva
      total
    }
  }
`;

export const BUSCAR_CONDUCTOR_POR_IDENTIFICACION = gql`
  query BuscarConductorPorIdentificacion($numeroIdentificacion: String!) {
    buscarConductorPorIdentificacion(
      numeroIdentificacion: $numeroIdentificacion
    ) {
      idConductor
      numeroIdentificacion
      tipoIdentificacion
      conNombre1
      conNombre2
      conApellido1
      conApellido2
      numeroLicencia
      fechaVencimientoLicencia
      edadConductor
      conTelefono
      conCorreo
      estadoConductor
      esEliminado
    }
  }
`;

export const BUSCAR_CLIENTE_POR_CORREO = gql`
  query BuscarClientePorCorreo($correo: String!) {
    buscarClientePorCorreo(correo: $correo) {
      idCliente
      tipoIdentificacion
      numeroIdentificacion
      razonSocial
      nombres
      apellidos
      correo
      telefono
      direccion
      estado
      esEliminado
    }
  }
`;