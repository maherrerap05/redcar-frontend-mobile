// src/screens/VehiculosScreen.jsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image
} from 'react-native';
import client from '../api/gatewayClient';
import { GET_VEHICULOS_DISPONIBLES, GET_CATEGORIAS } from '../graphql/queries';

export default function VehiculosScreen({ navigation, route }) {
  const busqueda = route.params;
  const [vehiculos, setVehiculos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroTransmision, setFiltroTransmision] = useState('');

  useEffect(() => {
    cargarVehiculos();
    cargarCategorias();
  }, []);

  async function cargarVehiculos() {
    setCargando(true);
    setError(null);
    try {
      const fechaHoraRecogida =
        `${busqueda.fechaRecogida}T${busqueda.horaRecogida}:00`;
      const fechaHoraDevolucion =
        `${busqueda.fechaDevolucion}T${busqueda.horaDevolucion}:00`;

      const data = await client.request(GET_VEHICULOS_DISPONIBLES, {
        idLocalizacionRecogida: busqueda.idLocalizacionRecogida,
        fechaHoraRecogida,
        fechaHoraDevolucion,
      });
      setVehiculos(data.obtenerVehiculosDisponibles || []);
    } catch (e) {
      setError('No se pudieron cargar los vehículos disponibles.');
    } finally {
      setCargando(false);
    }
  }

  async function cargarCategorias() {
    try {
      const data = await client.request(GET_CATEGORIAS);
      setCategorias(data.obtenerCategoriasVehiculo || []);
    } catch { }
  }

  function vehiculosFiltrados() {
    let lista = [...vehiculos];
    if (filtroCategoria)
      lista = lista.filter(v =>
        String(v.idCategoriaVehiculo) === filtroCategoria);
    if (filtroTransmision)
      lista = lista.filter(v =>
        v.tipoTransmision?.toUpperCase() === filtroTransmision.toUpperCase());
    return lista.sort((a, b) => a.precioBaseDia - b.precioBaseDia);
  }

  function seleccionar(vehiculo) {
    navigation.navigate('Extras', {
      busqueda,
      vehiculo,
    });
  }

  function nombreCategoria(idCat) {
    const cat = categorias.find(c => c.idCategoriaVehiculo === idCat);
    return cat?.nombreCategoriaVehiculo || `Cat. ${idCat}`;
  }

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C0392B" />
        <Text style={styles.loadingText}>Buscando vehículos disponibles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.btnRetry} onPress={cargarVehiculos}>
          <Text style={styles.btnRetryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const lista = vehiculosFiltrados();

  return (
    <View style={styles.container}>
      {/* Resumen búsqueda */}
      <View style={styles.resumen}>
        <Text style={styles.resumenText}>
          📍 {busqueda.nombreLocalizacionRecogida}
        </Text>
        <Text style={styles.resumenSub}>
          {busqueda.fechaRecogida} → {busqueda.fechaDevolucion} ·{' '}
          <Text style={styles.resumenDias}>{busqueda.dias} día(s)</Text>
        </Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filtroChip,
              filtroTransmision === '' && styles.filtroChipActivo]}
            onPress={() => setFiltroTransmision('')}
          >
            <Text style={[styles.filtroChipText,
              filtroTransmision === '' && styles.filtroChipTextActivo]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filtroChip,
              filtroTransmision === 'AUTOMATICA' && styles.filtroChipActivo]}
            onPress={() => setFiltroTransmision('AUTOMATICA')}
          >
            <Text style={[styles.filtroChipText,
              filtroTransmision === 'AUTOMATICA' && styles.filtroChipTextActivo]}>
              Automático
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filtroChip,
              filtroTransmision === 'MANUAL' && styles.filtroChipActivo]}
            onPress={() => setFiltroTransmision('MANUAL')}
          >
            <Text style={[styles.filtroChipText,
              filtroTransmision === 'MANUAL' && styles.filtroChipTextActivo]}>
              Manual
            </Text>
          </TouchableOpacity>
          {categorias.map(c => (
            <TouchableOpacity
              key={c.idCategoriaVehiculo}
              style={[styles.filtroChip,
                filtroCategoria === String(c.idCategoriaVehiculo) &&
                styles.filtroChipActivo]}
              onPress={() => setFiltroCategoria(
                filtroCategoria === String(c.idCategoriaVehiculo)
                  ? '' : String(c.idCategoriaVehiculo))}
            >
              <Text style={[styles.filtroChipText,
                filtroCategoria === String(c.idCategoriaVehiculo) &&
                styles.filtroChipTextActivo]}>
                {c.nombreCategoriaVehiculo}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista vehículos */}
      {lista.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No hay vehículos disponibles</Text>
          <Text style={styles.emptySub}>
            Prueba con otras fechas o ajusta los filtros.
          </Text>
          <TouchableOpacity
            style={styles.btnVolver}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.btnVolverText}>← Cambiar búsqueda</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          {lista.map(v => (
            <View key={v.idVehiculo} style={styles.card}>
              {/* Imagen */}
              {v.imagenReferencialUrl ? (
                <Image
                  source={{ uri: v.imagenReferencialUrl }}
                  style={styles.cardImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.cardImgPlaceholder}>
                  <Text style={styles.cardImgIcon}>🚗</Text>
                </View>
              )}

              <View style={styles.cardBody}>
                {/* Categoría y modelo */}
                <Text style={styles.cardCategoria}>
                  {nombreCategoria(v.idCategoriaVehiculo)}
                </Text>
                <Text style={styles.cardModelo}>{v.modeloVehiculo}</Text>
                <Text style={styles.cardAnio}>{v.aniofabricacIon}</Text>

                {/* Specs */}
                <View style={styles.specs}>
                  <Text style={styles.spec}>
                    👥 {v.capacidadPasajeros} pas.
                  </Text>
                  <Text style={styles.spec}>
                    🧳 {v.capacidadMaletas} mal.
                  </Text>
                  <Text style={styles.spec}>
                    ⚙️ {v.tipoTransmision === 'AUTOMATICA'
                      ? 'Auto' : 'Manual'}
                  </Text>
                  <Text style={styles.spec}>
                    ⛽ {v.tipoCombustible}
                  </Text>
                  {v.aireAcondicionado && (
                    <Text style={styles.spec}>❄️ A/C</Text>
                  )}
                </View>

                {/* Precio y botón */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.precio}>
                      ${v.precioBaseDia.toFixed(2)}
                    </Text>
                    <Text style={styles.precioDia}>/día</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.btnSeleccionar}
                    onPress={() => seleccionar(v)}
                  >
                    <Text style={styles.btnSeleccionarText}>
                      Seleccionar →
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
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
  resumen: {
    backgroundColor: '#FFF', padding: 12,
    borderBottomWidth: 1, borderBottomColor: '#EEE'
  },
  resumenText: { fontSize: 14, fontWeight: '600', color: '#333' },
  resumenSub: { fontSize: 12, color: '#666', marginTop: 2 },
  resumenDias: { color: '#C0392B', fontWeight: 'bold' },
  filtrosRow: {
    backgroundColor: '#FFF', paddingVertical: 10,
    paddingHorizontal: 12, borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  filtroChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#DDD',
    marginRight: 8, backgroundColor: '#FFF'
  },
  filtroChipActivo: {
    backgroundColor: '#C0392B', borderColor: '#C0392B'
  },
  filtroChipText: { fontSize: 12, color: '#555' },
  filtroChipTextActivo: { color: '#FFF' },
  lista: { padding: 12 },
  card: {
    backgroundColor: '#FFF', borderRadius: 12,
    marginBottom: 16, overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4
  },
  cardImg: { width: '100%', height: 160 },
  cardImgPlaceholder: {
    width: '100%', height: 120,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center'
  },
  cardImgIcon: { fontSize: 48 },
  cardBody: { padding: 14 },
  cardCategoria: { fontSize: 11, color: '#C0392B', fontWeight: '600' },
  cardModelo: { fontSize: 18, fontWeight: 'bold', color: '#222', marginTop: 2 },
  cardAnio: { fontSize: 13, color: '#888', marginBottom: 10 },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  spec: {
    fontSize: 12, color: '#555',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center'
  },
  precio: { fontSize: 22, fontWeight: 'bold', color: '#C0392B' },
  precioDia: { fontSize: 11, color: '#888' },
  btnSeleccionar: {
    backgroundColor: '#C0392B', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 10
  },
  btnSeleccionarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  btnVolver: {
    backgroundColor: '#C0392B', borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 10
  },
  btnVolverText: { color: '#FFF', fontWeight: 'bold' },
});