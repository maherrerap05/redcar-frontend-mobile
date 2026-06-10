// src/screens/ConfirmacionScreen.jsx

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import client from '../api/gatewayClient';
import { CREAR_RESERVA } from '../graphql/mutations';

const NEGRO = '#1A1A1A';
const NEGRO_CARD = '#242424';
const NEGRO_INPUT = '#2E2E2E';
const ROJO = '#C0392B';
const ROJO_CLARO = '#E74C3C';
const GRIS = '#999999';
const GRIS_LABEL = '#AAAAAA';
const BLANCO = '#FFFFFF';

export default function ConfirmacionScreen({ navigation, route }) {
  const { busqueda, vehiculo, extras, conductores, totales, cliente } = route.params;

  const [procesando, setProcesando] = useState(false);
  const [paso, setPaso] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  async function confirmarReserva() {
    if (!aceptaTerminos) {
      Alert.alert('Términos requeridos',
        'Debes aceptar los términos y condiciones para continuar.',
        [{ text: 'OK' }]);
      return;
    }
    setProcesando(true);
    setPaso('Publicando solicitud de reserva...');
    try {
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

      if (!resultado?.correlationId)
        throw new Error('No se recibió confirmación del servidor.');

      setProcesando(false);
      navigation.navigate('EstadoReserva', {
        correlationId: resultado.correlationId,
        codigoReserva: resultado.codigoReserva,
        vehiculo, cliente, totales,
      });
    } catch (err) {
      setProcesando(false);
      setPaso('');
      Alert.alert('Error al procesar la reserva',
        err?.message || 'Ocurrió un error inesperado. Intenta de nuevo.',
        [{ text: 'OK' }]);
    }
  }

  return (
    <View style={styles.container}>

      {/* Header con botón volver */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.btnVolver}
          onPress={() => navigation.goBack()}
          disabled={procesando}
        >
          <Text style={styles.btnVolverText}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerTextos}>
          <Text style={styles.headerTitulo}>Confirmar reserva</Text>
          <Text style={styles.headerSub}>Revisa los detalles antes de confirmar</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Vehículo */}
        <Text style={styles.seccionLabel}>VEHÍCULO SELECCIONADO</Text>
        <View style={styles.card}>
          <Text style={styles.vehiculoModelo}>{vehiculo.modeloVehiculo}</Text>
          <Text style={styles.vehiculoSub}>
            {vehiculo.aniofabricacIon} · {vehiculo.tipoTransmision}
          </Text>
          <View style={styles.divider} />
          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <Text style={styles.specText}>{vehiculo.capacidadPasajeros} pas.</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specText}>{vehiculo.tipoCombustible}</Text>
            </View>
            {vehiculo.aireAcondicionado && (
              <View style={styles.specItem}>
                <Text style={styles.specText}>A/C</Text>
              </View>
            )}
          </View>
        </View>

        {/* Fechas */}
        <Text style={styles.seccionLabel}>FECHAS DE RENTA</Text>
        <View style={styles.card}>
          <InfoFila label="Sucursal recogida"
            valor={busqueda.nombreLocalizacionRecogida} />
          <InfoFila label="Recogida"
            valor={`${busqueda.fechaRecogida} a las ${busqueda.horaRecogida}`} />
          <InfoFila label="Sucursal devolución"
            valor={busqueda.nombreLocalizacionDevolucion ||
              busqueda.nombreLocalizacionRecogida} />
          <InfoFila label="Devolución"
            valor={`${busqueda.fechaDevolucion} a las ${busqueda.horaDevolucion}`} />
          <InfoFila label="Duración"
            valor={`${busqueda.dias} ${busqueda.dias === 1 ? 'día' : 'días'}`}
            ultimo />
        </View>

        {/* Conductores */}
        {conductores.length > 0 && (
          <>
            <Text style={styles.seccionLabel}>CONDUCTORES</Text>
            <View style={styles.card}>
              {conductores.map((c, i) => (
                <View key={i} style={[styles.conductorItem,
                  i < conductores.length - 1 && styles.conductorItemBorder]}>
                  <Text style={styles.conductorBadge}>
                    {i === 0 ? 'PRINCIPAL' : `ADICIONAL ${i}`}
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
          </>
        )}

        {/* Titular */}
        <Text style={styles.seccionLabel}>TITULAR DE LA RESERVA</Text>
        <View style={styles.card}>
          <InfoFila label="Nombre"
            valor={`${cliente.nombres} ${cliente.apellidos || ''}`} />
          <InfoFila label="Correo" valor={cliente.correo} />
          <InfoFila label="Teléfono" valor={cliente.telefono} />
          <InfoFila label="Identificación"
            valor={`${cliente.tipoIdentificacion}: ${cliente.numeroIdentificacion}`}
            ultimo />
        </View>

        {/* Extras */}
        {extras.length > 0 && (
          <>
            <Text style={styles.seccionLabel}>EXTRAS INCLUIDOS</Text>
            <View style={styles.card}>
              {extras.map((e, i) => (
                <View key={i} style={[styles.extraItem,
                  i < extras.length - 1 && styles.conductorItemBorder]}>
                  <Text style={styles.extraNombre}>Extra #{e.idExtra}</Text>
                  <Text style={styles.extraCantidad}>x{e.cantidad}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Resumen de pago */}
        <Text style={styles.seccionLabel}>RESUMEN DE PAGO</Text>
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

        {/* Términos */}
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
            Al confirmar se generará una reserva y factura a mi nombre.
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
              <ActivityIndicator size="small" color={BLANCO} />
              <Text style={styles.btnConfirmarText}>{paso}</Text>
            </View>
          ) : (
            <Text style={styles.btnConfirmarText}>Confirmar Reserva</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
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
  header: {
    backgroundColor: NEGRO_CARD,
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  btnVolver: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: NEGRO_INPUT,
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnVolverText: {
    color: BLANCO,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTextos: { flex: 1 },
  headerTitulo: {
    color: BLANCO,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSub: { color: GRIS_LABEL, fontSize: 12 },
  content: { padding: 16, paddingBottom: 48 },
  seccionLabel: {
    color: GRIS_LABEL,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 20,
  },
  card: {
    backgroundColor: NEGRO_CARD,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 10,
  },
  vehiculoModelo: {
    color: BLANCO,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehiculoSub: { color: GRIS, fontSize: 13, marginBottom: 10 },
  specsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specItem: {
    backgroundColor: NEGRO_INPUT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  specText: { color: GRIS_LABEL, fontSize: 12 },
  infoFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  conductorItem: { paddingVertical: 10 },
  conductorItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  conductorBadge: {
    color: ROJO_CLARO,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  conductorNombre: {
    color: BLANCO,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  conductorId: { color: GRIS, fontSize: 12 },
  extraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  extraNombre: { color: BLANCO, fontSize: 14 },
  extraCantidad: { color: ROJO_CLARO, fontSize: 14, fontWeight: '600' },
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
  terminosRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: NEGRO_CARD,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: ROJO,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: ROJO },
  checkmark: { color: BLANCO, fontSize: 13, fontWeight: 'bold' },
  terminosText: {
    flex: 1,
    fontSize: 13,
    color: GRIS_LABEL,
    lineHeight: 20,
  },
  btnConfirmar: {
    backgroundColor: ROJO,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnConfirmarDisabled: { backgroundColor: '#7D1E18' },
  btnConfirmarText: {
    color: BLANCO,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  procesandoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});