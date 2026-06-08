// src/navigation/AppNavigator.jsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SearchScreen from '../screens/SearchScreen';
import VehiculosScreen from '../screens/VehiculosScreen';
import ExtrasScreen from '../screens/ExtrasScreen';
import ClienteScreen from '../screens/ClienteScreen';
import ConfirmacionScreen from '../screens/ConfirmacionScreen';
import EstadoReservaScreen from '../screens/EstadoReservaScreen';
import ExitoScreen from '../screens/ExitoScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Search"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#C0392B',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 16,
          },
          headerBackButtonMenuEnabled: false,
        }}
      >
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: 'RedCar — Buscar vehículo' }}
        />
        <Stack.Screen
          name="Vehiculos"
          component={VehiculosScreen}
          options={{ title: 'Vehículos disponibles' }}
        />
        <Stack.Screen
          name="Extras"
          component={ExtrasScreen}
          options={{ title: 'Extras y conductores' }}
        />
        <Stack.Screen
          name="Cliente"
          component={ClienteScreen}
          options={{ title: 'Datos del titular' }}
        />
        <Stack.Screen
          name="Confirmacion"
          component={ConfirmacionScreen}
          options={{ title: 'Confirmar reserva' }}
        />
        <Stack.Screen
          name="EstadoReserva"
          component={EstadoReservaScreen}
          options={{
            title: 'Procesando reserva',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="Exito"
          component={ExitoScreen}
          options={{
            title: '¡Reserva confirmada!',
            headerBackVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}