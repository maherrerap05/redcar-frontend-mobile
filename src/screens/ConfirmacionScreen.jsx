// src/screens/ConfirmacionScreen.jsx

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import client from '../api/gatewayClient';
import { CREAR_RESERVA } from '../graphql/mutations';

export default function ConfirmacionScreen({ navigation, route }) {
  const { busqueda, vehiculo, extras, conductores, totales, cliente } = route.params;

  const [procesando, setProcesando] = useState(false);
  const [paso, setPaso] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  async function confirmarReserva() {
    if (!aceptaTerminos) {
      Alert.alert(
        'Términos requeridos',
        'Debes aceptar los términos y condiciones para continuar.',
        [{ text: 'OK' }]
      );
      return;
    }

    setProcesando(true);
    setPaso('Preparando tu reserva...');

    try {
      setPaso('Publicando solicitud de reserva...');

      const input = {
        idVehiculo: vehiculo.idVehiculo,
        idLocalizacionRecogida: busqueda.idLocalizacionRecogida,
        idLocalizacionDevolucion: busqueda.idLocalizacionDevolucion,
        fechaRecogida: busqueda.fechaRecogida,
        horaRecogida: `${busqueda.horaRecogida}:00`,
        fechaDevolucion: busqueda.fechaDevolucion,
        horaDevolucion: `${busqueda.horaDevolucion}:00`,
        observaciones: '',
        cliente: {
          tipoIdentificacion: cliente.tipoIdentificacion,
          numeroIdentificacion: cliente.numeroIdentificacion,
          razonSocial: cliente.razonSocial || null,
          nombres: cliente.nombres,
          apellidos: cliente.apellidos || '',
          correo: cliente.correo,
          telefono: cliente.telefono,
          direccion: cliente.direccion || 'No especificada',
        },
        conductores: conductores.map((c, i) => ({
          tipoIdentificacion: c.tipoIdentificacion,
          numeroIdentificacion: c.numeroIdentificacion,
          conNombre1: c.conNombre1,
          conNombre2: c.conNombre2 || null,
          conApellido1: c.conApellido1,
          conApellido2: c.conApellido2 || null,
          numeroLicencia: c.numeroIdentificacion,
          fechaVencimientoLicencia: c.fechaVencimientoLicencia,
          edadConductor: Number(c.edadConductor),
          conTelefono: c.conTelefono,
          conCorreo: c.conCorreo,
          esPrincipal: i === 0,
        })),
        extras: extras.map(e => ({
          idExtra: e.idExtra,
          cantidad: e.cantidad,
        })),
      };

      const data = await client.request(CREAR_RESERVA, { input });
      const resultado = data.crearReserva;

      if (!resultado?.correlationId) {
        throw new Error('No se recibió confirmación del servidor.');
      }

      setProcesando(false);

      // Navegar a la pantalla de estado para el polling.
      navigation.navigate('EstadoReserva', {
        correlationId: resultado.correlationId,
        codigoReserva: resultado.codigoReserva,
        vehiculo,
        cliente,
        totales,
      });

    } catch (err) {
      setProcesando(false);
      setPaso('');
      Alert.alert(
        'Error al procesar la reserva',
        err?.message || 'Ocurrió un error inesperado. Por favor intenta de nuevo.',
        [{ text: 'OK' }]
      );
    }
  }

  return (
    <ScrollView style={styles.container}
      contentContainerStyle={styles.content}>

      {/* Vehículo */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitle}>🚗 Vehículo seleccionado</Text>
        <View style={styles.card}>
          <Text style={styles.vehiculoModelo}>{vehiculo.modeloVehiculo}</Text>
          <Text style={styles.vehiculoSub}>
            {vehiculo.aniofabricacIon} · {vehiculo.tipoTransmision}
          </Text>
          <View style={styles.specs}>
            <Text style={styles.spec}>👥 {vehiculo.capacidadPasajeros} pas.</Text>
            <Text style={styles.spec}>⛽ {vehiculo.tipoCombustible}</Text>
            {vehiculo.aireAcondicionado && (
              <Text style={styles.spec}>❄️ A/C</Text>
            )}
          </View>
        </View>
      </View>

      {/* Fechas */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitle}>📅 Fechas de renta</Text>
        <View style={styles.card}>
          <InfoFila
            label="Sucursal recogida"
            valor={busqueda.nombreLocalizacionRecogida}
          />
          <InfoFila
            label="Recogida"
            valor={`${busqueda.fechaRecogida} a las ${busqueda.horaRecogida}`}
          />
          <InfoFila
            label="Sucursal devolución"
            valor={busqueda.nombreLocalizacionDevolucion ||
              busqueda.nombreLocalizacionRecogida}
          />
          <InfoFila
            label="Devolución"
            valor={`${busqueda.fechaDevolucion} a las ${busqueda.horaDevolucion}`}
          />
          <InfoFila
            label="Duración"
            valor={`${busqueda.dias} ${busqueda.dias === 1 ? 'día' : 'días'}`}
          />
        </View>
      </View>

      {/* Conductores */}
      {conductores.length > 0 && (
        <View style={styles.seccion}>
          <Text style={styles.seccionTitle}>👤 Conductores</Text>
          <View style={styles.card}>
            {conductores.map((c, i) => (
              <View key={i} style={styles.conductorItem}>
                <Text style={styles.conductorBadge}>
                  {i === 0 ? '⭐ Principal' : `Adicional ${i}`}
                </Text>
                <Text style={styles.conductorNombre}>
                  {c.conNombre1} {c.conApellido1}
                </Text>
                <Text style={styles.conductorId}>
                  ID: {c.numeroIdentificacion}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Datos del cliente */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitle}>🧾 Titular de la reserva</Text>
        <View style={styles.card}>
          <InfoFila
            label="Nombre"
            valor={`${cliente.nombres} ${cliente.apellidos || ''}`}
          />
          <InfoFila label="Correo" valor={cliente.correo} />
          <InfoFila label="Teléfono" valor={cliente.telefono} />
          <InfoFila
            label="Identificación"
            valor={`${cliente.tipoIdentificacion}: ${cliente.numeroIdentificacion}`}
          />
        </View>
      </View>

      {/* Extras */}
      {extras.length > 0 && (
        <View style={styles.seccion}>
          <Text style={styles.seccionTitle}>🎒 Extras incluidos</Text>
          <View style={styles.card}>
            {extras.map((e, i) => (
              <View key={i} style={styles.extraItem}>
                <Text style={styles.extraNombre}>Extra #{e.idExtra}</Text>
                <Text style={styles.extraCantidad}>×{e.cantidad}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Resumen de pago */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitle}>💳 Resumen de pago</Text>
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Vehículo ({busqueda.dias} día(s))
            </Text>
            <Text style={styles.totalValor}>
              ${totales.subtotalVehiculo.toFixed(2)}
            </Text>
          </View>
          {totales.subtotalExtras > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Extras</Text>
              <Text style={styles.totalValor}>
                ${totales.subtotalExtras.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValor}>
              ${totales.subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA 15%</Text>
            <Text style={styles.totalValor}>
              ${totales.iva.toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total a pagar</Text>
            <Text style={styles.grandTotalValor}>
              ${totales.total.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Términos y condiciones */}
      <TouchableOpacity
        style={styles.terminosRow}
        onPress={() => setAceptaTerminos(!aceptaTerminos)}
      >
        <View style={[styles.checkbox,
          aceptaTerminos && styles.checkboxChecked]}>
          {aceptaTerminos && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
        <Text style={styles.terminosText}>
          Acepto los términos y condiciones de renta de RedCar.
          Entiendo que al confirmar se generará una reserva y
          factura a mi nombre.
        </Text>
      </TouchableOpacity>

      {/* Botón confirmar */}
      <TouchableOpacity
        style={[styles.btnConfirmar,
          procesando && styles.btnConfirmarDisabled]}
        onPress={confirmarReserva}
        disabled={procesando}
      >
        {procesando ? (
          <View style={styles.procesandoRow}>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.btnConfirmarText}>{paso}</Text>
          </View>
        ) : (
          <Text style={styles.btnConfirmarText}>
            🔒 Confirmar Reserva
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnVolver}
        onPress={() => navigation.goBack()}
        disabled={procesando}
      >
        <Text style={styles.btnVolverText}>← Volver</Text>
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
  content: { padding: 16, paddingBottom: 40 },
  seccion: { marginBottom: 16 },
  seccionTitle: {
    fontSize: 15, fontWeight: 'bold',
    color: '#333', marginBottom: 8
  },
  card: {
    backgroundColor: '#FFF', borderRadius: 12,
    padding: 16, elevation: 1
  },
  vehiculoModelo: {
    fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 4
  },
  vehiculoSub: { fontSize: 13, color: '#888', marginBottom: 10 },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  spec: {
    fontSize: 12, color: '#555',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
  },
  infoFila: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F5F5F5'
  },
  infoLabel: { fontSize: 13, color: '#888', flex: 1 },
  infoValor: {
    fontSize: 13, color: '#333',
    fontWeight: '500', flex: 2, textAlign: 'right'
  },
  conductorItem: {
    paddingVertical: 8, borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5'
  },
  conductorBadge: {
    fontSize: 12, color: '#C0392B',
    fontWeight: '600', marginBottom: 2
  },
  conductorNombre: { fontSize: 14, color: '#333', fontWeight: '500' },
  conductorId: { fontSize: 12, color: '#888' },
  extraItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6
  },
  extraNombre: { fontSize: 14, color: '#333' },
  extraCantidad: { fontSize: 14, color: '#C0392B', fontWeight: '600' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 8
  },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValor: { fontSize: 14, color: '#333', fontWeight: '500' },
  divider: {
    height: 1, backgroundColor: '#EEE',
    marginVertical: 8
  },
  grandTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  grandTotalValor: {
    fontSize: 18, fontWeight: 'bold', color: '#C0392B'
  },
  terminosRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, marginBottom: 20, padding: 12,
    backgroundColor: '#FFF', borderRadius: 12
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 4,
    borderWidth: 2, borderColor: '#C0392B',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2
  },
  checkboxChecked: { backgroundColor: '#C0392B' },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  terminosText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },
  btnConfirmar: {
    backgroundColor: '#C0392B', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginBottom: 10
  },
  btnConfirmarDisabled: { backgroundColor: '#E0A0A0' },
  btnConfirmarText: {
    color: '#FFF', fontSize: 16, fontWeight: 'bold'
  },
  procesandoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10
  },
  btnVolver: {
    borderWidth: 1, borderColor: '#C0392B',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center'
  },
  btnVolverText: { color: '#C0392B', fontSize: 14, fontWeight: '600' },
});