// src/screens/ExtrasScreen.jsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Alert
} from 'react-native';
import client from '../api/gatewayClient';
import { GET_EXTRAS, BUSCAR_CONDUCTOR_POR_IDENTIFICACION } from '../graphql/queries';
import { IVA_PORCENTAJE } from '../constants/config';

const NEGRO = '#1A1A1A';
const NEGRO_CARD = '#242424';
const NEGRO_INPUT = '#2E2E2E';
const ROJO = '#C0392B';
const ROJO_CLARO = '#E74C3C';
const GRIS = '#999999';
const GRIS_LABEL = '#AAAAAA';
const BLANCO = '#FFFFFF';

const CONDUCTOR_VACIO = {
  tipoIdentificacion: 'CED',
  numeroIdentificacion: '',
  conNombre1: '',
  conNombre2: '',
  conApellido1: '',
  conApellido2: '',
  fechaVencimientoLicencia: '',
  edadConductor: '',
  conTelefono: '',
  conCorreo: '',
  esPrincipal: false,
  _encontrado: false,
  _busquedaRealizada: false,
  _idConductor: null,
};

export default function ExtrasScreen({ navigation, route }) {
  const { busqueda, vehiculo } = route.params;

  const [extras, setExtras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [extrasSeleccionados, setExtrasSeleccionados] = useState({});
  const [conductores, setConductores] = useState([
    { ...CONDUCTOR_VACIO, esPrincipal: true }
  ]);
  const [buscandoConductor, setBuscandoConductor] = useState({});

  useEffect(() => { cargarExtras(); }, []);

  async function cargarExtras() {
    try {
      const data = await client.request(GET_EXTRAS);
      setExtras(data.obtenerExtras || []);
    } catch { }
    finally { setCargando(false); }
  }

  async function buscarConductor(index, numeroIdentificacion) {
    if (!numeroIdentificacion || numeroIdentificacion.length < 8) {
      Alert.alert('Atención', 'Ingresa un número de identificación válido.', [{ text: 'OK' }]);
      return;
    }
    setBuscandoConductor(prev => ({ ...prev, [index]: true }));
    try {
      const data = await client.request(
        BUSCAR_CONDUCTOR_POR_IDENTIFICACION,
        { numeroIdentificacion }
      );
      const conductor = data.buscarConductorPorIdentificacion;
      if (conductor) {
        setConductores(prev => {
          const copia = [...prev];
          copia[index] = {
            ...copia[index],
            tipoIdentificacion: conductor.tipoIdentificacion,
            numeroIdentificacion: conductor.numeroIdentificacion,
            conNombre1: conductor.conNombre1,
            conNombre2: conductor.conNombre2 || '',
            conApellido1: conductor.conApellido1,
            conApellido2: conductor.conApellido2 || '',
            fechaVencimientoLicencia: conductor.fechaVencimientoLicencia || '',
            edadConductor: conductor.edadConductor
              ? String(conductor.edadConductor) : '',
            conTelefono: conductor.conTelefono || '',
            conCorreo: conductor.conCorreo || '',
            _encontrado: true,
            _busquedaRealizada: true,
            _idConductor: conductor.idConductor,
          };
          return copia;
        });
        Alert.alert(
          'Conductor encontrado',
          `${conductor.conNombre1} ${conductor.conApellido1} — datos cargados.`,
          [{ text: 'OK' }]
        );
      } else {
        setConductores(prev => {
          const copia = [...prev];
          copia[index] = {
            ...CONDUCTOR_VACIO,
            numeroIdentificacion,
            esPrincipal: index === 0,
            _busquedaRealizada: true,
          };
          return copia;
        });
        Alert.alert(
          'Conductor no registrado',
          'Completa los datos manualmente para registrarlo.',
          [{ text: 'OK' }]
        );
      }
    } catch {
      Alert.alert('Error', 'No se pudo buscar el conductor.', [{ text: 'OK' }]);
    } finally {
      setBuscandoConductor(prev => ({ ...prev, [index]: false }));
    }
  }

  function actualizarConductor(index, campo, valor) {
    setConductores(prev => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  }

  function agregarConductor() {
    setConductores(prev => [...prev, { ...CONDUCTOR_VACIO }]);
  }

  function eliminarConductor(index) {
    setConductores(prev => prev.filter((_, i) => i !== index));
  }

  function toggleExtra(extra) {
    setExtrasSeleccionados(prev => {
      const copia = { ...prev };
      if (copia[extra.idExtra]) delete copia[extra.idExtra];
      else copia[extra.idExtra] = { ...extra, cantidad: 1 };
      return copia;
    });
  }

  function cambiarCantidad(idExtra, cantidad) {
    if (cantidad < 1) return;
    setExtrasSeleccionados(prev => ({
      ...prev,
      [idExtra]: { ...prev[idExtra], cantidad }
    }));
  }

  function calcularTotales() {
    const dias = busqueda.dias || 1;
    const subtotalVehiculo = vehiculo.precioBaseDia * dias;
    const subtotalExtras = Object.values(extrasSeleccionados).reduce(
      (acc, e) => acc + e.valorFijo * e.cantidad, 0);
    const subtotal = subtotalVehiculo + subtotalExtras;
    const iva = subtotal * IVA_PORCENTAJE;
    const total = subtotal + iva;
    return { subtotalVehiculo, subtotalExtras, subtotal, iva, total, dias };
  }

  function validar() {
    const errs = [];
    const hoy = new Date().toISOString().split('T')[0];
    conductores.forEach((c, i) => {
      const n = i + 1;
      if (!c._busquedaRealizada)
        errs.push(`Conductor ${n}: debes buscar el conductor por identificación`);
      if (!c.numeroIdentificacion?.trim())
        errs.push(`Conductor ${n}: identificación requerida`);
      if (!c.conNombre1?.trim())
        errs.push(`Conductor ${n}: primer nombre requerido`);
      if (!c.conApellido1?.trim())
        errs.push(`Conductor ${n}: primer apellido requerido`);
      if (!c.edadConductor || Number(c.edadConductor) < 18)
        errs.push(`Conductor ${n}: edad mínima 18 años`);
      if (!c.conTelefono?.trim())
        errs.push(`Conductor ${n}: teléfono requerido`);
      if (!c.conCorreo?.trim())
        errs.push(`Conductor ${n}: correo requerido`);
      if (!c.fechaVencimientoLicencia)
        errs.push(`Conductor ${n}: vencimiento de licencia requerido`);
      else if (c.fechaVencimientoLicencia < hoy)
        errs.push(`Conductor ${n}: licencia vencida`);
    });
    return errs;
  }

  function continuar() {
    const errs = validar();
    if (errs.length > 0) {
      Alert.alert('Errores de validación', errs.join('\n'), [{ text: 'OK' }]);
      return;
    }
    const totales = calcularTotales();
    const extrasPayload = Object.values(extrasSeleccionados).map(e => ({
      idExtra: e.idExtra, cantidad: e.cantidad,
    }));
    const conductoresPayload = conductores.map((c, i) => ({
      tipoIdentificacion: c.tipoIdentificacion,
      numeroIdentificacion: c.numeroIdentificacion,
      conNombre1: c.conNombre1,
      conNombre2: c.conNombre2 || '',
      conApellido1: c.conApellido1,
      conApellido2: c.conApellido2 || '',
      fechaVencimientoLicencia: c.fechaVencimientoLicencia,
      edadConductor: Number(c.edadConductor),
      conTelefono: c.conTelefono,
      conCorreo: c.conCorreo,
      esPrincipal: i === 0,
    }));
    navigation.navigate('Cliente', {
      busqueda, vehiculo,
      extras: extrasPayload,
      conductores: conductoresPayload,
      totales,
    });
  }

  const totales = calcularTotales();

  return (
    <View style={styles.container}>

      {/* Header con botón volver */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.btnVolver}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnVolverText}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerTextos}>
          <Text style={styles.headerModelo}>{vehiculo.modeloVehiculo}</Text>
          <Text style={styles.headerPrecio}>
            ${vehiculo.precioBaseDia.toFixed(2)}/día x {busqueda.dias} día(s)
            {' '}= ${(vehiculo.precioBaseDia * busqueda.dias).toFixed(2)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Conductores */}
        <Text style={styles.seccionLabel}>CONDUCTORES AUTORIZADOS</Text>

        {conductores.map((c, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.conductorHeader}>
              <Text style={styles.conductorBadge}>
                {index === 0 ? 'PRINCIPAL' : `ADICIONAL ${index}`}
              </Text>
              {index > 0 && (
                <TouchableOpacity onPress={() => eliminarConductor(index)}>
                  <Text style={styles.btnEliminar}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Búsqueda por identificación — siempre visible */}
            <View style={styles.busquedaRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Número de identificación *"
                placeholderTextColor={GRIS}
                value={c.numeroIdentificacion}
                onChangeText={v => {
                  actualizarConductor(index, 'numeroIdentificacion', v);
                  actualizarConductor(index, '_encontrado', false);
                  actualizarConductor(index, '_busquedaRealizada', false);
                }}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.btnBuscar,
                  buscandoConductor[index] && styles.btnBuscarDisabled]}
                onPress={() => buscarConductor(index, c.numeroIdentificacion)}
                disabled={buscandoConductor[index]}
              >
                {buscandoConductor[index]
                  ? <ActivityIndicator size="small" color={BLANCO} />
                  : <Text style={styles.btnBuscarText}>Buscar</Text>
                }
              </TouchableOpacity>
            </View>

            {/* Indicador de estado */}
            {c._busquedaRealizada && c._encontrado && (
              <Text style={styles.msgExito}>
                Conductor encontrado — datos cargados automáticamente
              </Text>
            )}
            {c._busquedaRealizada && !c._encontrado && (
              <Text style={styles.msgInfo}>
                Conductor no registrado — completa los datos manualmente
              </Text>
            )}

            {/* Formulario — solo visible después de buscar */}
            {c._busquedaRealizada && (
              <>
                <View style={[styles.row, { marginTop: 12 }]}>
                  <TextInput
                    style={[styles.input, styles.inputHalf,
                      c._encontrado && styles.inputBloqueado]}
                    placeholder="Primer nombre *"
                    placeholderTextColor={GRIS}
                    value={c.conNombre1}
                    onChangeText={v => actualizarConductor(index, 'conNombre1', v)}
                    editable={!c._encontrado}
                  />
                  <TextInput
                    style={[styles.input, styles.inputHalf,
                      c._encontrado && styles.inputBloqueado]}
                    placeholder="Segundo nombre"
                    placeholderTextColor={GRIS}
                    value={c.conNombre2}
                    onChangeText={v => actualizarConductor(index, 'conNombre2', v)}
                    editable={!c._encontrado}
                  />
                </View>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.inputHalf,
                      c._encontrado && styles.inputBloqueado]}
                    placeholder="Primer apellido *"
                    placeholderTextColor={GRIS}
                    value={c.conApellido1}
                    onChangeText={v => actualizarConductor(index, 'conApellido1', v)}
                    editable={!c._encontrado}
                  />
                  <TextInput
                    style={[styles.input, styles.inputHalf,
                      c._encontrado && styles.inputBloqueado]}
                    placeholder="Segundo apellido"
                    placeholderTextColor={GRIS}
                    value={c.conApellido2}
                    onChangeText={v => actualizarConductor(index, 'conApellido2', v)}
                    editable={!c._encontrado}
                  />
                </View>
                <TextInput
                  style={[styles.input, c._encontrado && styles.inputBloqueado]}
                  placeholder="Edad *"
                  placeholderTextColor={GRIS}
                  value={String(c.edadConductor)}
                  onChangeText={v => actualizarConductor(index, 'edadConductor', v)}
                  keyboardType="numeric"
                  editable={!c._encontrado}
                />
                <TextInput
                  style={[styles.input, c._encontrado && styles.inputBloqueado]}
                  placeholder="Vencimiento licencia (YYYY-MM-DD) *"
                  placeholderTextColor={GRIS}
                  value={c.fechaVencimientoLicencia}
                  onChangeText={v =>
                    actualizarConductor(index, 'fechaVencimientoLicencia', v)}
                  editable={!c._encontrado}
                />
                <TextInput
                  style={[styles.input, c._encontrado && styles.inputBloqueado]}
                  placeholder="Teléfono *"
                  placeholderTextColor={GRIS}
                  value={c.conTelefono}
                  onChangeText={v => actualizarConductor(index, 'conTelefono', v)}
                  keyboardType="phone-pad"
                  editable={!c._encontrado}
                />
                <TextInput
                  style={[styles.input, { marginBottom: 0 },
                    c._encontrado && styles.inputBloqueado]}
                  placeholder="Correo electrónico *"
                  placeholderTextColor={GRIS}
                  value={c.conCorreo}
                  onChangeText={v => actualizarConductor(index, 'conCorreo', v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!c._encontrado}
                />
              </>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={styles.btnAgregarConductor}
          onPress={agregarConductor}
        >
          <Text style={styles.btnAgregarConductorText}>
            + Agregar conductor adicional
          </Text>
        </TouchableOpacity>

        {/* Extras */}
        <Text style={styles.seccionLabel}>EXTRAS OPCIONALES</Text>

        {cargando ? (
          <ActivityIndicator color={ROJO} style={{ marginVertical: 20 }} />
        ) : (
          extras.map(extra => {
            const seleccionado = !!extrasSeleccionados[extra.idExtra];
            return (
              <TouchableOpacity
                key={extra.idExtra}
                style={[styles.extraCard,
                  seleccionado && styles.extraCardActivo]}
                onPress={() => toggleExtra(extra)}
              >
                <View style={styles.extraRow}>
                  <View style={[styles.extraCheck,
                    seleccionado && styles.extraCheckActivo]}>
                    <Text style={styles.extraCheckText}>
                      {seleccionado ? '✓' : '+'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.extraNombre}>{extra.nombreExtra}</Text>
                    <Text style={styles.extraDesc}>{extra.descripcionExtra}</Text>
                  </View>
                  <Text style={styles.extraPrecio}>
                    ${extra.valorFijo.toFixed(2)}
                  </Text>
                </View>
                {seleccionado && (
                  <View style={styles.cantidadRow}>
                    <TouchableOpacity
                      style={styles.cantBtn}
                      onPress={() => cambiarCantidad(
                        extra.idExtra,
                        extrasSeleccionados[extra.idExtra].cantidad - 1)}
                    >
                      <Text style={styles.cantBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.cantNum}>
                      {extrasSeleccionados[extra.idExtra].cantidad}
                    </Text>
                    <TouchableOpacity
                      style={styles.cantBtn}
                      onPress={() => cambiarCantidad(
                        extra.idExtra,
                        extrasSeleccionados[extra.idExtra].cantidad + 1)}
                    >
                      <Text style={styles.cantBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        {/* Resumen totales */}
        <View style={styles.totalesCard}>
          <Text style={styles.totalesTitle}>RESUMEN</Text>
          <View style={styles.totalesDivider} />
          <View style={styles.totalesRow}>
            <Text style={styles.totalesLabel}>Vehículo</Text>
            <Text style={styles.totalesValor}>
              ${totales.subtotalVehiculo.toFixed(2)}
            </Text>
          </View>
          {totales.subtotalExtras > 0 && (
            <View style={styles.totalesRow}>
              <Text style={styles.totalesLabel}>Extras</Text>
              <Text style={styles.totalesValor}>
                ${totales.subtotalExtras.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.totalesRow}>
            <Text style={styles.totalesLabel}>Subtotal</Text>
            <Text style={styles.totalesValor}>
              ${totales.subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalesRow}>
            <Text style={styles.totalesLabel}>IVA 15%</Text>
            <Text style={styles.totalesValor}>
              ${totales.iva.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalesDivider} />
          <View style={styles.totalesRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValor}>
              ${totales.total.toFixed(2)}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btnContinuar} onPress={continuar}>
          <Text style={styles.btnContinuarText}>
            Continuar con mis datos →
          </Text>
        </TouchableOpacity>

      </ScrollView>
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
  headerTextos: {
    flex: 1,
  },
  headerModelo: {
    color: BLANCO,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerPrecio: {
    color: GRIS_LABEL,
    fontSize: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  seccionLabel: {
    color: GRIS_LABEL,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 20,
  },
  card: {
    backgroundColor: NEGRO_CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  conductorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  conductorBadge: {
    color: ROJO_CLARO,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  btnEliminar: {
    color: ROJO_CLARO,
    fontSize: 13,
  },
  busquedaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnBuscar: {
    backgroundColor: ROJO,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnBuscarDisabled: {
    backgroundColor: '#7D1E18',
  },
  btnBuscarText: {
    color: BLANCO,
    fontSize: 13,
    fontWeight: '600',
  },
  msgExito: {
    color: '#4CAF50',
    fontSize: 12,
    marginBottom: 8,
  },
  msgInfo: {
    color: '#64B5F6',
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: NEGRO_INPUT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3D3D',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: BLANCO,
    marginBottom: 10,
  },
  inputBloqueado: {
    backgroundColor: '#222222',
    borderColor: '#2A2A2A',
    color: GRIS_LABEL,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
  },
  btnAgregarConductor: {
    borderWidth: 1,
    borderColor: ROJO,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderStyle: 'dashed',
  },
  btnAgregarConductorText: {
    color: ROJO_CLARO,
    fontWeight: '600',
    fontSize: 14,
  },
  extraCard: {
    backgroundColor: NEGRO_CARD,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  extraCardActivo: {
    borderColor: ROJO,
    backgroundColor: '#2D1A1A',
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  extraCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraCheckActivo: {
    backgroundColor: ROJO,
    borderColor: ROJO,
  },
  extraCheckText: {
    color: BLANCO,
    fontWeight: 'bold',
    fontSize: 14,
  },
  extraNombre: {
    color: BLANCO,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  extraDesc: {
    color: GRIS,
    fontSize: 12,
  },
  extraPrecio: {
    color: ROJO_CLARO,
    fontSize: 15,
    fontWeight: 'bold',
  },
  cantidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 20,
  },
  cantBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ROJO,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cantBtnText: {
    color: BLANCO,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cantNum: {
    color: BLANCO,
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  totalesCard: {
    backgroundColor: NEGRO_CARD,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  totalesTitle: {
    color: GRIS_LABEL,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 10,
  },
  totalesDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  totalesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalesLabel: {
    color: GRIS_LABEL,
    fontSize: 13,
  },
  totalesValor: {
    color: BLANCO,
    fontSize: 13,
    fontWeight: '500',
  },
  totalLabel: {
    color: BLANCO,
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValor: {
    color: ROJO_CLARO,
    fontSize: 18,
    fontWeight: 'bold',
  },
  btnContinuar: {
    backgroundColor: ROJO,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnContinuarText: {
    color: BLANCO,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});