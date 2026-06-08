// src/screens/ClienteScreen.jsx

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, Alert
} from 'react-native';
import client from '../api/gatewayClient';
import { BUSCAR_CLIENTE_POR_CORREO } from '../graphql/queries';

const FORM_VACIO = {
  tipoIdentificacion: 'CED',
  numeroIdentificacion: '',
  razonSocial: '',
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  direccion: '',
};

export default function ClienteScreen({ navigation, route }) {
  const { busqueda, vehiculo, extras, conductores, totales } = route.params;

  const [correoInput, setCorreoInput] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [clienteBloqueado, setClienteBloqueado] = useState(false);
  const [form, setForm] = useState({ ...FORM_VACIO });
  const [errores, setErrores] = useState({});

  async function buscarCliente() {
    if (!correoInput.trim() || !correoInput.includes('@')) {
      setErrores({ correo: 'Ingresa un correo válido' });
      return;
    }

    setBuscando(true);
    setErrores({});
    setBusquedaRealizada(false);
    setClienteBloqueado(false);
    setClienteEncontrado(false);

    try {
      const data = await client.request(
        BUSCAR_CLIENTE_POR_CORREO,
        { correo: correoInput.trim() }
      );

      const clienteData = data.buscarClientePorCorreo;

      if (clienteData) {
        if (clienteData.esEliminado || clienteData.estado !== 'ACT') {
          setClienteBloqueado(true);
          setErrores({
            correo: 'Este cliente no está disponible. Contacta a soporte.'
          });
          setBusquedaRealizada(false);
          return;
        }

        setClienteEncontrado(true);
        setForm({
          tipoIdentificacion: clienteData.tipoIdentificacion || 'CED',
          numeroIdentificacion: clienteData.numeroIdentificacion || '',
          razonSocial: clienteData.razonSocial || '',
          nombres: clienteData.nombres || '',
          apellidos: clienteData.apellidos || '',
          correo: clienteData.correo || '',
          telefono: clienteData.telefono || '',
          direccion: clienteData.direccion || '',
        });

        Alert.alert(
          '✓ Cliente encontrado',
          `Bienvenido, ${clienteData.nombres}. Tus datos han sido cargados.`,
          [{ text: 'OK' }]
        );
      } else {
        setClienteEncontrado(false);
        setForm({ ...FORM_VACIO, correo: correoInput.trim() });

        Alert.alert(
          'ℹ️ Correo no registrado',
          'Completa el formulario para registrarte automáticamente.',
          [{ text: 'OK' }]
        );
      }
    } catch {
      setClienteEncontrado(false);
      setForm({ ...FORM_VACIO, correo: correoInput.trim() });
    } finally {
      setBuscando(false);
      setBusquedaRealizada(true);
    }
  }

  function cambiar(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setErrores(prev => ({ ...prev, [campo]: '' }));
  }

  function resetearBusqueda() {
    setCorreoInput('');
    setClienteEncontrado(false);
    setClienteBloqueado(false);
    setBusquedaRealizada(false);
    setForm({ ...FORM_VACIO });
    setErrores({});
  }

  function validar() {
    const e = {};
    if (!form.numeroIdentificacion?.trim())
      e.numeroIdentificacion = 'Identificación requerida';
    if (!form.nombres?.trim())
      e.nombres = 'Nombres requeridos';
    if (!form.apellidos?.trim())
      e.apellidos = 'Apellidos requeridos';
    if (!form.correo?.trim())
      e.correo = 'Correo requerido';
    if (!form.telefono?.trim())
      e.telefono = 'Teléfono requerido';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  function continuar() {
    if (!busquedaRealizada) {
      Alert.alert('Atención',
        'Primero verifica tu correo electrónico.',
        [{ text: 'OK' }]);
      return;
    }
    if (!validar()) return;

    navigation.navigate('Confirmacion', {
      busqueda,
      vehiculo,
      extras,
      conductores,
      totales,
      cliente: form,
    });
  }

  return (
    <ScrollView style={styles.container}
      contentContainerStyle={styles.content}>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🧾 Datos del titular</Text>
        <Text style={styles.heroSub}>
          Esta persona será el cliente asociado a la reserva
          y a quien se emitirá la factura.
        </Text>
      </View>

      {/* Búsqueda por correo */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Verificar correo electrónico</Text>

        <View style={styles.busquedaRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="tucorreo@ejemplo.com"
            value={correoInput}
            onChangeText={v => {
              setCorreoInput(v);
              setErrores(prev => ({ ...prev, correo: '' }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!clienteEncontrado}
          />
          {clienteEncontrado ? (
            <TouchableOpacity
              style={styles.btnCambiar}
              onPress={resetearBusqueda}
            >
              <Text style={styles.btnCambiarText}>✏️ Cambiar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btnBuscar,
                buscando && styles.btnBuscarDisabled]}
              onPress={buscarCliente}
              disabled={buscando}
            >
              {buscando
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={styles.btnBuscarText}>🔍</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {errores.correo && (
          <Text style={styles.errorMsg}>{errores.correo}</Text>
        )}
        {busquedaRealizada && clienteEncontrado && (
          <Text style={styles.msgExito}>
            ✓ Cliente encontrado — datos cargados automáticamente
          </Text>
        )}
        {busquedaRealizada && !clienteEncontrado && !clienteBloqueado && (
          <Text style={styles.msgInfo}>
            ℹ️ Correo no registrado — completa el formulario para continuar
          </Text>
        )}
      </View>

      {/* Formulario cliente */}
      {busquedaRealizada && !clienteBloqueado && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {clienteEncontrado ? 'Confirma tus datos' : 'Completa tu información'}
          </Text>

          {/* Tipo identificación */}
          <Text style={styles.label}>Tipo de identificación</Text>
          {clienteEncontrado ? (
            <Text style={styles.valorMostrado}>
              {form.tipoIdentificacion === 'CED' ? 'Cédula' : 'RUC'}
            </Text>
          ) : (
            <View style={styles.tipoRow}>
              {['CED', 'RUC'].map(tipo => (
                <TouchableOpacity
                  key={tipo}
                  style={[styles.tipoBtn,
                    form.tipoIdentificacion === tipo && styles.tipoBtnActivo]}
                  onPress={() => cambiar('tipoIdentificacion', tipo)}
                >
                  <Text style={[styles.tipoBtnText,
                    form.tipoIdentificacion === tipo && styles.tipoBtnTextActivo]}>
                    {tipo === 'CED' ? 'Cédula' : 'RUC'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Número identificación */}
          <Text style={styles.label}>Número de identificación *</Text>
          {clienteEncontrado ? (
            <Text style={styles.valorMostrado}>
              {form.numeroIdentificacion}
            </Text>
          ) : (
            <>
              <TextInput
                style={[styles.input,
                  errores.numeroIdentificacion && styles.inputError]}
                placeholder="0102030405"
                value={form.numeroIdentificacion}
                onChangeText={v => cambiar('numeroIdentificacion', v)}
                keyboardType="numeric"
              />
              {errores.numeroIdentificacion && (
                <Text style={styles.errorMsg}>
                  {errores.numeroIdentificacion}
                </Text>
              )}
            </>
          )}

          {/* Nombres */}
          <Text style={styles.label}>Nombres *</Text>
          {clienteEncontrado ? (
            <Text style={styles.valorMostrado}>{form.nombres}</Text>
          ) : (
            <>
              <TextInput
                style={[styles.input, errores.nombres && styles.inputError]}
                placeholder="Juan Carlos"
                value={form.nombres}
                onChangeText={v => cambiar('nombres', v)}
              />
              {errores.nombres && (
                <Text style={styles.errorMsg}>{errores.nombres}</Text>
              )}
            </>
          )}

          {/* Apellidos */}
          <Text style={styles.label}>Apellidos *</Text>
          {clienteEncontrado ? (
            <Text style={styles.valorMostrado}>
              {form.apellidos || 'No especificado'}
            </Text>
          ) : (
            <>
              <TextInput
                style={[styles.input, errores.apellidos && styles.inputError]}
                placeholder="García Pérez"
                value={form.apellidos}
                onChangeText={v => cambiar('apellidos', v)}
              />
              {errores.apellidos && (
                <Text style={styles.errorMsg}>{errores.apellidos}</Text>
              )}
            </>
          )}

          {/* Correo — siempre solo lectura */}
          <Text style={styles.label}>Correo *</Text>
          <Text style={styles.valorMostrado}>{form.correo}</Text>

          {/* Teléfono */}
          <Text style={styles.label}>Teléfono *</Text>
          {clienteEncontrado ? (
            <Text style={styles.valorMostrado}>
              {form.telefono || 'No especificado'}
            </Text>
          ) : (
            <>
              <TextInput
                style={[styles.input, errores.telefono && styles.inputError]}
                placeholder="0991234567"
                value={form.telefono}
                onChangeText={v => cambiar('telefono', v)}
                keyboardType="phone-pad"
              />
              {errores.telefono && (
                <Text style={styles.errorMsg}>{errores.telefono}</Text>
              )}
            </>
          )}

          {/* Razón social — solo si tiene valor o formulario nuevo */}
          {(form.razonSocial || !clienteEncontrado) && (
            <>
              <Text style={styles.label}>
                Razón social / Empresa (opcional)
              </Text>
              {clienteEncontrado ? (
                <Text style={styles.valorMostrado}>
                  {form.razonSocial || 'No especificado'}
                </Text>
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder="Empresa S.A. (opcional)"
                  value={form.razonSocial}
                  onChangeText={v => cambiar('razonSocial', v)}
                />
              )}
            </>
          )}

          {/* Dirección — solo si tiene valor o formulario nuevo */}
          {(form.direccion || !clienteEncontrado) && (
            <>
              <Text style={styles.label}>Dirección</Text>
              {clienteEncontrado ? (
                <Text style={styles.valorMostrado}>
                  {form.direccion || 'No especificado'}
                </Text>
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder="Av. Ejemplo 123, Quito"
                  value={form.direccion}
                  onChangeText={v => cambiar('direccion', v)}
                />
              )}
            </>
          )}

          {clienteEncontrado && (
            <Text style={styles.notaEdicion}>
              ¿Tus datos no son correctos? Contacta a nuestro equipo de soporte.
            </Text>
          )}
        </View>
      )}

      {/* Resumen reserva */}
      <View style={styles.resumenCard}>
        <Text style={styles.resumenTitle}>Tu reserva</Text>
        <Text style={styles.resumenVehiculo}>{vehiculo.modeloVehiculo}</Text>
        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>Duración</Text>
          <Text style={styles.resumenValor}>{busqueda.dias} día(s)</Text>
        </View>
        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>Subtotal</Text>
          <Text style={styles.resumenValor}>
            ${totales.subtotal.toFixed(2)}
          </Text>
        </View>
        <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>IVA 15%</Text>
          <Text style={styles.resumenValor}>${totales.iva.toFixed(2)}</Text>
        </View>
        <View style={[styles.resumenRow, styles.resumenRowTotal]}>
          <Text style={styles.resumenTotalLabel}>Total</Text>
          <Text style={styles.resumenTotalValor}>
            ${totales.total.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Botones */}
      <TouchableOpacity style={styles.btnContinuar} onPress={continuar}>
        <Text style={styles.btnContinuarText}>
          Revisar y confirmar →
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
  hero: {
    backgroundColor: '#C0392B', borderRadius: 12,
    padding: 16, marginBottom: 16
  },
  heroTitle: {
    color: '#FFF', fontSize: 18,
    fontWeight: 'bold', marginBottom: 4
  },
  heroSub: { color: '#FFCDD2', fontSize: 13 },
  card: {
    backgroundColor: '#FFF', borderRadius: 12,
    padding: 16, marginBottom: 16, elevation: 1
  },
  sectionTitle: {
    fontSize: 15, fontWeight: 'bold',
    color: '#333', marginBottom: 12
  },
  busquedaRow: {
    flexDirection: 'row', gap: 10, alignItems: 'center'
  },
  btnBuscar: {
    backgroundColor: '#C0392B', borderRadius: 8,
    width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center'
  },
  btnBuscarDisabled: { backgroundColor: '#E0A0A0' },
  btnBuscarText: { fontSize: 18 },
  btnCambiar: {
    backgroundColor: '#F0F0F0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    justifyContent: 'center', alignItems: 'center'
  },
  btnCambiarText: { fontSize: 13, color: '#555', fontWeight: '600' },
  msgExito: {
    color: '#27AE60', fontSize: 12,
    marginTop: 8, fontStyle: 'italic'
  },
  msgInfo: {
    color: '#2980B9', fontSize: 12,
    marginTop: 8, fontStyle: 'italic'
  },
  label: {
    fontSize: 13, fontWeight: '600',
    color: '#333', marginBottom: 6, marginTop: 4
  },
  tipoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  tipoBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#DDD', alignItems: 'center'
  },
  tipoBtnActivo: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  tipoBtnText: { fontSize: 14, color: '#555' },
  tipoBtnTextActivo: { color: '#FFF', fontWeight: 'bold' },
  input: {
    backgroundColor: '#F9F9F9', borderRadius: 8,
    borderWidth: 1, borderColor: '#DDD',
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, marginBottom: 10
  },
  inputError: { borderColor: '#C0392B' },
  valorMostrado: {
    fontSize: 15, color: '#222',
    paddingVertical: 6, marginBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
  errorMsg: { color: '#C0392B', fontSize: 12, marginBottom: 8 },
  notaEdicion: {
    fontSize: 12, color: '#888',
    fontStyle: 'italic', marginTop: 8
  },
  resumenCard: {
    backgroundColor: '#FFF', borderRadius: 12,
    padding: 16, marginBottom: 16, elevation: 1
  },
  resumenTitle: {
    fontSize: 15, fontWeight: 'bold',
    color: '#333', marginBottom: 10
  },
  resumenVehiculo: {
    fontSize: 16, fontWeight: '600',
    color: '#C0392B', marginBottom: 10
  },
  resumenRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6
  },
  resumenLabel: { fontSize: 13, color: '#666' },
  resumenValor: { fontSize: 13, color: '#333', fontWeight: '500' },
  resumenRowTotal: {
    borderTopWidth: 1, borderTopColor: '#EEE',
    paddingTop: 10, marginTop: 4
  },
  resumenTotalLabel: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  resumenTotalValor: {
    fontSize: 17, fontWeight: 'bold', color: '#C0392B'
  },
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