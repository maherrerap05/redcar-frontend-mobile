// src/screens/EstadoReservaScreen.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert
} from 'react-native';
import client from '../api/gatewayClient';
import { GET_ESTADO_RESERVA } from '../graphql/queries';
import {
  POLLING_INTERVALO_MS,
  POLLING_MAX_INTENTOS
} from '../constants/config';

export default function EstadoReservaScreen({ navigation, route }) {
  const { correlationId, codigoReserva, vehiculo, cliente, totales } = route.params;

  const [estado, setEstado] = useState('EN_PROCESO');
  const [mensaje, setMensaje] = useState('Procesando tu reserva...');
  const [intentos, setIntentos] = useState(0);
  const [resultado, setResultado] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    iniciarPolling();
    return () => detenerPolling();
  }, []);

  function iniciarPolling() {
    // Primera consulta inmediata.
    consultarEstado();

    // Consultas periódicas.
    intervalRef.current = setInterval(() => {
      setIntentos(prev => {
        const nuevosIntentos = prev + 1;

        if (nuevosIntentos >= POLLING_MAX_INTENTOS) {
          detenerPolling();
          setEstado('TIMEOUT');
          setMensaje(
            'La reserva está tardando más de lo esperado. ' +
            'Por favor consulta con el equipo de soporte.'
          );
          return nuevosIntentos;
        }

        consultarEstado();
        return nuevosIntentos;
      });
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
      const data = await client.request(GET_ESTADO_RESERVA, {
        correlationId
      });

      const estadoData = data.consultarEstadoReserva;

      if (!estadoData) return;

      setEstado(estadoData.estado);
      setMensaje(estadoData.mensaje);

      if (estadoData.estado === 'Confirmada') {
        detenerPolling();
        setResultado(estadoData);

        // Navegar a pantalla de éxito.
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
    } catch (err) {
      // Error de red — continuar polling silenciosamente.
    }
  }

  function irAlInicio() {
    navigation.navigate('Search');
  }

  // ── Pantalla de reserva rechazada ─────────────────────────────────────
  if (estado === 'Rechazada') {
    return (
      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <Text style={styles.iconRechazo}>✕</Text>
        </View>
        <Text style={styles.titulo}>Reserva no procesada</Text>
        <Text style={styles.subtitulo}>
          {resultado?.codigoError === 'VEHICULO_NO_DISPONIBLE'
            ? 'El vehículo ya no está disponible para las fechas seleccionadas.'
            : mensaje}
        </Text>
        <Text style={styles.codigo}>Código: {codigoReserva}</Text>
        <TouchableOpacity style={styles.btnPrimario} onPress={irAlInicio}>
          <Text style={styles.btnPrimarioText}>
            Buscar otro vehículo
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Pantalla de timeout ───────────────────────────────────────────────
  if (estado === 'TIMEOUT') {
    return (
      <View style={styles.container}>
        <View style={[styles.iconWrapper, styles.iconWrapperWarning]}>
          <Text style={styles.iconWarning}>⚠️</Text>
        </View>
        <Text style={styles.titulo}>Procesando...</Text>
        <Text style={styles.subtitulo}>
          Tu reserva está siendo procesada pero está tardando más de lo esperado.
          Guarda este código y contáctanos si no recibes confirmación.
        </Text>
        <View style={styles.codigoBox}>
          <Text style={styles.codigoLabel}>Código de seguimiento</Text>
          <Text style={styles.codigoGrande}>{codigoReserva}</Text>
        </View>
        <TouchableOpacity style={styles.btnPrimario} onPress={irAlInicio}>
          <Text style={styles.btnPrimarioText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Pantalla de procesando ────────────────────────────────────────────
// ── Pantalla de procesando ────────────────────────────────────────────
return (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#C0392B" style={styles.spinner} />
    <Text style={styles.titulo}>Confirmando tu reserva</Text>
    <Text style={styles.subtitulo}>
      Por favor espera, esto tomará solo unos segundos...
    </Text>
    <View style={styles.codigoBox}>
      <Text style={styles.codigoLabel}>Código de reserva</Text>
      <Text style={styles.codigoGrande}>{codigoReserva}</Text>
    </View>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    padding: 32
  },
  spinner: { marginBottom: 32 },
  iconWrapper: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24
  },
  iconWrapperWarning: { backgroundColor: '#FFF8E1' },
  iconRechazo: { fontSize: 36, color: '#C0392B' },
  iconWarning: { fontSize: 36 },
  titulo: {
    fontSize: 22, fontWeight: 'bold',
    color: '#222', textAlign: 'center', marginBottom: 12
  },
  subtitulo: {
    fontSize: 15, color: '#666',
    textAlign: 'center', lineHeight: 22, marginBottom: 24
  },
  codigo: {
    fontSize: 14, color: '#888',
    marginBottom: 32
  },
  codigoBox: {
    backgroundColor: '#F5F5F5', borderRadius: 12,
    padding: 20, alignItems: 'center',
    marginBottom: 24, width: '100%'
  },
  codigoLabel: {
    fontSize: 12, color: '#888',
    marginBottom: 8, textTransform: 'uppercase',
    letterSpacing: 1
  },
  codigoGrande: {
    fontSize: 20, fontWeight: 'bold',
    color: '#C0392B', letterSpacing: 1
  },
  infoBox: {
    backgroundColor: '#FFEBEE', borderRadius: 10,
    padding: 14, alignItems: 'center',
    marginBottom: 24, width: '100%'
  },
  infoText: {
    fontSize: 14, color: '#C0392B', fontWeight: '600'
  },
  infoSubtext: {
    fontSize: 12, color: '#E57373', marginTop: 4
  },
  notaText: {
    fontSize: 12, color: '#999',
    textAlign: 'center', lineHeight: 18
  },
  btnPrimario: {
    backgroundColor: '#C0392B', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 32,
    marginTop: 8
  },
  btnPrimarioText: {
    color: '#FFF', fontSize: 16, fontWeight: 'bold'
  },
});