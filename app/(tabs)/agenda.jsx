import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../src/styles/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiRequest } from '../../src/services/api';

const CLIENT_TABS = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'accepted', label: 'Próximas' },
  { key: 'completed', label: 'Historial' },
  { key: 'cancelled', label: 'Canceladas' },
];

const WALKER_TABS = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'accepted', label: 'Aceptadas' },
  { key: 'completed', label: 'Historial' },
  { key: 'cancelled', label: 'Canceladas' },
];

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', bg: '#fef3c7', label: 'Pendiente' },
  accepted: { color: '#10b981', bg: '#d1fae5', label: 'Aceptada' },
  completed: { color: '#6366f1', bg: '#e0e7ff', label: 'Completada' },
  cancelled: { color: '#ef4444', bg: '#fee2e2', label: 'Cancelada' },
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));

  const time = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Hoy, ${time}`;
  if (diffDays === 1) return `Mañana, ${time}`;
  if (diffDays === -1) return `Ayer, ${time}`;

  return date.toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Agenda() {
  const { user } = useAuth();
  const role = user?.role || 'user';
  const tabs = role === 'walker' ? WALKER_TABS : CLIENT_TABS;

  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/api/bookings?status=${activeTab}`);
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const handleStatusChange = async (bookingId, newStatus, reason) => {
    try {
      setActionLoading(true);
      await apiRequest(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, cancelReason: reason }),
      });
      fetchBookings();
      setSelectedBooking(null);
      setCancelModalVisible(false);
      setCancelReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setCancelModalVisible(true);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
        <View style={styles.heroBlock}>
          <Text style={styles.eyebrow}>Agenda</Text>
          <Text style={styles.title}>
            {role === 'walker' ? 'Mi agenda' : 'Mis paseos'}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <View style={styles.tabsRow}>
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.tab, active && styles.tabActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={40} color={colors.primary} />
            <Text style={styles.emptyTitle}>Sin reservas</Text>
            <Text style={styles.emptyCopy}>
              No hay reservas en esta categoría.
            </Text>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {bookings.map((booking) => {
              const statusInfo = STATUS_CONFIG[booking.status];
              const otherPerson = role === 'walker' ? booking.client : booking.walker;

              return (
                <Pressable
                  key={booking._id}
                  onPress={() => setSelectedBooking(booking)}
                  style={({ pressed }) => [styles.bookingCard, pressed && styles.cardPressed]}
                >
                  <View style={styles.bookingHeader}>
                    <View style={styles.dateBadge}>
                      <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                      <Text style={styles.dateText}>{formatDate(booking.startTime)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bookingBody}>
                    <View style={styles.infoRow}>
                      <Ionicons name="paw-outline" size={16} color={colors.primary} />
                      <Text style={styles.infoText}>{booking.petName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="person-outline" size={16} color={colors.primary} />
                      <Text style={styles.infoText}>{otherPerson?.name || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={16} color={colors.primary} />
                      <Text style={styles.infoText}>{booking.location?.address}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="cash-outline" size={16} color={colors.primary} />
                      <Text style={styles.infoText}>${booking.price}</Text>
                    </View>
                  </View>

                  {role === 'walker' && booking.status === 'pending' && (
                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={() => openCancelModal(booking)}
                        style={({ pressed }) => [styles.denyButton, pressed && styles.cardPressed]}
                      >
                        <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                        <Text style={styles.denyButtonText}>Rechazar</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleStatusChange(booking._id, 'accepted')}
                        style={({ pressed }) => [styles.acceptButton, pressed && styles.cardPressed]}
                      >
                        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                        <Text style={styles.acceptButtonText}>Aceptar</Text>
                      </Pressable>
                    </View>
                  )}

                  {role === 'walker' && booking.status === 'accepted' && (
                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={() => handleStatusChange(booking._id, 'completed')}
                        style={({ pressed }) => [styles.completeButton, pressed && styles.cardPressed]}
                      >
                        <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                        <Text style={styles.completeButtonText}>Completar</Text>
                      </Pressable>
                    </View>
                  )}

                  {role === 'user' && ['pending', 'accepted'].includes(booking.status) && (
                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={() => openCancelModal(booking)}
                        style={({ pressed }) => [styles.denyButton, pressed && styles.cardPressed]}
                      >
                        <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                        <Text style={styles.denyButtonText}>Cancelar</Text>
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={cancelModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setCancelModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Cancelar reserva</Text>
            <Text style={styles.modalSubtitle}>
              Indica el motivo de la cancelación
            </Text>
            <TextInput
              multiline
              onChangeText={setCancelReason}
              placeholder="Ej: No puedo asistir, cambio de planes..."
              placeholderTextColor="#8fa899"
              style={styles.modalInput}
              textAlignVertical="top"
              value={cancelReason}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setCancelModalVisible(false);
                  setCancelReason('');
                }}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Volver</Text>
              </Pressable>
              <Pressable
                disabled={!cancelReason.trim() || actionLoading}
                onPress={() => handleStatusChange(selectedBooking?._id, 'cancelled', cancelReason)}
                style={[
                  styles.modalConfirmButton,
                  (!cancelReason.trim() || actionLoading) && styles.modalConfirmDisabled,
                ]}
              >
                <Text style={styles.modalConfirmText}>
                  {actionLoading ? 'Cancelando...' : 'Confirmar'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  heroBlock: {
    alignSelf: 'center',
    maxWidth: 720,
    width: '100%',
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 37,
  },
  tabsScroll: {
    marginTop: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.2)',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  centered: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    marginTop: 30,
    padding: 30,
  },
  emptyTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyCopy: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  bookingsList: {
    alignSelf: 'center',
    gap: 14,
    marginTop: 20,
    maxWidth: 720,
    width: '100%',
  },
  bookingCard: {
    ...shadows.card,
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  cardPressed: {
    opacity: 0.75,
  },
  bookingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dateText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  bookingBody: {
    gap: 8,
    marginTop: 14,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  infoText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  actionsRow: {
    borderTopColor: 'rgba(83, 128, 93, 0.12)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
  },
  denyButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: 16,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  denyButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
  },
  acceptButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  completeButton: {
    alignItems: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 16,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 34,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    backgroundColor: colors.line,
    borderRadius: 3,
    height: 4,
    marginBottom: 16,
    width: 36,
  },
  modalTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    height: 100,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancelButton: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: 16,
    flex: 1,
    paddingVertical: 14,
  },
  modalCancelText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '900',
  },
  modalConfirmButton: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: 16,
    flex: 1,
    paddingVertical: 14,
  },
  modalConfirmDisabled: {
    opacity: 0.5,
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});

export default Agenda;
