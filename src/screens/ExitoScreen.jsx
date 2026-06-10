// src/screens/ExitoScreen.jsx

import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated
} from 'react-native';

const NEGRO = '#1A1A1A';
const NEGRO_CARD = '#242424';
const ROJO = '#C0392B';
const ROJO_CLARO = '#E74C3C';
const GRIS = '#999999';
const GRIS_LABEL = '#AAAAAA';
const BLANCO = '#FFFFFF';

export default function ExitoScreen({ navigation, route }) {
  const {
    codigoReserva, numeroFactura, estadoFactura,
    fechaEmisionFactura, cantidadDias,
    subtotalVehiculo, subtotalExtras, subtotal, iva, total,
    vehiculo, cliente,
  } = route.params;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1, tension: 50, friction: 5, useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  function formatearFecha(fechaIso) {
    if (!fechaIso) return '—';
    try {
      return new Date(fechaIso).toLocaleDateString('es-EC', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch { return fechaIso; }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Icono animado */}
      <Animated.View style={[
        styles.iconWrapper,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <Text style={styles.iconExito}>✓</Text>
      </Animated.View>

      {/* Título */}
      <Animated.View style={[styles.tituloWrapper, { opacity: opacityAnim }]}>
        <Text style={styles.titulo}>Reserva Confirmada</Text>
        <Text style={styles.subtitulo}>
          Tu reserva ha sido procesada exitosamente.
          La factura ha sido generada a tu nombre.
        </Text>
      </Animated.View>

      {/* Código de reserva y factura */}
      <View style={styles.codigoCard}>
        <Text style={styles.seccionLabel}>CÓDIGO DE RESERVA</Text>
        <Text style={styles.codigoValor}>{codigoReserva}</Text>
        <View style={styles.divider} />
        <Text style={styles.seccionLabel}>NÚMERO DE FACTURA</Text>
        <Text style={styles.facturaValor}>{numeroFactura}</Text>
        <Text style={styles.facturaEstado}>
          {estadoFactura} · {formatearFecha(fechaEmisionFactura)}
        </Text>
      </View>

      {/* Vehículo */}
      <Text style={styles.seccionLabel}>VEHÍCULO RESERVADO</Text>
      <View style={styles.card}>
        <Text style={styles.vehiculoModelo}>{vehiculo.modeloVehiculo}</Text>
        <Text style={styles.vehiculoSub}>
          {vehiculo.aniofabricacIon} · {vehiculo.tipoTransmision}
        </Text>
        <InfoFila
          label="Duración"
          valor={`${cantidadDias} ${cantidadDias === 1 ? 'día' : 'días'}`}
          ultimo
        />
      </View>

      {/* Titular */}
      <Text style={styles.seccionLabel}>TITULAR</Text>
      <View style={styles.card}>
        <InfoFila
          label="Nombre"
          valor={`${cliente.nombres} ${cliente.apellidos || ''}`}
        />
        <InfoFila label="Correo" valor={cliente.correo} />
        <InfoFila label="Teléfono" valor={cliente.telefono} ultimo />
      </View>

      {/* Detalle de pago */}
      <Text style={styles.seccionLabel}>DETALLE DE PAGO</Text>
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

      {/* Nota */}
      <View style={styles.notaBox}>
        <Text style={styles.notaTexto}>
          Conserva tu código de reserva{' '}
          <Text style={styles.notaCodigo}>{codigoReserva}</Text>
          {' '}para cualquier consulta relacionada con tu renta.
        </Text>
      </View>

      {/* Botón nueva reserva */}
      <TouchableOpacity
        style={styles.btnNuevaReserva}
        onPress={() => navigation.navigate('Search')}
      >
        <Text style={styles.btnNuevaReservaText}>Hacer otra reserva</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

function InfoFila({ label, valor, ultimo = false }) {
  return (
    <View style={[styles.infoFila, !ultimo && styles.infoFilaBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValor}>{valor ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEGRO,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: ROJO,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  iconExito: {
    fontSize: 44,
    color: BLANCO,
    fontWeight: 'bold',
  },
  tituloWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BLANCO,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    color: GRIS_LABEL,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  codigoCard: {
    backgroundColor: NEGRO_CARD,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: ROJO,
  },
  seccionLabel: {
    color: GRIS_LABEL,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  codigoValor: {
    fontSize: 22,
    fontWeight: 'bold',
    color: ROJO_CLARO,
    letterSpacing: 2,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    width: '100%',
    marginVertical: 12,
  },
  facturaValor: {
    fontSize: 16,
    fontWeight: '600',
    color: BLANCO,
    marginBottom: 4,
  },
  facturaEstado: {
    fontSize: 12,
    color: GRIS,
  },
  card: {
    backgroundColor: NEGRO_CARD,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
    marginBottom: 4,
  },
  vehiculoModelo: {
    color: BLANCO,
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehiculoSub: {
    color: GRIS,
    fontSize: 13,
    marginBottom: 10,
  },
  infoFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  infoFilaBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoLabel: { fontSize: 13, color: GRIS_LABEL, flex: 1 },
  infoValor: {
    fontSize: 13,
    color: BLANCO,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: { fontSize: 13, color: GRIS_LABEL },
  totalValor: { fontSize: 13, color: BLANCO, fontWeight: '500' },
  grandTotalLabel: { fontSize: 16, fontWeight: 'bold', color: BLANCO },
  grandTotalValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ROJO_CLARO,
  },
  notaBox: {
    backgroundColor: NEGRO_CARD,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ROJO,
  },
  notaTexto: {
    fontSize: 13,
    color: GRIS_LABEL,
    lineHeight: 20,
    textAlign: 'center',
  },
  notaCodigo: {
    fontWeight: 'bold',
    color: ROJO_CLARO,
  },
  btnNuevaReserva: {
    backgroundColor: ROJO,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  btnNuevaReservaText: {
    color: BLANCO,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});