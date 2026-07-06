import React, { useEffect, useState } from 'react';
import {
  Platform,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  const { user, handleLogout: authLogout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedModule, setSelectedModule] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      Alert.alert('Acceso denegado', 'No tienes permiso para acceder a esta sección');
      router.replace('/(tabs)');
    }
  }, [user, router]);

  const handleLogout = () => {
    const doLogout = async () => {
      await authLogout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        doLogout();
      }
      return;
    }

    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: doLogout, style: 'destructive' },
      ]
    );
  };

  // Módulos principales
  const mainModules = [
    { id: 'users', title: 'Gestionar Usuarios', description: 'Administra participantes, estado de seguridad y acceso', icon: 'account-group' },
    { id: 'support', title: 'Acceder al Centro de Soporte', description: 'Gestiona solicitudes de asistencia y tickets', icon: 'headset' },
    { id: 'monitoring', title: 'Acceder a Monitoreo de Paseos', description: 'Supervisión en tiempo real de paseos activos', icon: 'map-marker-path' },
    { id: 'metrics', title: 'Visualizar Métricas', description: 'Rendimiento de ganancias y métricas globales', icon: 'chart-line' },
  ];

  // Acciones administrativas principales
  const adminActions = [
    { id: 'respond', title: 'Responder asistencia', description: 'Atender solicitudes de soporte', icon: 'chat-processing' },
    { id: 'validate', title: 'Validar documentos', description: 'Revisar credenciales y documentos', icon: 'file-check' },
    { id: 'history', title: 'Consultar historial', description: 'Revisar historial de servicios', icon: 'history' },
    { id: 'code', title: 'Generar código de entrega', description: 'Código de verificación para entregas', icon: 'key' },
    { id: 'earnings', title: 'Ver ganancias globales', description: 'Métricas financieras del sistema', icon: 'cash-multiple' },
    { id: 'traffic', title: 'Ver tráfico reciente', description: 'Analizar actividad reciente', icon: 'chart-bar' },
  ];

  // Acciones de gestión de usuarios
  const userActions = [
    { id: 'inhibit', title: 'Inhabilitar perfil', description: 'Suspender temporalmente', icon: 'account-off', type: 'danger' },
    { id: 'enable', title: 'Habilitar perfil', description: 'Restaurar acceso', icon: 'account-check', type: 'success' },
    { id: 'view_report', title: 'Ver reporte recibido', description: 'Revisar reportes de usuarios', icon: 'alert-circle', type: 'info' },
    { id: 'ban', title: 'Banear usuario', description: 'Eliminación permanente', icon: 'account-remove', type: 'danger' },
    { id: 'audit_walkers', title: 'Auditar paseadores', description: 'Revisión detallada de perfiles de paseadores', icon: 'clipboard-search', type: 'info' },
    { id: 'audit_owners', title: 'Auditar dueños', description: 'Revisión detallada de perfiles de dueños', icon: 'clipboard-account', type: 'info' },
  ];

  // Acciones de auditoría específicas para paseadores
  const walkerAuditActions = [
    { id: 'approve', title: 'Aprobar paseador', description: 'Validar y aprobar solicitud', icon: 'check-circle', type: 'success' },
    { id: 'reject', title: 'Rechazar verificación', description: 'Denegar solicitud', icon: 'close-circle', type: 'danger' },
    { id: 'validate_docs', title: 'Validar documentos', description: 'Revisar credenciales y documentos', icon: 'file-check', type: 'info' },
    { id: 'view_reports', title: 'Ver reportes recibidos', description: 'Revisar reportes de incidentes', icon: 'alert-circle', type: 'info' },
    { id: 'performance', title: 'Evaluar rendimiento', description: 'Analizar métricas de rendimiento', icon: 'chart-bar', type: 'info' },
    { id: 'security', title: 'Activar protocolo seguro', description: 'Protocolo de seguridad de vida', icon: 'shield-lock', type: 'danger' },
  ];

  // Acciones de auditoría específicas para dueños
  const ownerAuditActions = [
    { id: 'profile', title: 'Auditar perfil', description: 'Revisión detallada del perfil', icon: 'account-details', type: 'info' },
    { id: 'pets', title: 'Validar mascotas', description: 'Revisar registros de mascotas', icon: 'paw', type: 'info' },
    { id: 'payments', title: 'Auditar pagos', description: 'Revisar historial de pagos', icon: 'cash', type: 'info' },
    { id: 'history', title: 'Ver historial de viajes', description: 'Consultar historial de servicios', icon: 'history', type: 'info' },
    { id: 'feedback', title: 'Revisar comentarios', description: 'Evaluar opiniones de usuarios', icon: 'comment-text', type: 'info' },
    { id: 'security', title: 'Verificar seguridad', description: 'Revisar medidas de seguridad', icon: 'shield-check', type: 'success' },
  ];

  // Panel especializado
  const specializedPanels = [
    { id: 'walkers', title: 'Paseadores', description: 'Gestionar y auditar paseadores', icon: 'walk' },
    { id: 'owners', title: 'Dueños', description: 'Auditar perfiles de dueños', icon: 'account' },
  ];

  // Datos de ejemplo para tablas
  const users = [
    { id: '1', name: 'Mateo Rodriguez', email: 'mateo.rod@walkwi.com', type: 'Proveedor', status: 'Activo' },
    { id: '2', name: 'Elena Vance', email: 'elena.v@example.com', type: 'Cliente', status: 'Inhibido' },
    { id: '3', name: 'Julian Brooks', email: 'j.brooks@webmail.com', type: 'Proveedor', status: 'Baneado' },
    { id: '4', name: 'Sophia Chen', email: 'sophia.c@services.com', type: 'Cliente', status: 'Activo' },
  ];

  const tickets = [
    { id: '#29482', user: 'Maria Garcia', issue: 'Problema con temporizador de paseo', status: 'En progreso' },
    { id: '#29483', user: 'David Chen', issue: 'Problema con el pago', status: 'Pendiente' },
    { id: '#29484', user: 'Laura Torres', issue: 'Error al cancelar reserva', status: 'Resuelto' },
  ];

  const activeWalks = [
    { id: 'W-8821', walker: 'Bruno', owner: 'Sarah M.', location: 'Centro, Central Park' },
    { id: 'W-8824', walker: 'Luna', owner: 'David K.', location: 'Distrito Norte, Residencial' },
    { id: 'W-8827', walker: 'Max', owner: 'Laura G.', location: 'Zona Este, Parque Central' },
  ];

  const metrics = [
    { title: 'Usuarios Totales', value: '12,842', change: '+12%', icon: 'account-group' },
    { title: 'Paseadores Activos', value: '1,420', change: '+8%', icon: 'walk' },
    { title: 'Ingresos Mensuales', value: '$142.8k', change: '+8.2%', icon: 'cash' },
    { title: 'Tasa de Cancelación', value: '1.4%', change: '-0.3%', icon: 'cancel' },
  ];

  // Datos de ejemplo para auditoría de paseadores
  const walkerAuditData = {
    name: 'Sarah Mitchell',
    status: 'Paseador Verificado',
    level: 'Experta en Cuidado de Mascotas Nivel 5',
    rating: 4.9,
    reviews: 124,
    completedWalks: 342,
    documents: [
      { name: 'Identificación', status: 'Verificado' },
      { name: 'Antecedentes Penales', status: 'Pendiente' },
      { name: 'Certificado Veterinario', status: 'Verificado' },
    ],
  };

  // Datos de ejemplo para auditoría de dueños
  const ownerAuditData = {
    name: 'Carlos Mendoza',
    status: 'Dueño Gold',
    memberSince: 'Octubre 2022',
    rating: 4.9,
    totalSpent: '$842.00',
    pets: [
      { name: 'Bruno', breed: 'Golden Retriever', age: '4 años', status: 'ACTIVO' },
      { name: 'Luna', breed: 'Siamés', age: '2 años', status: 'INACTIVO' },
    ],
    recentWalks: [
      { date: '14 Mayo, 2024', provider: 'Maria S.', amount: '€18.00' },
      { date: '10 Mayo, 2024', provider: 'Roberto G.', amount: '€12.00' },
      { date: '02 Mayo, 2024', provider: 'Elena V.', amount: '€45.00' },
    ],
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Activo': return '#00694C';
      case 'Inhibido': return '#F59E0B';
      case 'Baneado': return '#BA1A1A';
      default: return '#6D7A73';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'Activo': return '#D1FAE5';
      case 'Inhibido': return '#FEF3C7';
      case 'Baneado': return '#FFDAD6';
      default: return '#E4EAE4';
    }
  };

  const renderDashboard = () => {
    return (
      <>
        {/* Métricas rápidas */}
        <View style={styles.metricsGrid}>
          {metrics.map((item) => (
            <View key={item.title} style={styles.metricCard}>
              <View style={styles.metricIconContainer}>
                <Icon name={item.icon} size={20} color="#00694C" />
              </View>
              <Text style={styles.metricTitle}>{item.title}</Text>
              <Text style={styles.metricValue}>{item.value}</Text>
              <Text style={[
                styles.metricChange,
                item.change.startsWith('+') ? styles.metricChangePositive : styles.metricChangeNegative,
              ]}>{item.change}</Text>
            </View>
          ))}
        </View>

        {/* Módulos principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seleccionar Módulo</Text>
          {mainModules.map((module) => (
            <TouchableOpacity
              key={module.id}
              style={styles.moduleCard}
              onPress={() => {
                setSelectedModule(module.id);
                setActiveTab(module.id);
              }}
            >
              <View style={styles.moduleIconContainer}>
                <Icon name={module.icon} size={24} color="#00694C" />
              </View>
              <View style={styles.moduleContent}>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleDescription}>{module.description}</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#BCCAC1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Panel especializado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceder a Panel Especializado</Text>
          <View style={styles.specializedGrid}>
            {specializedPanels.map((panel) => (
              <TouchableOpacity 
                key={panel.id} 
                style={styles.specializedCard}
                onPress={() => setActiveTab(panel.id)}
              >
                <View style={styles.specializedIconContainer}>
                  <Icon name={panel.icon} size={32} color="#00694C" />
                </View>
                <Text style={styles.specializedTitle}>{panel.title}</Text>
                <Text style={styles.specializedDescription}>{panel.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Auditoría y verificación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones de Auditoría</Text>
          <View style={styles.auditGrid}>
            {userActions.filter(a => a.id === 'audit_walkers' || a.id === 'audit_owners').map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.auditCard,
                  action.type === 'success' && styles.auditCardSuccess,
                  action.type === 'danger' && styles.auditCardDanger,
                ]}
                onPress={() => {
                  const tab = action.id === 'audit_walkers' ? 'walkers' : 'owners';
                  setActiveTab(tab);
                }}
              >
                <View style={styles.auditContent}>
                  <Icon 
                    name={action.icon} 
                    size={20} 
                    color={action.type === 'danger' ? '#BA1A1A' : action.type === 'success' ? '#00694C' : '#3D4943'} 
                  />
                  <View style={styles.auditTextContent}>
                    <Text style={styles.auditTitle}>{action.title}</Text>
                    <Text style={styles.auditDescription}>{action.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </>
    );
  };

  const renderUsers = () => {
    const filteredUsers = users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <>
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Icon name="magnify" size={20} color="#6D7A73" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, email o ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#6D7A73"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter-variant" size={20} color="#3D4943" />
            <Text style={styles.filterText}>Filtros</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.flex2]}>Usuario</Text>
          <Text style={[styles.tableHeaderText, styles.flex1]}>Tipo</Text>
          <Text style={[styles.tableHeaderText, styles.flex1]}>Estado</Text>
        </View>

        {filteredUsers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <View style={styles.userBadges}>
              <Text style={[
                styles.userType,
                user.type === 'Proveedor' && styles.userTypeProvider,
              ]}>{user.type}</Text>
              <Text style={[
                styles.userStatus,
                { backgroundColor: getStatusBg(user.status), color: getStatusColor(user.status) }
              ]}>{user.status}</Text>
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity style={styles.userActionButton}>
                <Icon name="pause-circle" size={20} color="#7C5800" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.userActionButton, styles.userActionDanger]}>
                <Icon name="account-remove" size={20} color="#BA1A1A" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.userActionButton, styles.userActionInfo]}>
                <Icon name="dots-vertical" size={20} color="#3D4943" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.primaryButton}>
          <Icon name="account-plus" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Crear Cuenta Administrativa</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderSupport = () => {
    return (
      <>
        <View style={styles.supportStats}>
          <View style={styles.statCard}>
            <Icon name="ticket" size={28} color="#00694C" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="clock" size={28} color="#7C5800" />
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="check-circle" size={28} color="#00694C" />
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>Resueltas</Text>
          </View>
        </View>

        {tickets.map((ticket) => (
          <TouchableOpacity key={ticket.id} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <View style={styles.ticketUserInfo}>
                <Icon name="account" size={20} color="#3D4943" />
                <Text style={styles.ticketUser}>{ticket.user}</Text>
              </View>
              <Text style={[
                styles.ticketStatus,
                ticket.status === 'En progreso' && styles.ticketStatusActive,
                ticket.status === 'Pendiente' && styles.ticketStatusPending,
                ticket.status === 'Resuelto' && styles.ticketStatusResolved,
              ]}>{ticket.status}</Text>
            </View>
            <Text style={styles.ticketIssue}>{ticket.issue}</Text>
            <Text style={styles.ticketId}>{ticket.id}</Text>
            <View style={styles.ticketActions}>
              <TouchableOpacity style={styles.ticketActionButton}>
                <Icon name="chat" size={18} color="#3D4943" />
                <Text style={styles.ticketActionText}>Responder</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ticketActionButton, styles.ticketActionResolve]}>
                <Icon name="check" size={18} color="#FFFFFF" />
                <Text style={[styles.ticketActionText, styles.ticketActionTextResolve]}>Resolver</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.primaryButton}>
          <Icon name="ticket-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Ver Todos los Tickets</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderMonitoring = () => {
    return (
      <>
        <View style={styles.monitoringHeader}>
          <Text style={styles.monitoringTitle}>Paseos Activos: {activeWalks.length}</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        </View>

        {activeWalks.map((walk) => (
          <View key={walk.id} style={styles.walkCard}>
            <View style={styles.walkHeader}>
              <Text style={styles.walkId}>{walk.id}</Text>
              <Text style={styles.walkStatus}>En progreso</Text>
            </View>
            <View style={styles.walkInfo}>
              <View style={styles.walkParticipants}>
                <Icon name="walk" size={18} color="#00694C" />
                <Text style={styles.walkTitle}>{walk.walker}</Text>
                <Icon name="arrow-right" size={16} color="#6D7A73" />
                <Icon name="account" size={18} color="#00694C" />
                <Text style={styles.walkTitle}>{walk.owner}</Text>
              </View>
              <View style={styles.walkLocation}>
                <Icon name="map-marker" size={14} color="#6D7A73" />
                <Text style={styles.walkLocationText}>{walk.location}</Text>
              </View>
            </View>
            <View style={styles.walkActions}>
              <TouchableOpacity style={styles.walkActionButton}>
                <Icon name="cog" size={18} color="#3D4943" />
                <Text style={styles.walkActionText}>Gestionar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.walkActionButton, styles.walkActionCode]}>
                <Icon name="key" size={18} color="#00513A" />
                <Text style={[styles.walkActionText, styles.walkActionTextCode]}>Código</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.walkActionButton, styles.walkActionEmergency]}>
                <Icon name="shield" size={18} color="#BA1A1A" />
                <Text style={[styles.walkActionText, styles.walkActionTextEmergency]}>Emergencia</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.primaryButton}>
          <Icon name="map" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Ver Todos los Paseos</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderMetrics = () => {
    const chartData = [60, 80, 50, 90, 70, 85];

    return (
      <>
        <View style={styles.metricsGrid}>
          {metrics.map((item) => (
            <View key={item.title} style={styles.metricCard}>
              <View style={styles.metricIconContainer}>
                <Icon name={item.icon} size={20} color="#00694C" />
              </View>
              <Text style={styles.metricTitle}>{item.title}</Text>
              <Text style={styles.metricValue}>{item.value}</Text>
              <Text style={[
                styles.metricChange,
                item.change.startsWith('+') ? styles.metricChangePositive : styles.metricChangeNegative,
              ]}>{item.change}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rendimiento de Ganancias</Text>
          <View style={styles.earningsChart}>
            {chartData.map((height, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={[styles.chartFill, { height: `${height}%` }]} />
              </View>
            ))}
          </View>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>Semana 1</Text>
            <Text style={styles.chartLabel}>Semana 2</Text>
            <Text style={styles.chartLabel}>Semana 3</Text>
            <Text style={styles.chartLabel}>Semana 4</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton}>
          <Icon name="chart-line" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Ver Reporte Completo</Text>
        </TouchableOpacity>
      </>
    );
  };

  // Renderizado de auditoría de paseadores
  const renderWalkerAudit = () => {
    return (
      <>
        <View style={styles.auditHeader}>
          <Text style={styles.auditHeaderTitle}>Auditoría de Paseadores</Text>
          <Text style={styles.auditHeaderSubtitle}>Revisión detallada de perfiles y credenciales</Text>
        </View>

        {/* Perfil del paseador */}
        <View style={styles.auditProfile}>
          <View style={styles.auditAvatar}>
            <Icon name="walk" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.auditName}>{walkerAuditData.name}</Text>
          <Text style={styles.auditStatus}>{walkerAuditData.status}</Text>
          <Text style={styles.auditLevel}>{walkerAuditData.level}</Text>
          <View style={styles.auditRating}>
            <Icon name="star" size={18} color="#F59E0B" />
            <Text style={styles.auditRatingText}>{walkerAuditData.rating}</Text>
            <Text style={styles.auditReviews}>({walkerAuditData.reviews} reseñas)</Text>
          </View>
          <View style={styles.auditStats}>
            <View style={styles.auditStat}>
              <Text style={styles.auditStatValue}>{walkerAuditData.completedWalks}</Text>
              <Text style={styles.auditStatLabel}>Paseos Completados</Text>
            </View>
          </View>
        </View>

        {/* Documentos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          {walkerAuditData.documents.map((doc, index) => (
            <View key={index} style={styles.documentCard}>
              <View style={styles.documentInfo}>
                <Icon name="file-document" size={20} color="#00694C" />
                <Text style={styles.documentName}>{doc.name}</Text>
              </View>
              <Text style={[
                styles.documentStatus,
                doc.status === 'Verificado' ? styles.documentStatusVerified : styles.documentStatusPending,
              ]}>{doc.status}</Text>
            </View>
          ))}
        </View>

        {/* Acciones de auditoría para paseadores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones de Auditoría</Text>
          {walkerAuditActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.auditActionCard,
                action.type === 'success' && styles.auditActionCardSuccess,
                action.type === 'danger' && styles.auditActionCardDanger,
              ]}
            >
              <View style={styles.auditActionContent}>
                <Icon 
                  name={action.icon} 
                  size={24} 
                  color={action.type === 'danger' ? '#BA1A1A' : action.type === 'success' ? '#00694C' : '#3D4943'} 
                />
                <View style={styles.auditActionTextContent}>
                  <Text style={styles.auditActionTitle}>{action.title}</Text>
                  <Text style={styles.auditActionDescription}>{action.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton}>
          <Icon name="content-save" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Guardar Revisión</Text>
        </TouchableOpacity>
      </>
    );
  };

  // Renderizado de auditoría de dueños
  const renderOwnerAudit = () => {
    return (
      <>
        <View style={styles.auditHeader}>
          <Text style={styles.auditHeaderTitle}>Auditoría de Dueños</Text>
          <Text style={styles.auditHeaderSubtitle}>Revisión detallada de perfiles de dueños</Text>
        </View>

        {/* Perfil del dueño */}
        <View style={styles.auditProfile}>
          <View style={styles.auditAvatar}>
            <Icon name="account" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.auditName}>{ownerAuditData.name}</Text>
          <Text style={styles.auditStatus}>{ownerAuditData.status}</Text>
          <Text style={styles.auditMeta}>Miembro desde: {ownerAuditData.memberSince}</Text>
          <View style={styles.auditRating}>
            <Icon name="star" size={18} color="#F59E0B" />
            <Text style={styles.auditRatingText}>{ownerAuditData.rating}</Text>
          </View>
          <View style={styles.auditStats}>
            <View style={styles.auditStat}>
              <Text style={styles.auditStatValue}>{ownerAuditData.totalSpent}</Text>
              <Text style={styles.auditStatLabel}>Gasto Total</Text>
            </View>
          </View>
        </View>

        {/* Mascotas registradas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mascotas Registradas</Text>
          {ownerAuditData.pets.map((pet, index) => (
            <View key={index} style={styles.petCard}>
              <View style={styles.petHeader}>
                <View style={styles.petInfo}>
                  <Icon name="paw" size={20} color="#00694C" />
                  <Text style={styles.petName}>{pet.name}</Text>
                </View>
                <Text style={[
                  styles.petStatus,
                  pet.status === 'ACTIVO' ? styles.petStatusActive : styles.petStatusInactive,
                ]}>{pet.status}</Text>
              </View>
              <Text style={styles.petBreed}>{pet.breed} • {pet.age}</Text>
            </View>
          ))}
        </View>

        {/* Historial de viajes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Viajes</Text>
          {ownerAuditData.recentWalks.map((walk, index) => (
            <View key={index} style={styles.walkHistoryCard}>
              <View style={styles.walkHistoryHeader}>
                <Text style={styles.walkHistoryDate}>{walk.date}</Text>
                <Text style={styles.walkHistoryAmount}>{walk.amount}</Text>
              </View>
              <Text style={styles.walkHistoryProvider}>Con {walk.provider}</Text>
            </View>
          ))}
        </View>

        {/* Acciones de auditoría para dueños */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones de Auditoría</Text>
          {ownerAuditActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.auditActionCard,
                action.type === 'success' && styles.auditActionCardSuccess,
                action.type === 'danger' && styles.auditActionCardDanger,
              ]}
            >
              <View style={styles.auditActionContent}>
                <Icon 
                  name={action.icon} 
                  size={24} 
                  color={action.type === 'danger' ? '#BA1A1A' : action.type === 'success' ? '#00694C' : '#3D4943'} 
                />
                <View style={styles.auditActionTextContent}>
                  <Text style={styles.auditActionTitle}>{action.title}</Text>
                  <Text style={styles.auditActionDescription}>{action.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton}>
          <Icon name="content-save" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Guardar Revisión</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'support':
        return renderSupport();
      case 'monitoring':
        return renderMonitoring();
      case 'metrics':
        return renderMetrics();
      case 'walkers':
        return renderWalkerAudit();
      case 'owners':
        return renderOwnerAudit();
      default:
        return renderDashboard();
    }
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="paw" size={32} color="#00694C" />
            <Text style={styles.title}>Walkwi Admin</Text>
          </View>
          <TouchableOpacity style={styles.headerAvatar}>
            <Icon name="account-circle" size={40} color="#00694C" />
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>Bienvenido de nuevo, Alex</Text>
        <Text style={styles.subtitle}>Resumen Administrativo</Text>

        {/* Pestañas principales */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
          {['dashboard', 'users', 'support', 'monitoring', 'metrics', 'walkers', 'owners'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Icon 
                name={
                  tab === 'dashboard' ? 'view-dashboard' :
                  tab === 'users' ? 'account-group' :
                  tab === 'support' ? 'headset' :
                  tab === 'monitoring' ? 'map-marker-path' :
                  tab === 'metrics' ? 'chart-line' :
                  tab === 'walkers' ? 'walk' :
                  'account'
                } 
                size={16} 
                color={activeTab === tab ? '#FFFFFF' : '#3D4943'} 
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'dashboard' ? 'Dashboard' :
                 tab === 'users' ? 'Usuarios' :
                 tab === 'support' ? 'Soporte' :
                 tab === 'monitoring' ? 'Monitoreo' :
                 tab === 'metrics' ? 'Métricas' :
                 tab === 'walkers' ? 'Paseadores' :
                 'Dueños'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {renderContent()}

        <TouchableOpacity style={[styles.primaryButton, styles.logoutButton]} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal para acciones rápidas */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="dots-horizontal" size={28} color="#00694C" />
              <Text style={styles.modalTitle}>Realizar otra acción?</Text>
            </View>
            <Text style={styles.modalSubtitle}>Selecciona una acción rápida</Text>

            <TouchableOpacity style={styles.modalAction}>
              <Icon name="file-check" size={24} color="#00694C" />
              <Text style={styles.modalActionText}>Validar documentos de paseador</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalAction}>
              <Icon name="key" size={24} color="#00694C" />
              <Text style={styles.modalActionText}>Generar código de entrega manual</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalAction}>
              <Icon name="cash-multiple" size={24} color="#00694C" />
              <Text style={styles.modalActionText}>Ver ganancias globales</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalAction}>
              <Icon name="clipboard-account" size={24} color="#00694C" />
              <Text style={styles.modalActionText}>Auditar perfiles de dueños</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FBF5',
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00694C',
  },

  greeting: {
    fontSize: 16,
    color: '#171D1A',
    fontWeight: '500',
  },

  subtitle: {
    fontSize: 14,
    color: '#3D4943',
    marginBottom: 16,
  },

  // Pestañas
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#E4EAE4',
    gap: 6,
  },

  tabActive: {
    backgroundColor: '#00694C',
  },

  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3D4943',
  },

  tabTextActive: {
    color: '#FFFFFF',
  },

  // Secciones
  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171D1A',
    marginBottom: 12,
  },

  // Métricas
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  metricTitle: {
    fontSize: 12,
    color: '#3D4943',
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171D1A',
    marginTop: 2,
  },

  metricChange: {
    fontSize: 12,
    marginTop: 2,
  },

  metricChangePositive: {
    color: '#00694C',
  },

  metricChangeNegative: {
    color: '#BA1A1A',
  },

  // Módulos principales
  moduleCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#00694C',
  },

  moduleIconContainer: {
    marginRight: 12,
  },

  moduleContent: {
    flex: 1,
  },

  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171D1A',
  },

  moduleDescription: {
    fontSize: 14,
    color: '#3D4943',
    marginTop: 2,
  },

  // Panel especializado
  specializedGrid: {
    flexDirection: 'row',
    gap: 8,
  },

  specializedCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  specializedIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  specializedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171D1A',
  },

  specializedDescription: {
    fontSize: 12,
    color: '#3D4943',
    textAlign: 'center',
    marginTop: 2,
  },

  // Auditoría
  auditGrid: {
    gap: 6,
  },

  auditCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3D4943',
  },

  auditCardSuccess: {
    borderLeftColor: '#00694C',
  },

  auditCardDanger: {
    borderLeftColor: '#BA1A1A',
  },

  auditContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  auditTextContent: {
    flex: 1,
  },

  auditTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171D1A',
  },

  auditDescription: {
    fontSize: 13,
    color: '#3D4943',
    marginTop: 1,
  },

  // Botón primario
  primaryButton: {
    backgroundColor: '#00694C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#00694C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },

  logoutButton: {
    backgroundColor: '#BA1A1A',
    shadowColor: '#BA1A1A',
  },

  // Gestión de usuarios
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },

  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BCCAC1',
    paddingHorizontal: 12,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#171D1A',
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4EAE4',
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 4,
  },

  filterText: {
    fontSize: 14,
    color: '#3D4943',
    fontWeight: '500',
  },

  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#BCCAC1',
    marginBottom: 8,
  },

  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3D4943',
    textTransform: 'uppercase',
  },

  flex2: { flex: 2 },
  flex1: { flex: 1 },

  userCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  userInfo: {
    flex: 2,
  },

  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171D1A',
  },

  userEmail: {
    fontSize: 13,
    color: '#3D4943',
  },

  userBadges: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },

  userType: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#E4EAE4',
    color: '#3D4943',
  },

  userTypeProvider: {
    backgroundColor: '#86F8C9',
    color: '#00513A',
  },

  userStatus: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  userActions: {
    flexDirection: 'row',
    gap: 4,
  },

  userActionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#E4EAE4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  userActionDanger: {
    backgroundColor: '#FFDAD6',
  },

  userActionInfo: {
    backgroundColor: '#D7E3FC',
  },

  // Soporte
  supportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171D1A',
    marginTop: 4,
  },

  statLabel: {
    fontSize: 12,
    color: '#3D4943',
  },

  ticketCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  ticketUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  ticketUser: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171D1A',
  },

  ticketStatus: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  ticketStatusActive: {
    backgroundColor: '#86F8C9',
    color: '#00513A',
  },

  ticketStatusPending: {
    backgroundColor: '#FFDEA8',
    color: '#5E4200',
  },

  ticketStatusResolved: {
    backgroundColor: '#E4EAE4',
    color: '#3D4943',
  },

  ticketIssue: {
    fontSize: 14,
    color: '#3D4943',
    marginTop: 4,
  },

  ticketId: {
    fontSize: 12,
    color: '#6D7A73',
    marginTop: 2,
  },

  ticketActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },

  ticketActionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#E4EAE4',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  ticketActionResolve: {
    backgroundColor: '#00694C',
  },

  ticketActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D4943',
  },

  ticketActionTextResolve: {
    color: '#FFFFFF',
  },

  // Monitoreo
  monitoringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  monitoringTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171D1A',
  },

  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#86F8C9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00694C',
  },

  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00513A',
  },

  walkCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  walkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  walkId: {
    fontSize: 12,
    color: '#6D7A73',
  },

  walkStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00694C',
  },

  walkInfo: {
    marginBottom: 10,
  },

  walkParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  walkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171D1A',
  },

  walkLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },

  walkLocationText: {
    fontSize: 14,
    color: '#3D4943',
  },

  walkActions: {
    flexDirection: 'row',
    gap: 8,
  },

  walkActionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#E4EAE4',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  walkActionCode: {
    backgroundColor: '#86F8C9',
  },

  walkActionEmergency: {
    backgroundColor: '#FFDAD6',
  },

  walkActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D4943',
  },

  walkActionTextCode: {
    color: '#00513A',
  },

  walkActionTextEmergency: {
    color: '#BA1A1A',
  },

  // Gráfico de ganancias
  earningsChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  chartBar: {
    flex: 1,
    backgroundColor: '#E4EAE4',
    borderRadius: 4,
    height: 110,
    justifyContent: 'flex-end',
  },

  chartFill: {
    backgroundColor: '#00694C',
    borderRadius: 4,
    width: '100%',
  },

  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingHorizontal: 8,
  },

  chartLabel: {
    fontSize: 11,
    color: '#6D7A73',
    fontWeight: '500',
  },

  // Auditoría de Paseadores y Dueños
  auditHeader: {
    marginBottom: 16,
  },

  auditHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171D1A',
  },

  auditHeaderSubtitle: {
    fontSize: 14,
    color: '#3D4943',
    marginTop: 2,
  },

  auditProfile: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  auditAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00694C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  auditName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#171D1A',
  },

  auditStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00694C',
    marginTop: 2,
  },

  auditLevel: {
    fontSize: 14,
    color: '#3D4943',
    marginTop: 2,
  },

  auditMeta: {
    fontSize: 14,
    color: '#3D4943',
    marginTop: 2,
  },

  auditRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },

  auditRatingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F59E0B',
  },

  auditReviews: {
    fontSize: 14,
    color: '#3D4943',
  },

  auditStats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 20,
  },

  auditStat: {
    alignItems: 'center',
  },

  auditStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171D1A',
  },

  auditStatLabel: {
    fontSize: 12,
    color: '#3D4943',
    marginTop: 2,
  },

  // Documentos
  documentCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  documentName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#171D1A',
  },

  documentStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },

  documentStatusVerified: {
    backgroundColor: '#D1FAE5',
    color: '#00694C',
  },

  documentStatusPending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },

  // Mascotas
  petCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171D1A',
  },

  petStatus: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  petStatusActive: {
    backgroundColor: '#D1FAE5',
    color: '#00694C',
  },

  petStatusInactive: {
    backgroundColor: '#E4EAE4',
    color: '#3D4943',
  },

  petBreed: {
    fontSize: 14,
    color: '#3D4943',
    marginTop: 2,
    marginLeft: 28,
  },

  // Historial de viajes
  walkHistoryCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  walkHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  walkHistoryDate: {
    fontSize: 14,
    color: '#3D4943',
  },

  walkHistoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00694C',
  },

  walkHistoryProvider: {
    fontSize: 13,
    color: '#6D7A73',
    marginTop: 2,
  },

  // Acciones de auditoría
  auditActionCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#3D4943',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  auditActionCardSuccess: {
    borderLeftColor: '#00694C',
  },

  auditActionCardDanger: {
    borderLeftColor: '#BA1A1A',
  },

  auditActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  auditActionTextContent: {
    flex: 1,
  },

  auditActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171D1A',
  },

  auditActionDescription: {
    fontSize: 13,
    color: '#3D4943',
    marginTop: 1,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171D1A',
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#3D4943',
    marginTop: 4,
    marginBottom: 16,
  },

  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4EAE4',
  },

  modalActionText: {
    fontSize: 16,
    color: '#171D1A',
  },

  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E4EAE4',
    alignItems: 'center',
  },

  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D4943',
  },

  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
