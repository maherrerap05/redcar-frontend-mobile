// src/screens/ExtrasScreen.jsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Alert
} from 'react-native';
import client from '../api/gatewayClient';
import { GET_EXTRAS, BUSCAR_CONDUCTOR_POR_IDENTIFICACION } from '../graphql/queries';
import { IVA_PORCENTAJE } from '../constants/config';

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
  _bloqueado: false,
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
  const [errores, setErrores] = useState([]);

  useEffect(() => { cargarExtras(); }, []);

  async function cargarExtras() {
    try {
      const data = await client.request(GET_EXTRAS);
      setExtras(data.obtenerExtras || []);
    } catch { }
    finally { setCargando(false); }
  }

  // ── Búsqueda automática de conductor ─────────────────────────────────
  async function buscarConductor(index, numeroIdentificacion) {
    if (!numeroIdentificacion || numeroIdentificacion.length < 8) return;

    setBuscandoConductor(prev => ({ ...prev, [index]: true }));

    try {
      const data = await client.request(
        BUSCAR_CONDUCTOR_POR_IDENTIFICACION,
        { numeroIdentificacion }
      );

      const conductor = data.buscarConductorPorIdentificacion;

      if (conductor) {
        // Conductor encontrado y activo — autocompletar formulario.
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
            _bloqueado: false,
            _idConductor: conductor.idConductor,
          };
          return copia;
        });

        Alert.alert(
          '✓ Conductor encontrado',
          `${conductor.conNombre1} ${conductor.conApellido1} — datos cargados automáticamente.`,
          [{ text: 'OK' }]
        );
      } else {
        // No encontrado — habilitar formulario manual.
        setConductores(prev => {
          const copia = [...prev];
          copia[index] = {
            ...CONDUCTOR_VACIO,
            numeroIdentificacion,
            esPrincipal: index === 0,
            _encontrado: false,
            _bloqueado: false,
            _idConductor: null,
          };
          return copia;
        });

        Alert.alert(
          'ℹ️ Conductor no registrado',
          'Completa los datos manualmente para registrar al conductor.',
          [{ text: 'OK' }]
        );
      }
    } catch {
      Alert.alert(
        'Error',
        'No se pudo buscar el conductor. Completa los datos manualmente.',
        [{ text: 'OK' }]
      );
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
      if (copia[extra.idExtra]) {
        delete copia[extra.idExtra];
      } else {
        copia[extra.idExtra] = { ...extra, cantidad: 1 };
      }
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

    setErrores(errs);
    return errs.length === 0;
  }

  function continuar() {
    if (!validar()) {
      Alert.alert(
        'Errores de validación',
        errores.join('\n'),
        [{ text: 'OK' }]
      );
      return;
    }

    const totales = calcularTotales();

    const extrasPayload = Object.values(extrasSeleccionados).map(e => ({
      idExtra: e.idExtra,
      cantidad: e.cantidad,
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
      busqueda,
      vehiculo,
      extras: extrasPayload,
      conductores: conductoresPayload,
      totales,
    });
  }

  const totales = calcularTotales();

  return (
    <ScrollView style={styles.container}
      contentContainerStyle={styles.content}>

      {/* Resumen vehículo */}
      <View style={styles.resumenVehiculo}>
        <Text style={styles.resumenModelo}>{vehiculo.modeloVehiculo}</Text>
        <Text style={styles.resumenPrecio}>
          ${vehiculo.precioBaseDia.toFixed(2)}/día × {busqueda.dias} día(s) ={' '}
          ${(vehiculo.precioBaseDia * busqueda.dias).toFixed(2)}
        </Text>
      </View>

      {/* Conductores */}
      <Text style={styles.sectionTitle}>👤 Conductores autorizados</Text>

      {conductores.map((c, index) => (
        <View key={index} style={styles.conductorCard}>
          <View style={styles.conductorHeader}>
            <Text style={styles.conductorBadge}>
              {index === 0 ? '⭐ Principal' : `Conductor ${index + 1}`}
            </Text>
            {index > 0 && (
              <TouchableOpacity onPress={() => eliminarConductor(index)}>
                <Text style={styles.btnEliminar}>✕ Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Búsqueda por identificación */}
          <View style={styles.busquedaRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Número de identificación *"
              value={c.numeroIdentificacion}
              onChangeText={v => {
                actualizarConductor(index, 'numeroIdentificacion', v);
                // Resetear estado si cambia la identificación.
                actualizarConductor(index, '_encontrado', false);
                actualizarConductor(index, '_idConductor', null);
              }}
              keyboardType="numeric"
              editable={!c._encontrado}
            />
            <TouchableOpacity
              style={[styles.btnBuscar,
                buscandoConductor[index] && styles.btnBuscarDisabled]}
              onPress={() => buscarConductor(index, c.numeroIdentificacion)}
              disabled={buscandoConductor[index]}
            >
              {buscandoConductor[index]
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={styles.btnBuscarText}>🔍</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Indicador de estado */}
          {c._encontrado && (
            <Text style={styles.msgExito}>
              ✓ Conductor encontrado — datos cargados automáticamente
            </Text>
          )}

          {/* Formulario conductor */}
          <View style={[styles.row, { marginTop: 10 }]}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Primer nombre *"
              value={c.conNombre1}
              onChangeText={v => actualizarConductor(index, 'conNombre1', v)}
              editable={!c._encontrado}
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Segundo nombre"
              value={c.conNombre2}
              onChangeText={v => actualizarConductor(index, 'conNombre2', v)}
              editable={!c._encontrado}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Primer apellido *"
              value={c.conApellido1}
              onChangeText={v => actualizarConductor(index, 'conApellido1', v)}
              editable={!c._encontrado}
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Segundo apellido"
              value={c.conApellido2}
              onChangeText={v => actualizarConductor(index, 'conApellido2', v)}
              editable={!c._encontrado}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Edad *"
            value={String(c.edadConductor)}
            onChangeText={v => actualizarConductor(index, 'edadConductor', v)}
            keyboardType="numeric"
            editable={!c._encontrado}
          />
          <TextInput
            style={styles.input}
            placeholder="Vencimiento licencia (YYYY-MM-DD) *"
            value={c.fechaVencimientoLicencia}
            onChangeText={v =>
              actualizarConductor(index, 'fechaVencimientoLicencia', v)}
            editable={!c._encontrado}
          />
          <TextInput
            style={styles.input}
            placeholder="Teléfono *"
            value={c.conTelefono}
            onChangeText={v => actualizarConductor(index, 'conTelefono', v)}
            keyboardType="phone-pad"
            editable={!c._encontrado}
          />
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico *"
            value={c.conCorreo}
            onChangeText={v => actualizarConductor(index, 'conCorreo', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!c._encontrado}
          />
        </View>
      ))}

      <TouchableOpacity
        style={styles.btnAgregarConductor}
        onPress={agregarConductor}>
        <Text style={styles.btnAgregarConductorText}>
          + Agregar conductor adicional
        </Text>
      </TouchableOpacity>

      {/* Extras */}
      <Text style={styles.sectionTitle}>🎒 Extras opcionales</Text>

      {cargando ? (
        <ActivityIndicator color="#C0392B" />
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
                    onPress={() => cambiarCantidad(
                      extra.idExtra,
                      extrasSeleccionados[extra.idExtra].cantidad - 1)}
                    style={styles.cantBtn}>
                    <Text style={styles.cantBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.cantNum}>
                    {extrasSeleccionados[extra.idExtra].cantidad}
                  </Text>
                  <TouchableOpacity
                    onPress={() => cambiarCantidad(
                      extra.idExtra,
                      extrasSeleccionados[extra.idExtra].cantidad + 1)}
                    style={styles.cantBtn}>
                    <Text style={styles.cantBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}

      {/* Totales */}
      <View style={styles.totalesCard}>
        <Text style={styles.totalesTitle}>Resumen</Text>
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
        <View style={[styles.totalesRow, styles.totalesRowTotal]}>
          <Text style={styles.totalesTotalLabel}>Total</Text>
          <Text style={styles.totalesTotalValor}>
            ${totales.total.toFixed(2)}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.btnContinuar} onPress={continuar}>
        <Text style={styles.btnContinuarText}>
          Continuar con mis datos →
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnVolver}
        onPress={() => navigation.goBack()}>
        <Text style={styles.btnVolverText}>← Volver</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },
  resumenVehiculo: {
    backgroundColor: '#C0392B', borderRadius: 12,
    padding: 16, marginBottom: 20
  },
  resumenModelo: {
    color: '#FFF', fontSize: 18,
    fontWeight: 'bold', marginBottom: 4
  },
  resumenPrecio: { color: '#FFCDD2', fontSize: 13 },
  sectionTitle: {
    fontSize: 16, fontWeight: 'bold',
    color: '#333', marginBottom: 12, marginTop: 8
  },
  conductorCard: {
    backgroundColor: '#FFF', borderRadius: 12,
    padding: 14, marginBottom: 12, elevation: 1
  },
  conductorHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12
  },
  conductorBadge: { fontSize: 13, fontWeight: 'bold', color: '#C0392B' },
  btnEliminar: { fontSize: 13, color: '#E74C3C' },
  busquedaRow: {
    flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10
  },
  btnBuscar: {
    backgroundColor: '#C0392B', borderRadius: 8,
    width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center'
  },
  btnBuscarDisabled: { backgroundColor: '#E0A0A0' },
  btnBuscarText: { fontSize: 18 },
  msgExito: {
    color: '#27AE60', fontSize: 12,
    marginBottom: 8, fontStyle: 'italic'
  },
  input: {
    backgroundColor: '#F9F9F9', borderRadius: 8,
    borderWidth: 1, borderColor: '#DDD',
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, marginBottom: 10
  },
  row: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1 },
  btnAgregarConductor: {
    borderWidth: 1, borderColor: '#C0392B',
    borderRadius: 8, paddingVertical: 12,
    alignItems: 'center', marginBottom: 20,
    borderStyle: 'dashed'
  },
  btnAgregarConductorText: { color: '#C0392B', fontWeight: '600' },
  extraCard: {
    backgroundColor: '#FFF', borderRadius: 10,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#EEE'
  },
  extraCardActivo: { borderColor: '#C0392B', backgroundColor: '#FFF5F5' },
  extraRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  extraCheck: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: '#DDD',
    justifyContent: 'center', alignItems: 'center'
  },
  extraCheckActivo: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  extraCheckText: { color: '#FFF', fontWeight: 'bold' },
  extraNombre: { fontSize: 14, fontWeight: '600', color: '#333' },
  extraDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  extraPrecio: { fontSize: 15, fontWeight: 'bold', color: '#C0392B' },
  cantidadRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 10, gap: 16
  },
  cantBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#C0392B',
    justifyContent: 'center', alignItems: 'center'
  },
  cantBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  cantNum: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  totalesCard: {
    backgroundColor: '#FFF', borderRadius: 12,
    padding: 16, marginTop: 20, marginBottom: 16, elevation: 1
  },
  totalesTitle: {
    fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12
  },
  totalesRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8
  },
  totalesLabel: { fontSize: 14, color: '#666' },
  totalesValor: { fontSize: 14, color: '#333', fontWeight: '500' },
  totalesRowTotal: {
    borderTopWidth: 1, borderTopColor: '#EEE',
    paddingTop: 10, marginTop: 4
  },
  totalesTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  totalesTotalValor: { fontSize: 18, fontWeight: 'bold', color: '#C0392B' },
  btnContinuar: {
    backgroundColor: '#C0392B', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginBottom: 10
  },
  btnContinuarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  btnVolver: {
    borderWidth: 1, borderColor: '#C0392B',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center'
  },
  btnVolverText: { color: '#C0392B', fontSize: 14, fontWeight: '600' },
});