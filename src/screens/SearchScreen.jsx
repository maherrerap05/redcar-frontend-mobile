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

const NEGRO = '#1A1A1A';
const NEGRO_CARD = '#242424';
const NEGRO_INPUT = '#2E2E2E';
const ROJO = '#C0392B';
const ROJO_CLARO = '#E74C3C';
const GRIS = '#999999';
const GRIS_LABEL = '#AAAAAA';
const BLANCO = '#FFFFFF';

export default function SearchScreen({ navigation }) {
  const [localizaciones, setLocalizaciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [mostrarPickerRecogida, setMostrarPickerRecogida] = useState(false);
  const [mostrarPickerDevolucion, setMostrarPickerDevolucion] = useState(false);
  const [mostrarPickerHoraRecogida, setMostrarPickerHoraRecogida] = useState(false);
  const [mostrarPickerHoraDevolucion, setMostrarPickerHoraDevolucion] = useState(false);

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

  useEffect(() => { cargarDatos(); }, []);

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
    } catch {
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

  function formatearHora(horaStr) {
    const [h, m] = horaStr.split(':');
    const hora = parseInt(h);
    const ampm = hora >= 12 ? 'PM' : 'AM';
    const hora12 = hora % 12 === 0 ? 12 : hora % 12;
    return `${hora12}:${m} ${ampm}`;
  }

  function formatearFecha(fechaStr) {
    const [anio, mes, dia] = fechaStr.split('-');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun',
                   'Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${dia} ${meses[parseInt(mes) - 1]} ${anio}`;
  }

  function validar() {
    const e = {};
    if (!form.idLocalizacionRecogida)
      e.idLocalizacionRecogida = 'Selecciona una sucursal de recogida';
    if (!form.mismaLocalizacion && !form.idLocalizacionDevolucion)
      e.idLocalizacionDevolucion = 'Selecciona una sucursal de devolución';
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ROJO} />
        <Text style={styles.loadingText}>Cargando sucursales...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.btnRetry} onPress={cargarDatos}>
          <Text style={styles.btnRetryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dias = calcularDias();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.formCard}>

        {/* Título */}
        <Text style={styles.formTitle}>¿A dónde vamos?</Text>
        <View style={styles.formDivider} />

        {/* Localización recogida */}
        <Text style={styles.fieldLabel}>LOCALIZACIÓN DE RECOGIDA</Text>
        <View style={[styles.pickerWrapper,
          errores.idLocalizacionRecogida && styles.pickerWrapperError]}>
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
            dropdownIconColor="#999"
          >
            <Picker.Item
              label="Selecciona una sucursal..."
              value=""
              color="#999"
              style={{ backgroundColor: NEGRO_INPUT, color: '#999' }}
            />
            {localizaciones
              .filter(l => l.estadoLocalizacion === 'ACT')
              .map(l => (
                <Picker.Item
                  key={l.idLocalizacion}
                  label={l.nombreLocalizacion}
                  value={String(l.idLocalizacion)}
                  color={BLANCO}
                  style={{ backgroundColor: NEGRO_INPUT, color: BLANCO }}
                />
              ))}
          </Picker>
        </View>
        {errores.idLocalizacionRecogida && (
          <Text style={styles.errorMsg}>{errores.idLocalizacionRecogida}</Text>
        )}

        {/* Toggle misma localización */}
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
          <Text style={styles.checkLabel}>
            Devolver en la misma sucursal de recogida
          </Text>
        </TouchableOpacity>

        {/* Localización devolución */}
        {!form.mismaLocalizacion && (
          <>
            <Text style={styles.fieldLabel}>LOCALIZACIÓN DE DEVOLUCIÓN</Text>
            <View style={[styles.pickerWrapper,
              errores.idLocalizacionDevolucion && styles.pickerWrapperError]}>
              <Picker
                selectedValue={form.idLocalizacionDevolucion}
                onValueChange={val => {
                  setForm(prev => ({ ...prev, idLocalizacionDevolucion: val }));
                  setErrores(prev => ({ ...prev, idLocalizacionDevolucion: '' }));
                }}
                style={styles.picker}
                dropdownIconColor="#999"
              >
                <Picker.Item
                  label="Selecciona una sucursal..."
                  value=""
                  color="#999"
                  style={{ backgroundColor: NEGRO_INPUT, color: '#999' }}
                />
                {localizaciones
                  .filter(l => l.estadoLocalizacion === 'ACT')
                  .map(l => (
                    <Picker.Item
                      key={l.idLocalizacion}
                      label={l.nombreLocalizacion}
                      value={String(l.idLocalizacion)}
                      color={BLANCO}
                      style={{ backgroundColor: NEGRO_INPUT, color: BLANCO }}
                    />
                  ))}
              </Picker>
            </View>
            {errores.idLocalizacionDevolucion && (
              <Text style={styles.errorMsg}>{errores.idLocalizacionDevolucion}</Text>
            )}
          </>
        )}

        {/* Fechas y horas */}
        <View style={styles.fechasContainer}>

          {/* Columna Recogida */}
          <View style={styles.fechaCol}>
            <Text style={styles.fieldLabel}>FECHA DE RECOGIDA</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setMostrarPickerRecogida(true)}
            >
              <Text style={styles.dateBtnIcon}>▣</Text>
              <Text style={styles.dateBtnText}>
                {formatearFecha(form.fechaRecogida)}
              </Text>
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
                    const fechaStr = selectedDate.toISOString().split('T')[0];
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

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
              HORA DE RECOGIDA
            </Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setMostrarPickerHoraRecogida(true)}
            >
              <Text style={styles.dateBtnIcon}>◷</Text>
              <Text style={styles.dateBtnText}>
                {formatearHora(form.horaRecogida)}
              </Text>
            </TouchableOpacity>
            {mostrarPickerHoraRecogida && (
              <DateTimePicker
                value={(() => {
                  const [h, m] = form.horaRecogida.split(':');
                  const d = new Date();
                  d.setHours(parseInt(h), parseInt(m), 0);
                  return d;
                })()}
                mode="time"
                display="default"
                is24Hour={false}
                onChange={(event, selectedTime) => {
                  setMostrarPickerHoraRecogida(false);
                  if (selectedTime) {
                    const h = selectedTime.getHours().toString().padStart(2, '0');
                    const m = selectedTime.getMinutes().toString().padStart(2, '0');
                    setForm(prev => ({ ...prev, horaRecogida: `${h}:${m}` }));
                  }
                }}
              />
            )}
          </View>

          {/* Separador vertical */}
          <View style={styles.fechaSeparador} />

          {/* Columna Devolución */}
          <View style={styles.fechaCol}>
            <Text style={styles.fieldLabel}>FECHA DE DEVOLUCIÓN</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setMostrarPickerDevolucion(true)}
            >
              <Text style={styles.dateBtnIcon}>▣</Text>
              <Text style={styles.dateBtnText}>
                {formatearFecha(form.fechaDevolucion)}
              </Text>
            </TouchableOpacity>
            {mostrarPickerDevolucion && (
              <DateTimePicker
                value={new Date(form.fechaDevolucion + 'T12:00:00')}
                mode="date"
                display="default"
                minimumDate={new Date(
                  new Date(form.fechaRecogida + 'T12:00:00').getTime() + 86400000
                )}
                onChange={(event, selectedDate) => {
                  setMostrarPickerDevolucion(false);
                  if (selectedDate) {
                    const fechaStr = selectedDate.toISOString().split('T')[0];
                    setForm(prev => ({ ...prev, fechaDevolucion: fechaStr }));
                  }
                }}
              />
            )}

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
              HORA DE DEVOLUCIÓN
            </Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setMostrarPickerHoraDevolucion(true)}
            >
              <Text style={styles.dateBtnIcon}>◷</Text>
              <Text style={styles.dateBtnText}>
                {formatearHora(form.horaDevolucion)}
              </Text>
            </TouchableOpacity>
            {mostrarPickerHoraDevolucion && (
              <DateTimePicker
                value={(() => {
                  const [h, m] = form.horaDevolucion.split(':');
                  const d = new Date();
                  d.setHours(parseInt(h), parseInt(m), 0);
                  return d;
                })()}
                mode="time"
                display="default"
                is24Hour={false}
                onChange={(event, selectedTime) => {
                  setMostrarPickerHoraDevolucion(false);
                  if (selectedTime) {
                    const h = selectedTime.getHours().toString().padStart(2, '0');
                    const m = selectedTime.getMinutes().toString().padStart(2, '0');
                    setForm(prev => ({ ...prev, horaDevolucion: `${h}:${m}` }));
                  }
                }}
              />
            )}
          </View>
        </View>

        {errores.fechaDevolucion && (
          <Text style={styles.errorMsg}>{errores.fechaDevolucion}</Text>
        )}

        {/* Días calculados */}
        {dias > 0 && (
          <View style={styles.diasPill}>
            <Text style={styles.diasNum}>{dias}</Text>
            <Text style={styles.diasLabel}>
              {dias === 1 ? 'día de renta' : 'días de renta'}
            </Text>
          </View>
        )}

        {/* Categoría */}
        <Text style={styles.fieldLabel}>CATEGORÍA (OPCIONAL)</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={form.idCategoria}
            onValueChange={val => setForm(prev => ({ ...prev, idCategoria: val }))}
            style={styles.picker}
            dropdownIconColor="#999"
          >
            <Picker.Item
              label="Todas las categorías"
              value=""
              color="#999"
              style={{ backgroundColor: NEGRO_INPUT, color: '#999' }}
            />
            {categorias.map(c => (
              <Picker.Item
                key={c.idCategoriaVehiculo}
                label={c.nombreCategoriaVehiculo}
                value={String(c.idCategoriaVehiculo)}
                color={BLANCO}
                style={{ backgroundColor: NEGRO_INPUT, color: BLANCO }}
              />
            ))}
          </Picker>
        </View>

        {/* Botón buscar */}
        <TouchableOpacity style={styles.btnBuscar} onPress={buscar}>
          <Text style={styles.btnBuscarText}>
            Buscar vehículos disponibles →
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEGRO,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 32,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: NEGRO,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: GRIS,
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: ROJO,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  btnRetry: {
    backgroundColor: ROJO,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  btnRetryText: {
    color: BLANCO,
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: NEGRO_CARD,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  formTitle: {
    color: BLANCO,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  formDivider: {
    height: 1,
    backgroundColor: ROJO,
    marginBottom: 20,
  },
  fieldLabel: {
    color: GRIS_LABEL,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: NEGRO_INPUT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3D3D',
    marginBottom: 16,
    overflow: 'hidden',
  },
  pickerWrapperError: {
    borderColor: ROJO,
  },
  picker: {
    height: 50,
    color: BLANCO,
    backgroundColor: NEGRO_INPUT,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: ROJO,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: ROJO,
  },
  checkmark: {
    color: BLANCO,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkLabel: {
    color: GRIS_LABEL,
    fontSize: 13,
    flex: 1,
  },
  fechasContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  fechaCol: {
    flex: 1,
  },
  fechaSeparador: {
    width: 1,
    backgroundColor: '#333',
    marginHorizontal: 12,
  },
  dateBtn: {
    backgroundColor: NEGRO_INPUT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3D3D',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dateBtnIcon: {
    color: ROJO,
    fontSize: 16,
  },
  dateBtnText: {
    color: BLANCO,
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  diasPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ROJO,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 6,
    alignSelf: 'center',
  },
  diasNum: {
    color: BLANCO,
    fontSize: 20,
    fontWeight: 'bold',
  },
  diasLabel: {
    color: BLANCO,
    fontSize: 13,
  },
  errorMsg: {
    color: ROJO_CLARO,
    fontSize: 12,
    marginBottom: 10,
    marginTop: -8,
  },
  btnBuscar: {
    backgroundColor: ROJO,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  btnBuscarText: {
    color: BLANCO,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});