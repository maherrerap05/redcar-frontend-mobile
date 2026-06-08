// src/screens/SearchScreen.jsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../api/gatewayClient';
import { GET_LOCALIZACIONES, GET_CATEGORIAS } from '../graphql/queries';

export default function SearchScreen({ navigation }) {
  const [localizaciones, setLocalizaciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarPickerRecogida, setMostrarPickerRecogida] = useState(false);
  const [mostrarPickerDevolucion, setMostrarPickerDevolucion] = useState(false);

  const hoy = new Date().toISOString().split('T')[0];
  const manana = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    idLocalizacionRecogida: '',
    idLocalizacionDevolucion: '',
    mismaLocalizacion: true,
    fechaRecogida: hoy,
    horaRecogida: '09:00',
    fechaDevolucion: manana,
    horaDevolucion: '09:00',
    idCategoria: '',
  });

  const [errores, setErrores] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setError(null);
    try {
      const [dataLocs, dataCats] = await Promise.all([
        client.request(GET_LOCALIZACIONES),
        client.request(GET_CATEGORIAS),
      ]);
      setLocalizaciones(dataLocs.obtenerLocalizaciones || []);
      setCategorias(dataCats.obtenerCategoriasVehiculo || []);
    } catch (e) {
      setError('No se pudieron cargar las sucursales. Verifica tu conexión.');
    } finally {
      setCargando(false);
    }
  }

  function calcularDias() {
    if (!form.fechaRecogida || !form.fechaDevolucion) return 0;
    const inicio = new Date(form.fechaRecogida);
    const fin = new Date(form.fechaDevolucion);
    const diff = Math.ceil((fin - inicio) / 86400000);
    return diff > 0 ? diff : 0;
  }

  function validar() {
    const e = {};
    if (!form.idLocalizacionRecogida)
      e.idLocalizacionRecogida = 'Selecciona una sucursal de recogida';
    if (!form.mismaLocalizacion && !form.idLocalizacionDevolucion)
      e.idLocalizacionDevolucion = 'Selecciona una sucursal de devolución';
    if (!form.fechaRecogida)
      e.fechaRecogida = 'Selecciona fecha de recogida';
    if (!form.fechaDevolucion)
      e.fechaDevolucion = 'Selecciona fecha de devolución';
    if (form.fechaRecogida && form.fechaDevolucion &&
      form.fechaDevolucion <= form.fechaRecogida)
      e.fechaDevolucion = 'La devolución debe ser posterior a la recogida';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  function buscar() {
    if (!validar()) return;
    const locRecogida = localizaciones.find(
      l => String(l.idLocalizacion) === String(form.idLocalizacionRecogida));
    const locDevolucion = form.mismaLocalizacion
      ? locRecogida
      : localizaciones.find(
        l => String(l.idLocalizacion) === String(form.idLocalizacionDevolucion));

    navigation.navigate('Vehiculos', {
      idLocalizacionRecogida: Number(form.idLocalizacionRecogida),
      idLocalizacionDevolucion: form.mismaLocalizacion
        ? Number(form.idLocalizacionRecogida)
        : Number(form.idLocalizacionDevolucion),
      nombreLocalizacionRecogida: locRecogida?.nombreLocalizacion || '',
      nombreLocalizacionDevolucion: locDevolucion?.nombreLocalizacion || '',
      fechaRecogida: form.fechaRecogida,
      horaRecogida: form.horaRecogida,
      fechaDevolucion: form.fechaDevolucion,
      horaDevolucion: form.horaDevolucion,
      idCategoria: form.idCategoria || null,
      dias: calcularDias(),
    });
  }

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C0392B" />
        <Text style={styles.loadingText}>Cargando sucursales...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.btnRetry} onPress={cargarDatos}>
          <Text style={styles.btnRetryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dias = calcularDias();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🚗 Renta tu vehículo</Text>
        <Text style={styles.heroSub}>
          Encuentra el auto perfecto para tu próxima aventura
        </Text>
      </View>

      {/* Localización recogida */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>📍 Sucursal de recogida *</Text>
        <View style={[styles.pickerWrapper,
          errores.idLocalizacionRecogida && styles.pickerError]}>
          <Picker
            selectedValue={form.idLocalizacionRecogida}
            onValueChange={val => {
              setForm(prev => ({
                ...prev,
                idLocalizacionRecogida: val,
                idLocalizacionDevolucion: prev.mismaLocalizacion
                  ? val : prev.idLocalizacionDevolucion
              }));
              setErrores(prev => ({ ...prev, idLocalizacionRecogida: '' }));
            }}
            style={styles.picker}
          >
            <Picker.Item label="Selecciona una sucursal..." value="" />
            {localizaciones
              .filter(l => l.estadoLocalizacion === 'ACT')
              .map(l => (
                <Picker.Item
                  key={l.idLocalizacion}
                  label={l.nombreLocalizacion}
                  value={String(l.idLocalizacion)}
                />
              ))}
          </Picker>
        </View>
        {errores.idLocalizacionRecogida && (
          <Text style={styles.errorMsg}>{errores.idLocalizacionRecogida}</Text>
        )}
      </View>

      {/* Misma localización */}
      <TouchableOpacity
        style={styles.checkRow}
        onPress={() => setForm(prev => ({
          ...prev, mismaLocalizacion: !prev.mismaLocalizacion
        }))}
      >
        <View style={[styles.checkbox,
          form.mismaLocalizacion && styles.checkboxChecked]}>
          {form.mismaLocalizacion && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
        <Text style={styles.checkLabel}>Devolver en la misma sucursal</Text>
      </TouchableOpacity>

      {/* Localización devolución */}
      {!form.mismaLocalizacion && (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>🏁 Sucursal de devolución *</Text>
          <View style={[styles.pickerWrapper,
            errores.idLocalizacionDevolucion && styles.pickerError]}>
            <Picker
              selectedValue={form.idLocalizacionDevolucion}
              onValueChange={val => {
                setForm(prev => ({ ...prev, idLocalizacionDevolucion: val }));
                setErrores(prev => ({ ...prev, idLocalizacionDevolucion: '' }));
              }}
              style={styles.picker}
            >
              <Picker.Item label="Selecciona una sucursal..." value="" />
              {localizaciones
                .filter(l => l.estadoLocalizacion === 'ACT')
                .map(l => (
                  <Picker.Item
                    key={l.idLocalizacion}
                    label={l.nombreLocalizacion}
                    value={String(l.idLocalizacion)}
                  />
                ))}
            </Picker>
          </View>
          {errores.idLocalizacionDevolucion && (
            <Text style={styles.errorMsg}>{errores.idLocalizacionDevolucion}</Text>
          )}
        </View>
      )}

      {/* Fechas con DateTimePicker */}
      <View style={styles.fechasGrid}>

        {/* Fecha recogida */}
        <View style={[styles.fieldGroup, styles.halfWidth]}>
          <Text style={styles.label}>📅 Fecha recogida</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setMostrarPickerRecogida(true)}
          >
            <Text style={styles.inputText}>{form.fechaRecogida}</Text>
            <Text style={styles.inputIcon}>📆</Text>
          </TouchableOpacity>
          {mostrarPickerRecogida && (
            <DateTimePicker
              value={new Date(form.fechaRecogida + 'T12:00:00')}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setMostrarPickerRecogida(false);
                if (selectedDate) {
                  const fechaStr = selectedDate
                    .toISOString().split('T')[0];
                  setForm(prev => ({
                    ...prev,
                    fechaRecogida: fechaStr,
                    fechaDevolucion: fechaStr >= prev.fechaDevolucion
                      ? new Date(selectedDate.getTime() + 86400000)
                          .toISOString().split('T')[0]
                      : prev.fechaDevolucion
                  }));
                }
              }}
            />
          )}
          <Text style={styles.labelSmall}>Hora de recogida</Text>
          <View style={styles.horaRow}>
            {['08:00','09:00','10:00','12:00',
              '14:00','16:00','18:00'].map(h => (
              <TouchableOpacity
                key={h}
                style={[styles.horaBtn,
                  form.horaRecogida === h && styles.horaBtnActivo]}
                onPress={() => setForm(prev => ({
                  ...prev, horaRecogida: h
                }))}
              >
                <Text style={[styles.horaBtnText,
                  form.horaRecogida === h && styles.horaBtnTextActivo]}>
                  {h}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fecha devolución */}
        <View style={[styles.fieldGroup, styles.halfWidth]}>
          <Text style={styles.label}>📅 Fecha devolución</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setMostrarPickerDevolucion(true)}
          >
            <Text style={styles.inputText}>{form.fechaDevolucion}</Text>
            <Text style={styles.inputIcon}>📆</Text>
          </TouchableOpacity>
          {mostrarPickerDevolucion && (
            <DateTimePicker
              value={new Date(form.fechaDevolucion + 'T12:00:00')}
              mode="date"
              display="default"
              minimumDate={new Date(
                new Date(form.fechaRecogida + 'T12:00:00')
                  .getTime() + 86400000
              )}
              onChange={(event, selectedDate) => {
                setMostrarPickerDevolucion(false);
                if (selectedDate) {
                  const fechaStr = selectedDate
                    .toISOString().split('T')[0];
                  setForm(prev => ({
                    ...prev, fechaDevolucion: fechaStr
                  }));
                }
              }}
            />
          )}
          <Text style={styles.labelSmall}>Hora de devolución</Text>
          <View style={styles.horaRow}>
            {['08:00','09:00','10:00','12:00',
              '14:00','16:00','18:00'].map(h => (
              <TouchableOpacity
                key={h}
                style={[styles.horaBtn,
                  form.horaDevolucion === h && styles.horaBtnActivo]}
                onPress={() => setForm(prev => ({
                  ...prev, horaDevolucion: h
                }))}
              >
                <Text style={[styles.horaBtnText,
                  form.horaDevolucion === h && styles.horaBtnTextActivo]}>
                  {h}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Días calculados */}
      {dias > 0 && (
        <View style={styles.diasPill}>
          <Text style={styles.diasNum}>{dias}</Text>
          <Text style={styles.diasLabel}>
            {dias === 1 ? 'día de renta' : 'días de renta'}
          </Text>
        </View>
      )}

      {/* Categoría opcional */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Categoría (opcional)</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={form.idCategoria}
            onValueChange={val => setForm(prev => ({
              ...prev, idCategoria: val
            }))}
            style={styles.picker}
          >
            <Picker.Item label="Todas las categorías" value="" />
            {categorias.map(c => (
              <Picker.Item
                key={c.idCategoriaVehiculo}
                label={c.nombreCategoriaVehiculo}
                value={String(c.idCategoriaVehiculo)}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Botón buscar */}
      <TouchableOpacity style={styles.btnBuscar} onPress={buscar}>
        <Text style={styles.btnBuscarText}>
          Buscar vehículos disponibles →
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', padding: 20
  },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  errorText: {
    color: '#C0392B', fontSize: 14,
    textAlign: 'center', marginBottom: 16
  },
  btnRetry: {
    backgroundColor: '#C0392B', paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: 8
  },
  btnRetryText: { color: '#FFF', fontWeight: 'bold' },
  hero: {
    backgroundColor: '#C0392B', borderRadius: 12,
    padding: 20, marginBottom: 20, alignItems: 'center'
  },
  heroTitle: {
    color: '#FFF', fontSize: 22,
    fontWeight: 'bold', marginBottom: 6
  },
  heroSub: { color: '#FFCDD2', fontSize: 13, textAlign: 'center' },
  fieldGroup: { marginBottom: 16 },
  halfWidth: { flex: 1 },
  label: {
    fontSize: 13, fontWeight: '600',
    color: '#333', marginBottom: 6
  },
  labelSmall: { fontSize: 11, color: '#666', marginBottom: 4, marginTop: 8 },
  pickerWrapper: {
    backgroundColor: '#FFF', borderRadius: 8,
    borderWidth: 1, borderColor: '#DDD', overflow: 'hidden'
  },
  pickerError: { borderColor: '#C0392B' },
  picker: { height: 48 },
  checkRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 4,
    borderWidth: 2, borderColor: '#C0392B',
    marginRight: 10, justifyContent: 'center', alignItems: 'center'
  },
  checkboxChecked: { backgroundColor: '#C0392B' },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  checkLabel: { fontSize: 14, color: '#333' },
  fechasGrid: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  inputWrapper: {
    backgroundColor: '#FFF', borderRadius: 8,
    borderWidth: 1, borderColor: '#DDD',
    padding: 12, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center'
  },
  inputText: { fontSize: 14, color: '#333' },
  inputIcon: { fontSize: 16 },
  horaRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4
  },
  horaBtn: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: '#DDD',
    backgroundColor: '#FFF'
  },
  horaBtnActivo: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  horaBtnText: { fontSize: 11, color: '#555' },
  horaBtnTextActivo: { color: '#FFF' },
  diasPill: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', backgroundColor: '#FFEBEE',
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 20,
    marginBottom: 16, gap: 8
  },
  diasNum: { fontSize: 22, fontWeight: 'bold', color: '#C0392B' },
  diasLabel: { fontSize: 14, color: '#C0392B' },
  errorMsg: { color: '#C0392B', fontSize: 12, marginTop: 4 },
  btnBuscar: {
    backgroundColor: '#C0392B', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8
  },
  btnBuscarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});