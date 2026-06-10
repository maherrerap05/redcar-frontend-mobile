// src/screens/VehiculosScreen.jsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image
} from 'react-native';
import client from '../api/gatewayClient';
import { GET_VEHICULOS_DISPONIBLES, GET_CATEGORIAS } from '../graphql/queries';

const NEGRO = '#1A1A1A';
const NEGRO_CARD = '#242424';
const NEGRO_INPUT = '#2E2E2E';
const ROJO = '#C0392B';
const ROJO_CLARO = '#E74C3C';
const GRIS = '#999999';
const GRIS_LABEL = '#AAAAAA';
const BLANCO = '#FFFFFF';

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
    } catch {
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
    navigation.navigate('Extras', { busqueda, vehiculo });
  }

  function nombreCategoria(idCat) {
    const cat = categorias.find(c => c.idCategoriaVehiculo === idCat);
    return cat?.nombreCategoriaVehiculo || `Cat. ${idCat}`;
  }

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ROJO} />
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

      {/* Resumen búsqueda con botón volver integrado */}
      <View style={styles.resumen}>
        <TouchableOpacity
          style={styles.btnVolver}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnVolverText}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.resumenTextos}>
          <Text style={styles.resumenLocalizacion}>
            {busqueda.nombreLocalizacionRecogida}
          </Text>
          <Text style={styles.resumenFechas}>
            {busqueda.fechaRecogida} → {busqueda.fechaDevolucion}{' '}
            <Text style={styles.resumenDias}>· {busqueda.dias} día(s)</Text>
          </Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosContent}
        >
          <TouchableOpacity
            style={[styles.chip,
              filtroTransmision === '' && filtroCategoria === '' && styles.chipActivo]}
            onPress={() => { setFiltroTransmision(''); setFiltroCategoria(''); }}
          >
            <Text style={[styles.chipText,
              filtroTransmision === '' && filtroCategoria === '' && styles.chipTextActivo]}>
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip,
              filtroTransmision === 'AUTOMATICA' && styles.chipActivo]}
            onPress={() => setFiltroTransmision(
              filtroTransmision === 'AUTOMATICA' ? '' : 'AUTOMATICA')}
          >
            <Text style={[styles.chipText,
              filtroTransmision === 'AUTOMATICA' && styles.chipTextActivo]}>
              Automático
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip,
              filtroTransmision === 'MANUAL' && styles.chipActivo]}
            onPress={() => setFiltroTransmision(
              filtroTransmision === 'MANUAL' ? '' : 'MANUAL')}
          >
            <Text style={[styles.chipText,
              filtroTransmision === 'MANUAL' && styles.chipTextActivo]}>
              Manual
            </Text>
          </TouchableOpacity>

          {categorias.map(c => (
            <TouchableOpacity
              key={c.idCategoriaVehiculo}
              style={[styles.chip,
                filtroCategoria === String(c.idCategoriaVehiculo) && styles.chipActivo]}
              onPress={() => setFiltroCategoria(
                filtroCategoria === String(c.idCategoriaVehiculo)
                  ? '' : String(c.idCategoriaVehiculo))}
            >
              <Text style={[styles.chipText,
                filtroCategoria === String(c.idCategoriaVehiculo) && styles.chipTextActivo]}>
                {c.nombreCategoriaVehiculo}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista vehículos */}
      {lista.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Sin resultados</Text>
          <Text style={styles.emptySub}>
            No hay vehículos disponibles. Prueba con otras fechas o ajusta los filtros.
          </Text>
          <TouchableOpacity
            style={styles.btnRetry}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.btnRetryText}>Cambiar búsqueda</Text>
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
                  <Text style={styles.cardImgPlaceholderText}>
                    Sin imagen
                  </Text>
                </View>
              )}

              <View style={styles.cardBody}>
                {/* Categoría */}
                <Text style={styles.cardCategoria}>
                  {nombreCategoria(v.idCategoriaVehiculo).toUpperCase()}
                </Text>

                {/* Modelo y año */}
                <Text style={styles.cardModelo}>{v.modeloVehiculo}</Text>
                <Text style={styles.cardAnio}>{v.aniofabricacIon}</Text>

                {/* Separador */}
                <View style={styles.cardDivider} />

                {/* Specs */}
                <View style={styles.specs}>
                  <View style={styles.specItem}>
                    <Text style={styles.specText}>
                      {v.capacidadPasajeros} pas.
                    </Text>
                  </View>
                  <View style={styles.specItem}>
                    <Text style={styles.specText}>
                      {v.capacidadMaletas} mal.
                    </Text>
                  </View>
                  <View style={styles.specItem}>
                    <Text style={styles.specText}>
                      {v.tipoTransmision === 'AUTOMATICA' ? 'Auto' : 'Manual'}
                    </Text>
                  </View>
                  <View style={styles.specItem}>
                    <Text style={styles.specText}>{v.tipoCombustible}</Text>
                  </View>
                  {v.aireAcondicionado && (
                    <View style={styles.specItem}>
                      <Text style={styles.specText}>A/C</Text>
                    </View>
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
  container: {
    flex: 1,
    backgroundColor: NEGRO,
  },
  centered: {
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
    color: ROJO_CLARO,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  btnRetry: {
    backgroundColor: ROJO,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnRetryText: {
    color: BLANCO,
    fontWeight: 'bold',
    fontSize: 14,
  },

  // ── Resumen ───────────────────────────────────────────────────────
  resumen: {
    backgroundColor: NEGRO_CARD,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  resumenTextos: {
    flex: 1,
  },
  resumenLocalizacion: {
    color: BLANCO,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  resumenFechas: {
    color: GRIS_LABEL,
    fontSize: 12,
  },
  resumenDias: {
    color: ROJO_CLARO,
    fontWeight: 'bold',
  },
  // ── Filtros ───────────────────────────────────────────────────────
  filtrosWrapper: {
    backgroundColor: NEGRO_CARD,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filtrosContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: NEGRO_INPUT,
  },
  chipActivo: {
    backgroundColor: ROJO,
    borderColor: ROJO,
  },
  chipText: {
    fontSize: 12,
    color: GRIS_LABEL,
  },
  chipTextActivo: {
    color: BLANCO,
    fontWeight: '600',
  },

  // ── Lista ─────────────────────────────────────────────────────────
  lista: {
    padding: 16,
    gap: 16,
  },
  emptyTitle: {
    color: BLANCO,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySub: {
    color: GRIS,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },

  // ── Card vehículo ─────────────────────────────────────────────────
  card: {
    backgroundColor: NEGRO_CARD,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardImg: {
    width: '100%',
    height: 180,
    backgroundColor: NEGRO_INPUT,
  },
  cardImgPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: NEGRO_INPUT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImgPlaceholderText: {
    color: GRIS,
    fontSize: 13,
  },
  cardBody: {
    padding: 16,
  },
  cardCategoria: {
    color: ROJO_CLARO,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  cardModelo: {
    color: BLANCO,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardAnio: {
    color: GRIS,
    fontSize: 13,
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#333',
    marginBottom: 12,
  },
  specs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  specItem: {
    backgroundColor: NEGRO_INPUT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  specText: {
    color: GRIS_LABEL,
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precio: {
    color: ROJO_CLARO,
    fontSize: 24,
    fontWeight: 'bold',
  },
  precioDia: {
    color: GRIS,
    fontSize: 11,
  },
  btnSeleccionar: {
    backgroundColor: ROJO,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  btnSeleccionarText: {
    color: BLANCO,
    fontWeight: 'bold',
    fontSize: 14,
  },
});