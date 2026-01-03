# Funcionalidades Faltantes en el Dashboard de Administrador de Club

## 🎯 Contexto Importante

**Este es el dashboard de ADMINISTRADOR DE CLUB, NO de super admin.**

**Diferencias clave:**
- **Super Admin:** Acceso total al sistema, gestiona todo globalmente (usuarios, clubs, administradores)
- **Admin de Club:** Solo gestiona SU club específico (turnos, canchas, reservas, configuración)

**El admin de club debe poder:**
- ✅ Gestionar las canchas de su club (crear, editar, eliminar, ver estado)
- ✅ Ver y gestionar turnos/reservas de su club (calendario, pendientes, historial)
- ✅ Configurar información de su club (datos, horarios, precios)
- ✅ Ver estadísticas de su club (ocupación, ingresos, jugadores frecuentes)
- ✅ Gestionar mantenimiento de canchas
- ✅ Ver partidos completados en su club

**El admin de club NO debe:**
- ❌ Gestionar otros clubs
- ❌ Gestionar usuarios del sistema (solo ver jugadores que reservan en su club)
- ❌ Crear o eliminar clubs (eso es para super admin)
- ❌ Enviar notificaciones globales (solo notificaciones relacionadas con su club)

---

## 📊 Estado Actual del Dashboard

**Funcionalidades Implementadas:**
- ✅ Estructura básica de rutas (Home, Turnos, Canchas, Configuración)
- ✅ Layout principal con navegación lateral
- ✅ Tema configurado (colores de la app móvil: verde #5BE12C, azul oscuro #0A2239)
- ✅ Componente `TurnosDelDiaSection` con mock data y funcionalidad de drag & drop
- ✅ React Query configurado
- ✅ Material-UI y Framer Motion integrados

**Funcionalidades NO Implementadas (Críticas):**
- ❌ Autenticación y autorización (no hay login, no hay validación de admin)
- ❌ Integración con API del backend (no hay servicios)
- ❌ Datos reales (todo es mock data)
- ❌ Gestión real de canchas
- ❌ Gestión real de turnos/reservas
- ❌ Configuración del club funcional
- ❌ Estadísticas del club
- ❌ Vista de calendario de reservas
- ❌ Gestión de mantenimiento

---

## 🚨 Funcionalidades Críticas Faltantes

### 1. **Autenticación y Autorización** ❌ NO IMPLEMENTADO
**Estado:** ❌ Falta completamente

**Funcionalidades necesarias:**
- ❌ Página de login para administradores de club
- ❌ Validación de credenciales con backend (`POST /auth/token`)
- ❌ Almacenamiento de token JWT (localStorage o cookies)
- ❌ Validación de que el usuario es admin (`is_admin = true`)
- ❌ Validación de que el admin tiene un club asignado (`club_id != null`)
- ❌ Protección de rutas (solo accesibles para admins con club)
- ❌ Interceptor de Axios para agregar token a requests
- ❌ Manejo de expiración de token y refresh
- ❌ Logout funcional
- ❌ Context/Provider para estado de autenticación

**Endpoints disponibles en backend:**
- `POST /auth/token` - Login (retorna token JWT) ✅
- `GET /auth/me` - Obtener usuario actual ✅

**Archivos a crear:**
- `src/services/auth.ts` - Servicio de autenticación
- `src/context/AuthContext.tsx` - Context para estado de autenticación
- `src/hooks/useAuth.tsx` - Hook para usar autenticación
- `src/pages/Login.tsx` - Página de login
- `src/components/common/ProtectedRoute.tsx` - Componente para proteger rutas
- `src/services/api.ts` - Configuración de Axios con interceptores

---

### 2. **Gestión de Canchas** ❌ NO IMPLEMENTADO
**Estado:** ❌ Solo tiene placeholders

**Funcionalidades necesarias:**
- ❌ Listar todas las canchas del club (filtrar por `club_id` del admin)
- ❌ Ver detalles de cada cancha:
  - Nombre, descripción
  - Tipo de superficie
  - Indoor/Outdoor
  - Iluminación
  - Estado (disponible/en mantenimiento)
  - Turnos asignados
- ❌ Crear nueva cancha:
  - Nombre (requerido)
  - Descripción (opcional)
  - Tipo de superficie (dropdown: arcilla, césped, sintética, etc.)
  - Indoor/Outdoor (switch)
  - Iluminación (switch)
  - Estado disponible (switch)
- ❌ Editar cancha existente
- ❌ Eliminar cancha (con confirmación)
- ❌ Marcar cancha como "en mantenimiento" (deshabilitar temporalmente)
- ❌ Ver estadísticas por cancha (turnos reservados, ocupación, ingresos)
- ❌ Vista de calendario de ocupación por cancha

**Endpoints disponibles en backend:**
- `GET /courts/` - Listar canchas (filtrar por `club_id` en frontend) ✅
- `GET /courts/{court_id}` - Obtener cancha ✅
- `POST /courts/` - Crear cancha (solo para su club) ✅
- `PUT /courts/{court_id}` - Actualizar cancha ✅
- `DELETE /courts/{court_id}` - Eliminar cancha ✅

**Archivos a crear:**
- `src/services/courts.ts` - Servicio para gestión de canchas
- `src/types/court.ts` - Tipos TypeScript para canchas
- Actualizar `src/pages/Canchas.tsx` con funcionalidad real

---

### 3. **Gestión de Turnos/Reservas** ⚠️ PARCIALMENTE IMPLEMENTADO
**Estado:** ⚠️ Tiene UI básica con mock data, falta integración con API

**Funcionalidades necesarias:**

#### 3.1. Vista de Turnos del Día (Home)
- ❌ Integrar con API real (`GET /pregame-turns/clubs/{club_id}/pregame-turns`)
- ❌ Filtrar por fecha (hoy por defecto)
- ❌ Mostrar turnos con estado real (PENDING, READY_TO_PLAY, CANCELLED, COMPLETED)
- ❌ Mostrar jugadores reales asignados a cada turno
- ❌ Permitir agregar/quitar jugadores manualmente (solo admin)
- ❌ Permitir cambiar posiciones de jugadores (drag & drop funcional con API)
- ❌ Permitir cancelar turnos completos
- ❌ Permitir limpiar turnos (quitar todos los jugadores)

#### 3.2. Calendario de Turnos
- ❌ Vista de calendario mensual con todos los turnos del club
- ❌ Filtrar por cancha
- ❌ Filtrar por estado (PENDING, READY_TO_PLAY, CANCELLED, COMPLETED)
- ❌ Filtrar por rango de fechas
- ❌ Ver detalles de turno al hacer click en una fecha
- ❌ Indicadores visuales de ocupación por día
- ❌ Navegación entre meses

#### 3.3. Turnos Pendientes
- ❌ Lista de turnos con estado PENDING (faltan jugadores)
- ❌ Mostrar cuántos jugadores faltan
- ❌ Permitir agregar jugadores manualmente
- ❌ Notificaciones de turnos que están cerca de la fecha

#### 3.4. Historial de Turnos
- ❌ Lista de turnos completados (COMPLETED)
- ❌ Lista de turnos cancelados (CANCELLED)
- ❌ Filtros por fecha, cancha, estado
- ❌ Búsqueda por nombre de jugador
- ❌ Exportar historial a CSV/Excel
- ❌ Ver detalles completos de cada turno histórico

**Endpoints disponibles en backend:**
- `GET /pregame-turns/clubs/{club_id}/pregame-turns` - Obtener pregame turns del club ✅
- `GET /pregame-turns/clubs/{club_id}/available-turns` - Obtener turnos disponibles ✅
- `PUT /pregame-turns/{pregame_turn_id}` - Actualizar turno (solo admin puede modificar jugadores) ⚠️ Verificar permisos
- `DELETE /pregame-turns/{pregame_turn_id}` - Cancelar turno ⚠️ Verificar permisos

**Archivos a crear:**
- `src/services/pregameTurns.ts` - Servicio para gestión de turnos
- `src/types/pregameTurn.ts` - Tipos TypeScript para turnos
- `src/pages/TurnosCalendar.tsx` - Vista de calendario
- `src/pages/TurnosPendientes.tsx` - Vista de turnos pendientes
- `src/pages/TurnosHistorial.tsx` - Vista de historial
- Actualizar `src/pages/Turnos.tsx` con funcionalidad real
- Actualizar `src/sections/TurnosDelDiaSection.tsx` para usar API real

---

### 4. **Configuración del Club** ❌ NO IMPLEMENTADO
**Estado:** ❌ Solo tiene tabs sin contenido

**Funcionalidades necesarias:**

#### 4.1. Información del Club
- ❌ Ver información actual del club:
  - Nombre, dirección, teléfono, email
  - Estado (activo/inactivo) - solo lectura
- ❌ Editar información del club:
  - Nombre
  - Dirección
  - Teléfono
  - Email
- ❌ Validación de formularios
- ❌ Guardar cambios con confirmación

#### 4.2. Horarios
- ❌ Ver horarios actuales:
  - Hora de apertura
  - Hora de cierre
  - Duración de turno (en minutos)
- ❌ Editar horarios:
  - Selector de hora de apertura (time picker)
  - Selector de hora de cierre (time picker)
  - Input numérico para duración de turno
- ❌ Validación (cierre > apertura)
- ❌ Guardar cambios
- ❌ Regenerar turnos después de cambiar horarios (opcional, con confirmación)

#### 4.3. Precios
- ❌ Ver precio actual por turno (mostrar en pesos, convertir desde centavos)
- ❌ Editar precio por turno:
  - Input numérico en pesos
  - Conversión automática a centavos para backend
  - Validación (precio > 0)
- ❌ Guardar cambios
- ❌ Ver historial de cambios de precio (opcional)

#### 4.4. Días Abiertos
- ❌ Ver días de la semana en que el club está abierto
- ❌ Editar días abiertos (checkboxes para cada día)
- ❌ Guardar cambios
- ❌ Regenerar turnos después de cambiar días (opcional)

**Endpoints disponibles en backend:**
- `GET /clubs/{club_id}` - Obtener información del club ✅
- `PUT /clubs/{club_id}` - Actualizar club ✅
- `POST /clubs/{club_id}/generate-turns` - Regenerar turnos ✅

**Archivos a crear:**
- `src/services/clubs.ts` - Servicio para gestión del club
- `src/types/club.ts` - Tipos TypeScript para club
- Actualizar `src/pages/Configuracion.tsx` con formularios funcionales

---

### 5. **Dashboard/Home con Estadísticas** ⚠️ PARCIALMENTE IMPLEMENTADO
**Estado:** ⚠️ Tiene sección de turnos del día, falta estadísticas

**Funcionalidades necesarias:**
- ❌ Estadísticas generales del club:
  - Total de canchas
  - Canchas disponibles vs en mantenimiento
  - Turnos del día (total, completos, pendientes, libres)
  - Ingresos del día/mes (calculado desde pregame_turns con precio)
  - Jugadores únicos del mes
- ❌ Gráficos:
  - Ocupación por día de la semana (últimas 4 semanas)
  - Ingresos por día/mes (gráfico de líneas)
  - Cancha más utilizada (gráfico de barras)
  - Turnos por estado (gráfico de pastel)
- ❌ Alertas importantes:
  - Canchas en mantenimiento
  - Turnos pendientes que están cerca de la fecha
  - Cambios de precio recientes
- ❌ Vista rápida de turnos del día (ya existe, pero necesita datos reales)

**Endpoints disponibles en backend:**
- `GET /pregame-turns/clubs/{club_id}/pregame-turns` - Para estadísticas de turnos ✅
- `GET /courts/` - Para estadísticas de canchas ✅
- `GET /matches/` - Para partidos completados (filtrar por `club_id`) ✅
- Posiblemente necesitar endpoints adicionales de estadísticas específicas para club

**Archivos a crear:**
- `src/services/statistics.ts` - Servicio para estadísticas del club
- `src/types/statistics.ts` - Tipos TypeScript para estadísticas
- Actualizar `src/pages/Home.tsx` con estadísticas reales

---

### 6. **Integración Real con API** ❌ NO IMPLEMENTADO
**Estado:** ❌ No hay servicios, no hay integración

**Servicios necesarios:**
- ❌ `src/services/api.ts` - Configuración de Axios con:
  - Base URL del backend
  - Interceptor para agregar token JWT
  - Interceptor para manejar errores 401 (logout)
  - Interceptor para manejar errores 403 (sin permisos)
- ❌ `src/services/auth.ts` - Autenticación
- ❌ `src/services/courts.ts` - Gestión de canchas
- ❌ `src/services/pregameTurns.ts` - Gestión de turnos/reservas
- ❌ `src/services/clubs.ts` - Gestión del club
- ❌ `src/services/statistics.ts` - Estadísticas
- ❌ `src/services/matches.ts` - Partidos completados (opcional)

**Configuración necesaria:**
- ❌ Variable de entorno para URL del backend
- ❌ Configuración de React Query con retry y error handling
- ❌ Manejo de estados de carga (loading)
- ❌ Manejo de errores (toast notifications)

---

### 7. **Gestión de Partidos Completados** ❌ NO IMPLEMENTADO
**Estado:** ❌ No existe

**Funcionalidades necesarias:**
- ❌ Ver lista de partidos completados en el club
- ❌ Filtrar por cancha
- ❌ Filtrar por rango de fechas
- ❌ Ver detalles de partido:
  - Jugadores participantes
  - Resultado
  - Fecha y hora
  - Cancha
- ❌ Búsqueda por nombre de jugador
- ❌ Exportar a CSV/Excel

**Endpoints disponibles en backend:**
- `GET /matches/` - Listar partidos (filtrar por `club_id` en frontend) ✅
- `GET /matches/{match_id}` - Detalles de partido ✅

**Archivos a crear:**
- `src/services/matches.ts` - Servicio para partidos
- `src/types/match.ts` - Tipos TypeScript para partidos
- `src/pages/Partidos.tsx` - Página de partidos (opcional, puede ir en Home o Turnos)

---

## 🎨 Mejoras Visuales y de UX

### 1. **Diseño y Estilo**
**Estado actual:** ✅ Tema configurado, pero falta consistencia

**Mejoras necesarias:**
- ⚠️ Asegurar que todos los componentes usen el tema consistente
- ⚠️ Mejorar espaciado y padding en todas las páginas
- ⚠️ Agregar estados de carga (skeletons) en lugar de solo spinners
- ⚠️ Mejorar feedback visual para acciones (toasts más informativos)
- ⚠️ Agregar animaciones de transición entre páginas
- ⚠️ Mejorar responsive design (mobile, tablet, desktop)
- ⚠️ Agregar iconografía consistente en toda la app

### 2. **Componentes Reutilizables**
**Estado actual:** ❌ No hay componentes reutilizables

**Componentes a crear:**
- ❌ `LoadingSpinner.tsx` - Spinner de carga reutilizable
- ❌ `ErrorAlert.tsx` - Alerta de error reutilizable
- ❌ `EmptyState.tsx` - Estado vacío (sin datos) reutilizable
- ❌ `ConfirmDialog.tsx` - Diálogo de confirmación reutilizable
- ❌ `DatePicker.tsx` - Selector de fecha reutilizable
- ❌ `TimePicker.tsx` - Selector de hora reutilizable
- ❌ `CourtCard.tsx` - Tarjeta de cancha reutilizable
- ❌ `TurnCard.tsx` - Tarjeta de turno reutilizable
- ❌ `StatCard.tsx` - Tarjeta de estadística reutilizable

### 3. **Navegación y Layout**
**Estado actual:** ✅ Layout básico implementado

**Mejoras necesarias:**
- ⚠️ Agregar breadcrumbs en páginas anidadas
- ⚠️ Mejorar indicador de página activa en menú
- ⚠️ Agregar notificaciones/badges en menú (ej: número de turnos pendientes)
- ⚠️ Agregar información del club en el header (nombre del club)
- ⚠️ Agregar botón de logout en el header
- ⚠️ Mejorar drawer móvil (mejor animación, overlay)

### 4. **Formularios**
**Estado actual:** ❌ No hay formularios funcionales

**Mejoras necesarias:**
- ❌ Validación de formularios con `react-hook-form` y `yup` (ya instalado)
- ❌ Mensajes de error claros y específicos
- ❌ Estados de carga en botones de submit
- ❌ Confirmación antes de guardar cambios importantes
- ❌ Feedback visual de campos requeridos
- ❌ Autocompletado donde sea apropiado

---

## 📋 Resumen de Prioridades

### 🔴 PRIORIDAD ALTA (Crítico para funcionamiento básico)
1. **Autenticación y Autorización** - Sin esto, el dashboard no puede funcionar
2. **Integración con API** - Servicios básicos y configuración de Axios
3. **Gestión de Canchas** - Funcionalidad core del dashboard
4. **Gestión de Turnos/Reservas** - Vista de turnos del día con datos reales
5. **Configuración del Club** - Editar información básica del club

### 🟡 PRIORIDAD MEDIA (Importante para uso completo)
6. **Dashboard con Estadísticas** - Vista de home con métricas útiles
7. **Calendario de Turnos** - Vista mensual de reservas
8. **Historial de Turnos** - Ver turnos pasados
9. **Gestión de Partidos** - Ver partidos completados

### 🟢 PRIORIDAD BAJA (Mejoras y optimizaciones)
10. **Mejoras Visuales** - Componentes reutilizables, mejor UX
11. **Exportación de datos** - CSV/Excel para turnos y estadísticas
12. **Notificaciones** - Alertas de turnos pendientes, mantenimientos
13. **Búsqueda avanzada** - Filtros complejos en todas las secciones

---

## 🛠️ Recomendaciones de Implementación

### ✅ Fase 1: Fundamentos (Crítico)
1. ✅ Crear servicio `api.ts` con configuración de Axios
2. ✅ Crear servicio `auth.ts` y context de autenticación
3. ✅ Crear página `Login.tsx` con formulario funcional
4. ✅ Implementar `ProtectedRoute` para proteger todas las rutas
5. ✅ Agregar interceptor de token en Axios
6. ✅ Agregar manejo de errores 401/403

### ✅ Fase 2: Gestión de Canchas
1. ✅ Crear servicio `courts.ts`
2. ✅ Crear tipos `court.ts`
3. ✅ Actualizar `Canchas.tsx` con:
   - Listado de canchas del club (filtrar por `club_id`)
   - Modal para crear cancha
   - Modal para editar cancha
   - Confirmación para eliminar cancha
   - Toggle para marcar en mantenimiento

### ✅ Fase 3: Gestión de Turnos (Básico)
1. ✅ Crear servicio `pregameTurns.ts`
2. ✅ Crear tipos `pregameTurn.ts`
3. ✅ Actualizar `TurnosDelDiaSection.tsx` para usar API real
4. ✅ Implementar funcionalidad de agregar/quitar jugadores
5. ✅ Implementar cancelación de turnos

### ✅ Fase 4: Configuración del Club
1. ✅ Crear servicio `clubs.ts`
2. ✅ Crear tipos `club.ts`
3. ✅ Actualizar `Configuracion.tsx` con formularios funcionales:
   - Tab Información: Editar datos básicos
   - Tab Horarios: Editar horarios y duración
   - Tab Precios: Editar precio por turno
   - Tab Días Abiertos: Seleccionar días de la semana

### ✅ Fase 5: Dashboard y Estadísticas
1. ✅ Crear servicio `statistics.ts`
2. ✅ Actualizar `Home.tsx` con estadísticas reales
3. ✅ Agregar gráficos con `recharts` (ya usado en super admin)
4. ✅ Agregar alertas importantes

### ✅ Fase 6: Funcionalidades Avanzadas
1. ✅ Crear página `TurnosCalendar.tsx` - Vista de calendario
2. ✅ Crear página `TurnosPendientes.tsx` - Lista de pendientes
3. ✅ Crear página `TurnosHistorial.tsx` - Historial completo
4. ✅ Agregar filtros y búsqueda avanzada
5. ✅ Agregar exportación a CSV/Excel

### ✅ Fase 7: Mejoras y Optimizaciones
1. ✅ Crear componentes reutilizables
2. ✅ Mejorar UX y diseño visual
3. ✅ Optimizar rendimiento (lazy loading, paginación)
4. ✅ Agregar tests (opcional)

---

## 📝 Notas Técnicas

### Endpoints del Backend para Admin de Club

**Autenticación:**
- `POST /auth/token` - Login
- `GET /auth/me` - Obtener usuario actual

**Canchas:**
- `GET /courts/` - Listar todas (filtrar por `club_id` en frontend)
- `GET /courts/{court_id}` - Obtener cancha
- `POST /courts/` - Crear cancha (solo para su club, validado en backend)
- `PUT /courts/{court_id}` - Actualizar cancha
- `DELETE /courts/{court_id}` - Eliminar cancha

**Turnos/Reservas:**
- `GET /pregame-turns/clubs/{club_id}/pregame-turns` - Obtener pregame turns del club
- `GET /pregame-turns/clubs/{club_id}/available-turns` - Obtener turnos disponibles
- `PUT /pregame-turns/{pregame_turn_id}` - Actualizar turno ⚠️ Verificar permisos de admin
- `DELETE /pregame-turns/{pregame_turn_id}` - Cancelar turno ⚠️ Verificar permisos de admin

**Club:**
- `GET /clubs/{club_id}` - Obtener información del club
- `PUT /clubs/{club_id}` - Actualizar club
- `POST /clubs/{club_id}/generate-turns` - Regenerar turnos

**Partidos:**
- `GET /matches/` - Listar partidos (filtrar por `club_id` en frontend)
- `GET /matches/{match_id}` - Detalles de partido

### Consideraciones Importantes

1. **Filtrado por Club:** El admin solo puede ver/modificar datos de su club (`current_user.club_id`). El backend valida esto, pero el frontend debe filtrar también para mejor UX.

2. **Permisos de Admin:** Algunos endpoints pueden requerir verificación adicional de permisos. Revisar documentación del backend.

3. **Conversión de Precios:** El backend almacena precios en centavos, el frontend debe mostrar en pesos y convertir al enviar.

4. **Fechas y Horas:** 
   - Fechas: Formato `YYYY-MM-DD`
   - Horas: Formato `HH:MM` (24 horas)

5. **Estados de Turnos:**
   - `AVAILABLE` - Disponible (no iniciado)
   - `PENDING` - Pendiente (iniciado, faltan jugadores)
   - `READY_TO_PLAY` - Listo para jugar (4 jugadores)
   - `CANCELLED` - Cancelado
   - `COMPLETED` - Completado (convertido a partido)

---

## 📈 Progreso Actual (Última actualización: 2026-01-02)

### ❌ Estado General
- **Progreso:** ~5% de funcionalidades críticas completadas
- **Última actualización:** 2026-01-02
- **Funcionalidades completadas:**
  - ✅ Estructura básica del proyecto
  - ✅ Tema y diseño visual básico
  - ✅ Layout con navegación
  - ✅ Componente de turnos del día (UI con mock data)

### ❌ Funcionalidades Pendientes
- ❌ Autenticación (0%)
- ❌ Integración con API (0%)
- ❌ Gestión de Canchas (0%)
- ❌ Gestión de Turnos (5% - solo UI)
- ❌ Configuración del Club (0%)
- ❌ Dashboard con Estadísticas (0%)
- ❌ Calendario de Turnos (0%)
- ❌ Historial de Turnos (0%)
- ❌ Gestión de Partidos (0%)

---

## 🎯 Próximos Pasos Recomendados

1. **Implementar autenticación completa** (Fase 1)
2. **Crear servicios básicos de API** (Fase 1)
3. **Implementar gestión de canchas** (Fase 2)
4. **Integrar turnos del día con API real** (Fase 3)
5. **Implementar configuración del club** (Fase 4)

---

## 📚 Referencias

- **Backend API:** Ver documentación en `paddio-backend/`
- **Super Admin Dashboard:** Ver implementación en `paddio-admin-dashboard/` para referencia de patrones
- **App Móvil:** Ver `paddio-frontend/` para entender flujos de usuario

---

**El dashboard de Admin de Club está en fase muy temprana y requiere implementación completa de todas las funcionalidades críticas para ser funcional.**
