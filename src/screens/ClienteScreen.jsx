// src/screens/ClienteScreen.jsx

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, Alert
} from 'react-native';
import client from '../api/gatewayClient';
import { BUSCAR_CLIENTE_POR_CORREO } from '../graphql/queries';

const NEGRO = '#1A1A1A';
const NEGRO_CARD = '#242424';
const NEGRO_INPUT = '#2E2E2E';
const ROJO = '#C0392B';
const ROJO_CLARO = '#E74C3C';
const GRIS = '#999999';
const GRIS_LABEL = '#AAAAAA';
const BLANCO = '#FFFFFF';

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
          setErrores({ correo: 'Este cliente no está disponible. Contacta a soporte.' });
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
        Alert.alert('Cliente encontrado',
          `Bienvenido, ${clienteData.nombres}.`, [{ text: 'OK' }]);
      } else {
        setClienteEncontrado(false);
        setForm({ ...FORM_VACIO, correo: correoInput.trim() });
        Alert.alert('Correo no registrado',
          'Completa el formulario para registrarte.',
          [{ text: 'OK' }]);
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
      busqueda, vehiculo, extras, conductores, totales, cliente: form,
    });
  }

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
          <Text style={styles.headerTitulo}>Datos del titular</Text>
          <Text style={styles.headerSub}>
            Titular asociado a la reserva y factura
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Búsqueda por correo */}
        <Text style={styles.seccionLabel}>VERIFICAR CORREO ELECTRÓNICO</Text>
        <View style={styles.card}>
          <View style={styles.busquedaRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="tucorreo@ejemplo.com"
              placeholderTextColor={GRIS}
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
                <Text style={styles.btnCambiarText}>Cambiar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.btnBuscar,
                  buscando && styles.btnBuscarDisabled]}
                onPress={buscarCliente}
                disabled={buscando}
              >
                {buscando
                  ? <ActivityIndicator size="small" color={BLANCO} />
                  : <Text style={styles.btnBuscarText}>Buscar</Text>
                }
              </TouchableOpacity>
            )}
          </View>
          {errores.correo && (
            <Text style={styles.errorMsg}>{errores.correo}</Text>
          )}
          {busquedaRealizada && clienteEncontrado && (
            <Text style={styles.msgExito}>
              Cliente encontrado — datos cargados automáticamente
            </Text>
          )}
          {busquedaRealizada && !clienteEncontrado && !clienteBloqueado && (
            <Text style={styles.msgInfo}>
              Correo no registrado — completa el formulario para continuar
            </Text>
          )}
        </View>

        {/* Formulario cliente */}
        {busquedaRealizada && !clienteBloqueado && (
          <>
            <Text style={styles.seccionLabel}>
              {clienteEncontrado ? 'CONFIRMA TUS DATOS' : 'COMPLETA TU INFORMACIÓN'}
            </Text>
            <View style={styles.card}>

              {/* Tipo identificación */}
              <Text style={styles.fieldLabel}>TIPO DE IDENTIFICACIÓN</Text>
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
              <Text style={styles.fieldLabel}>NÚMERO DE IDENTIFICACIÓN *</Text>
              {clienteEncontrado ? (
                <Text style={styles.valorMostrado}>{form.numeroIdentificacion}</Text>
              ) : (
                <>
                  <TextInput
                    style={[styles.input,
                      errores.numeroIdentificacion && styles.inputError]}
                    placeholder="0102030405"
                    placeholderTextColor={GRIS}
                    value={form.numeroIdentificacion}
                    onChangeText={v => cambiar('numeroIdentificacion', v)}
                    keyboardType="numeric"
                  />
                  {errores.numeroIdentificacion && (
                    <Text style={styles.errorMsg}>{errores.numeroIdentificacion}</Text>
                  )}
                </>
              )}

              {/* Nombres */}
              <Text style={styles.fieldLabel}>NOMBRES *</Text>
              {clienteEncontrado ? (
                <Text style={styles.valorMostrado}>{form.nombres}</Text>
              ) : (
                <>
                  <TextInput
                    style={[styles.input, errores.nombres && styles.inputError]}
                    placeholder="Juan Carlos"
                    placeholderTextColor={GRIS}
                    value={form.nombres}
                    onChangeText={v => cambiar('nombres', v)}
                  />
                  {errores.nombres && (
                    <Text style={styles.errorMsg}>{errores.nombres}</Text>
                  )}
                </>
              )}

              {/* Apellidos */}
              <Text style={styles.fieldLabel}>APELLIDOS *</Text>
              {clienteEncontrado ? (
                <Text style={styles.valorMostrado}>
                  {form.apellidos || 'No especificado'}
                </Text>
              ) : (
                <>
                  <TextInput
                    style={[styles.input, errores.apellidos && styles.inputError]}
                    placeholder="García Pérez"
                    placeholderTextColor={GRIS}
                    value={form.apellidos}
                    onChangeText={v => cambiar('apellidos', v)}
                  />
                  {errores.apellidos && (
                    <Text style={styles.errorMsg}>{errores.apellidos}</Text>
                  )}
                </>
              )}

              {/* Correo */}
              <Text style={styles.fieldLabel}>CORREO *</Text>
              <Text style={styles.valorMostrado}>{form.correo}</Text>

              {/* Teléfono */}
              <Text style={styles.fieldLabel}>TELÉFONO *</Text>
              {clienteEncontrado ? (
                <Text style={styles.valorMostrado}>
                  {form.telefono || 'No especificado'}
                </Text>
              ) : (
                <>
                  <TextInput
                    style={[styles.input, errores.telefono && styles.inputError]}
                    placeholder="0991234567"
                    placeholderTextColor={GRIS}
                    value={form.telefono}
                    onChangeText={v => cambiar('telefono', v)}
                    keyboardType="phone-pad"
                  />
                  {errores.telefono && (
                    <Text style={styles.errorMsg}>{errores.telefono}</Text>
                  )}
                </>
              )}

              {/* Razón social */}
              {(form.razonSocial || !clienteEncontrado) && (
                <>
                  <Text style={styles.fieldLabel}>
                    RAZÓN SOCIAL / EMPRESA (OPCIONAL)
                  </Text>
                  {clienteEncontrado ? (
                    <Text style={styles.valorMostrado}>
                      {form.razonSocial || 'No especificado'}
                    </Text>
                  ) : (
                    <TextInput
                      style={styles.input}
                      placeholder="Empresa S.A. (opcional)"
                      placeholderTextColor={GRIS}
                      value={form.razonSocial}
                      onChangeText={v => cambiar('razonSocial', v)}
                    />
                  )}
                </>
              )}

              {/* Dirección */}
              {(form.direccion || !clienteEncontrado) && (
                <>
                  <Text style={styles.fieldLabel}>DIRECCIÓN</Text>
                  {clienteEncontrado ? (
                    <Text style={styles.valorMostrado}>
                      {form.direccion || 'No especificado'}
                    </Text>
                  ) : (
                    <TextInput
                      style={[styles.input, { marginBottom: 0 }]}
                      placeholder="Av. Ejemplo 123, Quito"
                      placeholderTextColor={GRIS}
                      value={form.direccion}
                      onChangeText={v => cambiar('direccion', v)}
                    />
                  )}
                </>
              )}

              {clienteEncontrado && (
                <Text style={styles.notaEdicion}>
                  ¿Datos incorrectos? Contacta a soporte.
                </Text>
              )}
            </View>
          </>
        )}

        {/* Resumen reserva */}
        <Text style={styles.seccionLabel}>TU RESERVA</Text>
        <View style={styles.card}>
          <Text style={styles.resumenVehiculo}>{vehiculo.modeloVehiculo}</Text>
          <View style={styles.totalesDivider} />
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
          <View style={styles.totalesDivider} />
          <View style={styles.resumenRow}>
            <Text style={styles.resumenTotalLabel}>Total</Text>
            <Text style={styles.resumenTotalValor}>
              ${totales.total.toFixed(2)}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btnContinuar} onPress={continuar}>
          <Text style={styles.btnContinuarText}>Revisar y confirmar →</Text>
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
  headerTitulo: {
    color: BLANCO,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSub: {
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
    marginBottom: 10,
    marginTop: 20,
  },
  card: {
    backgroundColor: NEGRO_CARD,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 4,
  },
  busquedaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
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
  btnCambiar: {
    backgroundColor: NEGRO_INPUT,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  btnCambiarText: {
    color: GRIS_LABEL,
    fontSize: 13,
    fontWeight: '600',
  },
  msgExito: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 8,
  },
  msgInfo: {
    color: '#64B5F6',
    fontSize: 12,
    marginTop: 8,
  },
  errorMsg: {
    color: ROJO_CLARO,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  fieldLabel: {
    color: GRIS_LABEL,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
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
    marginBottom: 4,
  },
  inputError: {
    borderColor: ROJO,
  },
  valorMostrado: {
    color: BLANCO,
    fontSize: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 4,
  },
  tipoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  tipoBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3D3D',
    alignItems: 'center',
    backgroundColor: NEGRO_INPUT,
  },
  tipoBtnActivo: {
    backgroundColor: ROJO,
    borderColor: ROJO,
  },
  tipoBtnText: {
    fontSize: 14,
    color: GRIS_LABEL,
  },
  tipoBtnTextActivo: {
    color: BLANCO,
    fontWeight: 'bold',
  },
  notaEdicion: {
    fontSize: 12,
    color: GRIS,
    fontStyle: 'italic',
    marginTop: 12,
  },
  resumenVehiculo: {
    color: ROJO_CLARO,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  totalesDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resumenLabel: {
    color: GRIS_LABEL,
    fontSize: 13,
  },
  resumenValor: {
    color: BLANCO,
    fontSize: 13,
    fontWeight: '500',
  },
  resumenTotalLabel: {
    color: BLANCO,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resumenTotalValor: {
    color: ROJO_CLARO,
    fontSize: 18,
    fontWeight: 'bold',
  },
  btnContinuar: {
    backgroundColor: ROJO,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  btnContinuarText: {
    color: BLANCO,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});