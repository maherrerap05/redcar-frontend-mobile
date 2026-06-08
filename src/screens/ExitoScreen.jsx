// src/screens/ExitoScreen.jsx

import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated
} from 'react-native';

export default function ExitoScreen({ navigation, route }) {
  const {
    codigoReserva,
    numeroFactura,
    estadoFactura,
    fechaEmisionFactura,
    cantidadDias,
    subtotalVehiculo,
    subtotalExtras,
    subtotal,
    iva,
    total,
    vehiculo,
    cliente,
  } = route.params;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada del ícono de éxito.
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  function formatearFecha(fechaIso) {
    if (!fechaIso) return '—';
    try {
      const fecha = new Date(fechaIso);
      return fecha.toLocaleDateString('es-EC', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch {
      return fechaIso;
    }
  }

  function nuevaReserva() {
    navigation.navigate('Search');
  }

  return (
    <ScrollView style={styles.container}
      contentContainerStyle={styles.content}>

      {/* Ícono de éxito animado */}
      <Animated.View style={[
        styles.iconWrapper,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <Text style={styles.iconExito}>✓</Text>
      </Animated.View>

      {/* Título */}
      <Animated.View style={{ opacity: opacityAnim }}>
        <Text style={styles.titulo}>¡Reserva Confirmada!</Text>
        <Text style={styles.subtitulo}>
          Tu reserva ha sido procesada exitosamente.
          La factura ha sido generada a tu nombre.
        </Text>
      </Animated.View>

      {/* Código de reserva */}
      <View style={styles.codigoCard}>
        <Text style={styles.codigoLabel}>Código de reserva</Text>
        <Text style={styles.codigoValor}>{codigoReserva}</Text>
        <View style={styles.divider} />
        <Text style={styles.codigoLabel}>Número de factura</Text>
        <Text style={styles.facturaValor}>{numeroFactura}</Text>
        <Text style={styles.facturaEstado}>
          Estado: {estadoFactura} · {formatearFecha(fechaEmisionFactura)}
        </Text>
      </View>

      {/* Resumen del vehículo */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitle}>🚗 Vehículo reservado</Text>
        <View style={styles.card}>
          <Text style={styles.vehiculoModelo}>
            {vehiculo.modeloVehiculo}
          </Text>
          <Text style={styles.vehiculoSub}>
            {vehiculo.aniofabricacIon} · {vehiculo.tipoTransmision}
          </Text>
          <InfoFila
            label="Duración"
            valor={`${cantidadDias} ${cantidadDias === 1 ? 'día' : 'días'}`}
          />
        </View>
      </View>

      {/* Datos del titular */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitle}>🧾 Titular</Text>
        <View style={styles.card}>
          <InfoFila
            label="Nombre"
            valor={`${cliente.nombres} ${cliente.apellidos || ''}`}
          />
          <InfoFila label="Correo" valor={cliente.correo} />
          <InfoFila label="Teléfono" valor={cliente.telefono} />
        </View>
      </View>

      {/* Resumen financiero */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitle}>💳 Detalle de pago</Text>
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Vehículo ({cantidadDias} día(s))
            </Text>
            <Text style={styles.totalValor}>
              ${Number(subtotalVehiculo).toFixed(2)}
            </Text>
          </View>
          {subtotalExtras > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Extras</Text>
              <Text style={styles.totalValor}>
                ${Number(subtotalExtras).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValor}>
              ${Number(subtotal).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA 15%</Text>
            <Text style={styles.totalValor}>
              ${Number(iva).toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total pagado</Text>
            <Text style={styles.grandTotalValor}>
              ${Number(total).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Nota informativa */}
      <View style={styles.notaBox}>
        <Text style={styles.notaTexto}>
          📧 Conserva tu código de reserva{' '}
          <Text style={styles.notaCodigo}>{codigoReserva}</Text>{' '}
          para cualquier consulta o trámite relacionado con tu renta.
        </Text>
      </View>

      {/* Botón nueva reserva */}
      <TouchableOpacity
        style={styles.btnNuevaReserva}
        onPress={nuevaReserva}
      >
        <Text style={styles.btnNuevaReservaText}>
          🚗 Hacer otra reserva
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ── Componente auxiliar ───────────────────────────────────────────────────────

function InfoFila({ label, valor }) {
  return (
    <View style={styles.infoFila}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValor}>{valor ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: {
    padding: 16, paddingBottom: 48,
    alignItems: 'center'
  },
  iconWrapper: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#C0392B',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 24, marginBottom: 20,
    elevation: 4,
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8
  },
  iconExito: {
    fontSize: 48, color: '#FFF', fontWeight: 'bold'
  },
  titulo: {
    fontSize: 26, fontWeight: 'bold',
    color: '#222', textAlign: 'center', marginBottom: 10
  },
  subtitulo: {
    fontSize: 14, color: '#666',
    textAlign: 'center', lineHeight: 22,
    marginBottom: 24, paddingHorizontal: 16
  },
  codigoCard: {
    backgroundColor: '#FFF', borderRadius: 16,
    padding: 24, width: '100%', marginBottom: 20,
    alignItems: 'center', elevation: 2,
    borderWidth: 2, borderColor: '#C0392B'
  },
  codigoLabel: {
    fontSize: 11, color: '#999',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 6
  },
  codigoValor: {
    fontSize: 24, fontWeight: 'bold',
    color: '#C0392B', letterSpacing: 2,
    marginBottom: 16
  },
  divider: {
    height: 1, backgroundColor: '#F0F0F0',
    width: '100%', marginVertical: 12
  },
  facturaValor: {
    fontSize: 16, fontWeight: '600',
    color: '#333', marginBottom: 4
  },
  facturaEstado: { fontSize: 12, color: '#888' },
  seccion: { width: '100%', marginBottom: 16 },
  seccionTitle: {
    fontSize: 15, fontWeight: 'bold',
    color: '#333', marginBottom: 8
  },
  card: {
    backgroundColor: '#FFF', borderRadius: 12,
    padding: 16, elevation: 1
  },
  vehiculoModelo: {
    fontSize: 18, fontWeight: 'bold',
    color: '#222', marginBottom: 4
  },
  vehiculoSub: {
    fontSize: 13, color: '#888', marginBottom: 10
  },
  infoFila: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5'
  },
  infoLabel: { fontSize: 13, color: '#888', flex: 1 },
  infoValor: {
    fontSize: 13, color: '#333',
    fontWeight: '500', flex: 2, textAlign: 'right'
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 8
  },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValor: { fontSize: 14, color: '#333', fontWeight: '500' },
  grandTotalLabel: {
    fontSize: 16, fontWeight: 'bold', color: '#333'
  },
  grandTotalValor: {
    fontSize: 18, fontWeight: 'bold', color: '#C0392B'
  },
  notaBox: {
    backgroundColor: '#FFEBEE', borderRadius: 12,
    padding: 16, width: '100%', marginBottom: 20
  },
  notaTexto: {
    fontSize: 13, color: '#555', lineHeight: 20, textAlign: 'center'
  },
  notaCodigo: { fontWeight: 'bold', color: '#C0392B' },
  btnNuevaReserva: {
    backgroundColor: '#C0392B', borderRadius: 12,
    paddingVertical: 16, paddingHorizontal: 40,
    alignItems: 'center', width: '100%'
  },
  btnNuevaReservaText: {
    color: '#FFF', fontSize: 16, fontWeight: 'bold'
  },
});