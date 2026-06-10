// src/screens/EstadoReservaScreen.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity
} from 'react-native';
import client from '../api/gatewayClient';
import { GET_ESTADO_RESERVA } from '../graphql/queries';
import { POLLING_INTERVALO_MS, POLLING_MAX_INTENTOS } from '../constants/config';

const NEGRO = '#1A1A1A';
const NEGRO_CARD = '#242424';
const ROJO = '#C0392B';
const ROJO_CLARO = '#E74C3C';
const GRIS = '#999999';
const GRIS_LABEL = '#AAAAAA';
const BLANCO = '#FFFFFF';

export default function EstadoReservaScreen({ navigation, route }) {
  const { correlationId, codigoReserva, vehiculo, cliente, totales } = route.params;

  const [estado, setEstado] = useState('EN_PROCESO');
  const [mensaje, setMensaje] = useState('Procesando tu reserva...');
  const [resultado, setResultado] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    iniciarPolling();
    return () => detenerPolling();
  }, []);

  function iniciarPolling() {
    consultarEstado();
    let intentos = 0;
    intervalRef.current = setInterval(() => {
      intentos += 1;
      if (intentos >= POLLING_MAX_INTENTOS) {
        detenerPolling();
        setEstado('TIMEOUT');
        setMensaje(
          'La reserva está tardando más de lo esperado. ' +
          'Consulta con el equipo de soporte.'
        );
        return;
      }
      consultarEstado();
    }, POLLING_INTERVALO_MS);
  }

  function detenerPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  async function consultarEstado() {
    try {
      const data = await client.request(GET_ESTADO_RESERVA, { correlationId });
      const estadoData = data.consultarEstadoReserva;
      if (!estadoData) return;

      setEstado(estadoData.estado);
      setMensaje(estadoData.mensaje);

      if (estadoData.estado === 'Confirmada') {
        detenerPolling();
        setResultado(estadoData);
        navigation.replace('Exito', {
          codigoReserva: estadoData.codigoReserva,
          numeroFactura: estadoData.numeroFactura,
          estadoFactura: estadoData.estadoFactura,
          fechaEmisionFactura: estadoData.fechaEmisionFactura,
          cantidadDias: estadoData.cantidadDias,
          subtotalVehiculo: estadoData.subtotalVehiculo,
          subtotalExtras: estadoData.subtotalExtras,
          subtotal: estadoData.subtotal,
          iva: estadoData.iva,
          total: estadoData.total,
          vehiculo,
          cliente,
        });
      } else if (estadoData.estado === 'Rechazada') {
        detenerPolling();
        setResultado(estadoData);
      }
    } catch { }
  }

  // ── Rechazada ─────────────────────────────────────────────────────────
  if (estado === 'Rechazada') {
    return (
      <View style={styles.container}>
        <View style={styles.iconCirculo}>
          <Text style={styles.iconTexto}>✕</Text>
        </View>
        <Text style={styles.titulo}>Reserva no procesada</Text>
        <Text style={styles.subtitulo}>
          {resultado?.codigoError === 'VEHICULO_NO_DISPONIBLE'
            ? 'El vehículo ya no está disponible para las fechas seleccionadas.'
            : mensaje}
        </Text>
        <View style={styles.codigoBox}>
          <Text style={styles.codigoLabel}>CÓDIGO DE REFERENCIA</Text>
          <Text style={styles.codigoGrande}>{codigoReserva}</Text>
        </View>
        <TouchableOpacity
          style={styles.btnPrimario}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.btnPrimarioText}>Buscar otro vehículo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Timeout ───────────────────────────────────────────────────────────
  if (estado === 'TIMEOUT') {
    return (
      <View style={styles.container}>
        <View style={[styles.iconCirculo, styles.iconCirculoWarning]}>
          <Text style={styles.iconTexto}>!</Text>
        </View>
        <Text style={styles.titulo}>Procesando...</Text>
        <Text style={styles.subtitulo}>
          Tu reserva está siendo procesada pero está tardando más de lo esperado.
          Guarda este código y contáctanos si no recibes confirmación.
        </Text>
        <View style={styles.codigoBox}>
          <Text style={styles.codigoLabel}>CÓDIGO DE SEGUIMIENTO</Text>
          <Text style={styles.codigoGrande}>{codigoReserva}</Text>
        </View>
        <TouchableOpacity
          style={styles.btnPrimario}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.btnPrimarioText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Procesando ────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={ROJO} style={styles.spinner} />
      <Text style={styles.titulo}>Confirmando tu reserva</Text>
      <Text style={styles.subtitulo}>
        Por favor espera, esto tomará solo unos segundos...
      </Text>
      <View style={styles.codigoBox}>
        <Text style={styles.codigoLabel}>CÓDIGO DE RESERVA</Text>
        <Text style={styles.codigoGrande}>{codigoReserva}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEGRO,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  spinner: { marginBottom: 32 },
  iconCirculo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ROJO,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCirculoWarning: {
    backgroundColor: '#B7770D',
  },
  iconTexto: {
    fontSize: 36,
    color: BLANCO,
    fontWeight: 'bold',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: BLANCO,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitulo: {
    fontSize: 14,
    color: GRIS_LABEL,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  codigoBox: {
    backgroundColor: NEGRO_CARD,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
  },
  codigoLabel: {
    fontSize: 10,
    color: GRIS_LABEL,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  codigoGrande: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ROJO_CLARO,
    letterSpacing: 1,
  },
  btnPrimario: {
    backgroundColor: ROJO,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  btnPrimarioText: {
    color: BLANCO,
    fontSize: 15,
    fontWeight: 'bold',
  },
});