import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows } from '../../src/styles/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiRequest } from '../../src/services/api';
import MapPicker from '../../src/components/MapPicker';

const DAY_LABELS = {
  lunes: 'Lun',
  martes: 'Mar',
  miercoles: 'Mié',
  jueves: 'Jue',
  viernes: 'Vie',
  sabado: 'Sáb',
  domingo: 'Dom',
};

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
  { label: '120 min', value: 120 },
];

const STEP_TITLES = ['Mascota', 'Fecha, hora y duración', 'Dirección', 'Resumen', 'Pago'];

function generateTimeSlots(start, end, interval = 60) {
  if (!start || !end) return [];
  const slots = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH] = end.split(':').map(Number);
  let totalMin = startH * 60 + startM;
  const endMin = endH * 60;
  while (totalMin < endMin) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    totalMin += interval;
  }
  return slots;
}

function PetIcon({ name, photoUri, active }) {
  const initial = (name || '?')[0].toUpperCase();
  return (
    <View style={[styles.petIconCircle, active && styles.petIconCircleActive]}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.petIconImage} />
      ) : (
        <Text style={[styles.petIconText, active && styles.petIconTextActive]}>{initial}</Text>
      )}
    </View>
  );
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const ES_DAY_NAMES = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const MONTHS_AHEAD = 2;

function NativeDatePicker({ date, onChange, availableDays }) {
  const [visible, setVisible] = useState(false);
  const today = new Date();

  const [selDay, setSelDay] = useState(date?.getDate() || today.getDate());
  const [selMonth, setSelMonth] = useState(date?.getMonth() ?? today.getMonth());
  const [selYear, setSelYear] = useState(date?.getFullYear() || today.getFullYear());

  const availSet = useMemo(() => {
    if (!availableDays || availableDays.length === 0) return null;
    return new Set(availableDays.map((d) => d.toLowerCase()));
  }, [availableDays]);

  const months = useMemo(() => {
    const result = [];
    for (let i = 0; i <= MONTHS_AHEAD; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      result.push({ label: MONTHS[d.getMonth()], month: d.getMonth(), year: d.getFullYear() });
    }
    return result;
  }, []);

  const isCurrentMonth = selMonth === today.getMonth() && selYear === today.getFullYear();
  const minDay = isCurrentMonth ? today.getDate() : 1;

  const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth - minDay + 1 }, (_, i) => i + minDay);

  useEffect(() => {
    if (date) {
      setSelDay(date.getDate());
      setSelMonth(date.getMonth());
      setSelYear(date.getFullYear());
    }
  }, [date]);

  const handleMonthChange = (newMonth, newYear) => {
    const maxDay = new Date(newYear, newMonth + 1, 0).getDate();
    const newMinDay = (newMonth === today.getMonth() && newYear === today.getFullYear()) ? today.getDate() : 1;
    setSelMonth(newMonth);
    setSelYear(newYear);
    setSelDay(Math.min(Math.max(selDay, newMinDay), maxDay));
  };

  const isDayAvailable = (day) => {
    if (!availSet) return true;
    const jsDay = new Date(selYear, selMonth, day).getDay();
    return availSet.has(ES_DAY_NAMES[jsDay]);
  };

  const handleConfirm = () => {
    const d = new Date(selYear, selMonth, selDay, 12, 0, 0);
    onChange(d);
    setVisible(false);
  };

  const displayText = date
    ? `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
    : '';

  return (
    <>
      <Pressable onPress={() => setVisible(true)} style={styles.formInput}>
        <Text style={date ? styles.dateText : styles.datePlaceholder}>
          {displayText || 'Seleccionar fecha'}
        </Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.dateModalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.dateModalTitle}>Seleccionar fecha</Text>

            <View style={styles.datePickersRow}>
              <View style={[styles.datePickerCol, { flex: 1.2 }]}>
                <Text style={styles.datePickerLabel}>Mes</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {months.map((m) => {
                    const active = selMonth === m.month && selYear === m.year;
                    return (
                      <Pressable
                        key={`${m.year}-${m.month}`}
                        onPress={() => handleMonthChange(m.month, m.year)}
                        style={[styles.datePickerItem, active && styles.datePickerItemActive]}
                      >
                        <Text style={[styles.datePickerItemText, active && styles.datePickerItemTextActive]}>
                          {m.label} {m.year}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={[styles.datePickerCol, { flex: 1.8 }]}>
                <Text style={styles.datePickerLabel}>Día</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {days.map((d) => {
                    const available = isDayAvailable(d);
                    return (
                      <Pressable
                        key={d}
                        onPress={() => available && setSelDay(d)}
                        style={[
                          styles.datePickerItem,
                          selDay === d && styles.datePickerItemActive,
                          !available && styles.datePickerItemDisabled,
                        ]}
                        disabled={!available}
                      >
                        <Text
                          style={[
                            styles.datePickerItemText,
                            selDay === d && styles.datePickerItemTextActive,
                            !available && styles.datePickerItemTextDisabled,
                          ]}
                        >
                          {d}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <Pressable onPress={handleConfirm} style={styles.dateConfirmBtn}>
              <Text style={styles.dateConfirmBtnText}>Confirmar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default function WalkerProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [walker, setWalker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);

  const [bookingVisible, setBookingVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [petName, setPetName] = useState('');
  const [petId, setPetId] = useState(null);
  const [dateObj, setDateObj] = useState(null);
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [bookingLatitude, setBookingLatitude] = useState(null);
  const [bookingLongitude, setBookingLongitude] = useState(null);
  const [pendingBookingData, setPendingBookingData] = useState(null);
  const [paypalPolling, setPaypalPolling] = useState(false);
  const [paypalPollingBookingId, setPaypalPollingBookingId] = useState(null);
  const [paypalTimeLeft, setPaypalTimeLeft] = useState(300);

  useEffect(() => {
    let mounted = true;
    async function fetchWalker() {
      try {
        const data = await apiRequest(`/api/walkers/${id}`);
        if (mounted) setWalker(data);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchWalker();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    apiRequest(`/api/reviews/walker/${id}`)
      .then((data) => { if (mounted) setReviews(data || []); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [id]);

  const userPets = user?.pets || [];

  useEffect(() => {
    if (!dateObj || !id) {
      setBookedSlots([]);
      setTime('');
      setDuration(null);
      return;
    }
    setTime('');
    setDuration(null);
    let mounted = true;
    const dateStr = dateObj.toISOString().split('T')[0];
    apiRequest(`/api/bookings/slots?walkerId=${id}&date=${dateStr}`)
      .then((data) => { if (mounted) setBookedSlots(data || []); })
      .catch(() => { if (mounted) setBookedSlots([]); });
    return () => { mounted = false; };
  }, [dateObj, id]);

  useEffect(() => {
    setDuration(null);
  }, [time]);

  useEffect(() => {
    if (!paypalPolling || !paypalPollingBookingId) return;

    let mounted = true;
    let timedOut = false;

    const timerInterval = setInterval(() => {
      if (!mounted || timedOut) return;
      setPaypalTimeLeft((prev) => {
        if (prev <= 1) {
          timedOut = true;
          clearInterval(timerInterval);
          cancelBookingQuiet(paypalPollingBookingId);
          setPaypalPolling(false);
          setPaypalPollingBookingId(null);
          setTimeout(() => Alert.alert('Tiempo agotado', 'El pago no se confirmo. La reserva ha sido cancelada.'), 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const pollInterval = setInterval(async () => {
      if (!mounted || timedOut) return;
      try {
        const booking = await apiRequest(`/api/bookings/${paypalPollingBookingId}`);
        if (!mounted || timedOut) return;
        if (booking.paymentStatus === 'captured' || booking.paymentStatus === 'refunded') {
          timedOut = true;
          clearInterval(timerInterval);
          clearInterval(pollInterval);
          setPaypalPolling(false);
          setPaypalPollingBookingId(null);
          setSuccess(true);
          setTimeout(() => {
            setBookingVisible(false);
            resetModal();
            router.push('/(tabs)/agenda');
          }, 1500);
        } else if (booking.status === 'cancelled') {
          timedOut = true;
          clearInterval(timerInterval);
          clearInterval(pollInterval);
          setPaypalPolling(false);
          setPaypalPollingBookingId(null);
          setTimeout(() => Alert.alert('Pago cancelado', 'La reserva fue cancelada.'), 300);
        }
      } catch {}
    }, 3000);

    return () => { mounted = false; clearInterval(timerInterval); clearInterval(pollInterval); };
  }, [paypalPolling, paypalPollingBookingId]);

  const bookedSet = useMemo(() => {
    const set = new Set();
    bookedSlots.forEach((slot) => {
      const slotStart = new Date(slot.startTime);
      const h = slotStart.getHours();
      const m = slotStart.getMinutes();
      const slotEndMin = h * 60 + m + (slot.duration || 60);
      for (let min = h * 60 + m; min < slotEndMin; min += 60) {
        const hh = Math.floor(min / 60);
        const mm = min % 60;
        set.add(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
      }
    });
    return set;
  }, [bookedSlots]);

  const timeSlots = useMemo(() => {
    const s = walker?.availableHours?.start;
    const e = walker?.availableHours?.end;
    if (s && e) return generateTimeSlots(s, e);
    return generateTimeSlots('08:00', '19:00');
  }, [walker]);

  const nextSlotConflict = useMemo(() => {
    if (!time || bookedSlots.length === 0) return null;
    const [selH, selM] = time.split(':').map(Number);
    const selMin = selH * 60 + selM;
    let earliest = Infinity;
    bookedSlots.forEach((slot) => {
      const d = new Date(slot.startTime);
      const slotMin = d.getHours() * 60 + d.getMinutes();
      if (slotMin >= selMin && slotMin < earliest) {
        earliest = slotMin;
      }
    });
    if (earliest === Infinity) return null;
    const hh = String(Math.floor(earliest / 60)).padStart(2, '0');
    const mm = String(earliest % 60).padStart(2, '0');
    return { minutes: earliest, label: `${hh}:${mm}` };
  }, [time, bookedSlots]);

  const durationOptions = useMemo(() => {
    if (!time) return DURATION_OPTIONS.map((opt) => ({ ...opt, disabled: false, reason: null }));
    const [selH, selM] = time.split(':').map(Number);
    const selMin = selH * 60 + selM;
    return DURATION_OPTIONS.map((opt) => {
      if (!nextSlotConflict) return { ...opt, disabled: false, reason: null };
      const endMin = selMin + opt.value;
      const overflows = endMin > nextSlotConflict.minutes;
      return {
        ...opt,
        disabled: overflows,
        reason: overflows ? `Choca con ${nextSlotConflict.label}` : null,
      };
    });
  }, [time, nextSlotConflict]);

  const endTimeLabel = useMemo(() => {
    if (!time || !duration) return null;
    const [h, m] = time.split(':').map(Number);
    const endMin = h * 60 + m + duration;
    const eh = String(Math.floor(endMin / 60)).padStart(2, '0');
    const em = String(endMin % 60).padStart(2, '0');
    return `${eh}:${em}`;
  }, [time, duration]);

  const estimatedPrice = useMemo(() => {
    if (!duration) return '0.00';
    const d = Math.max(30, Math.min(120, duration));
    return ((6 + ((d - 30) / 90) * 9)).toFixed(2);
  }, [duration]);

  const handlePetSelect = (pet) => {
    setPetName(pet.name);
    setPetId(pet._id);
  };

  const resetModal = () => {
    setStep(1);
    setSuccess(false);
    setPetName('');
    setPetId(null);
    setDateObj(null);
    setTime('');
    setDuration(null);
    setAddress('');
    setNotes('');
    setBookedSlots([]);
    setBookingLatitude(null);
    setBookingLongitude(null);
    setPendingBookingData(null);
    setPaypalPolling(false);
    setPaypalPollingBookingId(null);
    setPaypalTimeLeft(300);
  };

  const openBooking = async () => {
    try {
      const active = await apiRequest('/api/bookings?status=accepted');
      const inProgress = await apiRequest('/api/bookings?status=in_progress');
      if ((active.length > 0 || inProgress.length > 0)) {
        Alert.alert('Paseo activo', 'Ya tienes un paseo en curso o proximo. Debes completar o cancelarlo antes de reservar otro.');
        return;
      }
    } catch {}

    resetModal();
    setBookingLatitude(user?.latitude || null);
    setBookingLongitude(user?.longitude || null);
    setAddress(user?.location || '');
    setBookingVisible(true);
  };

  const canAdvance = () => {
    if (step === 1) return !!petName;
    if (step === 2) {
      if (!dateObj || !time || !duration) return false;
      const [h, m] = time.split(':').map(Number);
      const selected = new Date(dateObj);
      selected.setHours(h, m, 0, 0);
      return selected > new Date();
    }
    if (step === 3) return !!address;
    if (step === 4) return true;
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !petName) {
      Alert.alert('Selecciona mascota', 'Debes seleccionar una mascota para el paseo.');
      return;
    }
    if (step === 2 && (!dateObj || !time || !duration)) {
      Alert.alert('Datos incompletos', 'Selecciona fecha, hora y duracion del paseo.');
      return;
    }
    if (step === 2 && dateObj && time) {
      const [h, m] = time.split(':').map(Number);
      const selected = new Date(dateObj);
      selected.setHours(h, m, 0, 0);
      if (selected <= new Date()) {
        Alert.alert('Fecha invalida', 'La fecha y hora deben ser en el futuro.');
        return;
      }
    }
    if (step === 3 && !address) {
      Alert.alert('Direccion requerida', 'Selecciona la ubicacion del paseo.');
      return;
    }
    if (step < 5 && canAdvance()) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const cancelBookingQuiet = async (bookingId) => {
    try {
      await apiRequest(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled', cancelReason: 'Error al procesar el pago.' }),
      });
    } catch {}
  };

  const handleBooking = async () => {
    if (!petName || !dateObj || !time || !address) return;

    try {
      setSubmitting(true);
      const dateStr = dateObj.toISOString().split('T')[0];
      const startTime = new Date(`${dateStr}T${time}:00`);

      const booking = await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          walkerId: id,
          petName,
          petId,
          startTime: startTime.toISOString(),
          duration,
          address,
          latitude: bookingLatitude,
          longitude: bookingLongitude,
          notes,
          price: parseFloat(estimatedPrice),
        }),
      });

      let order;
      try {
        order = await apiRequest('/api/payments/create-order', {
          method: 'POST',
          body: JSON.stringify({
            bookingId: booking._id,
            amount: parseFloat(estimatedPrice),
          }),
        });
      } catch (payErr) {
        await cancelBookingQuiet(booking._id);
        Alert.alert('Error de pago', 'No se pudo crear la orden de PayPal. La reserva ha sido cancelada.');
        return;
      }

      if (!order.approveUrl) {
        await cancelBookingQuiet(booking._id);
        Alert.alert('Error de pago', 'No se obtuvo el enlace de pago. La reserva ha sido cancelada.');
        return;
      }

      setPendingBookingData(booking);
      setPaypalPollingBookingId(booking._id);
      setPaypalPolling(true);
      setPaypalTimeLeft(300);
      Linking.openURL(order.approveUrl);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo crear la reserva. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayPalCancel = () => {
    if (paypalPollingBookingId) {
      cancelBookingQuiet(paypalPollingBookingId);
    }
    setPaypalPolling(false);
    setPaypalPollingBookingId(null);
    setPendingBookingData(null);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !walker) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Paseador no encontrado'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const daysText = (walker.availableDays || [])
    .map((d) => DAY_LABELS[d] || d)
    .join(' • ');

  const hoursText = walker.availableHours?.start && walker.availableHours?.end
    ? `${walker.availableHours.start} – ${walker.availableHours.end}`
    : null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
          <Text style={styles.backButtonText}>Volver</Text>
        </Pressable>

        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            {walker.profilePhotoUri ? (
              <Image source={{ uri: walker.profilePhotoUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person-outline" size={48} color={colors.primary} />
            )}
          </View>
          <Text style={styles.walkerName}>{walker.name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color={colors.primary} />
              <Text style={styles.statValue}>{walker.rating}</Text>
              <Text style={styles.statLabel}>({walker.reviewCount} reseñas)</Text>
            </View>
          </View>
          {walker.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.verifiedText}>Verificado</Text>
            </View>
          )}
          <Text style={styles.completedText}>{walker.completedWalks} paseos realizados</Text>
        </View>

        {walker.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre mí</Text>
            <Text style={styles.sectionText}>{walker.bio}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>{walker.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>{walker.experience} de experiencia</Text>
          </View>
        </View>

        {(daysText || hoursText) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disponibilidad</Text>
            {daysText && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={styles.infoText}>{daysText}</Text>
              </View>
            )}
            {hoursText && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.infoText}>{hoursText}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reseñas</Text>
          <View style={styles.ratingBlock}>
            <Text style={styles.ratingBig}>{walker.rating}</Text>
            <View>
              <Ionicons name="star" size={20} color={colors.primary} />
              <Text style={styles.ratingSubtext}>{walker.reviewCount} reseñas</Text>
            </View>
          </View>
          {reviews.length > 0 && (
            <View style={{ marginTop: 14, gap: 10 }}>
              {reviews.map((r) => (
                <View key={r._id} style={{ backgroundColor: colors.input, borderRadius: 14, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {r.client?.profilePhotoUri ? (
                      <Image source={{ uri: r.client.profilePhotoUri }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                    ) : (
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="person-outline" size={14} color={colors.primary} />
                      </View>
                    )}
                    <Text style={{ fontWeight: '800', color: colors.text, fontSize: 13 }}>{r.client?.name || 'Cliente'}</Text>
                    <View style={{ flexDirection: 'row', gap: 2, marginLeft: 'auto' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons key={s} name={s <= r.rating ? 'star' : 'star-outline'} size={12} color="#f59e0b" />
                      ))}
                    </View>
                  </View>
                  {r.comment ? <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Desde</Text>
          <Text style={styles.footerPriceValue}>$6 - $15</Text>
        </View>
        <Pressable
          onPress={openBooking}
          style={({ pressed }) => [styles.bookButton, pressed && styles.bookButtonPressed]}
        >
          <Ionicons name="paw-outline" size={18} color="#fff" />
          <Text style={styles.bookButtonText}>Solicitar paseo</Text>
        </Pressable>
      </View>

      <Modal visible={bookingVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setBookingVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Pressable onPress={() => setBookingVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
              <Text style={styles.modalTitle}>{STEP_TITLES[step - 1]}</Text>
              <View style={styles.modalCloseBtn} />
            </View>

            <View style={styles.progressRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.progressDot,
                    s === step && styles.progressDotActive,
                    s < step && styles.progressDotDone,
                  ]}
                />
              ))}
            </View>

            {success ? (
              <View style={styles.successBlock}>
                <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
                <Text style={styles.successTitle}>Reserva creada</Text>
                <Text style={styles.successSub}>Redirigiendo a tu agenda...</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                  {step === 1 && (
                    <View>
                      <Text style={styles.stepDescription}>
                        Selecciona la mascota para el paseo
                      </Text>
                      {userPets.length > 0 ? (
                        <View style={styles.petGrid}>
                          {userPets.map((pet) => {
                            const active = petName === pet.name;
                            return (
                              <Pressable
                                key={pet._id || pet.name}
                                onPress={() => handlePetSelect(pet)}
                                style={[styles.petCard, active && styles.petCardActive]}
                              >
                                <PetIcon name={pet.name} photoUri={pet.photoUri} active={active} />
                                <Text style={[styles.petCardName, active && styles.petCardNameActive]}>
                                  {pet.name}
                                </Text>
                                {pet.breed ? (
                                  <Text style={[styles.petCardBreed, active && styles.petCardBreedActive]}>
                                    {pet.breed}
                                  </Text>
                                ) : null}
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : (
                        <View style={styles.emptyPetsBlock}>
                          <Ionicons name="paw-outline" size={36} color={colors.textMuted} />
                          <Text style={styles.emptyPetsTitle}>Sin mascotas</Text>
                          <Text style={styles.emptyPetsText}>
                            Registra una mascota en tu perfil para poder solicitar paseos.
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {step === 2 && (
                    <View>
                      <Text style={styles.stepDescription}>
                        Elige cuándo, a qué hora y cuánto dura
                      </Text>
                      <Text style={styles.fieldLabel}>Fecha</Text>
                      {Platform.OS === 'web' ? (
                        <View style={styles.webDateWrapper}>
                          <input
                            type="date"
                            value={dateObj ? dateObj.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                setDateObj(new Date(e.target.value + 'T12:00:00'));
                              }
                            }}
                            style={styles.webDateInput}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </View>
                      ) : (
                        <NativeDatePicker date={dateObj} onChange={setDateObj} availableDays={walker?.availableDays} />
                      )}

                      <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Hora</Text>
                      <View style={styles.timeSlotGrid}>
                        {timeSlots.map((slot) => {
                          const active = time === slot;
                          const isBooked = bookedSet.has(slot);
                          return (
                            <Pressable
                              key={slot}
                              onPress={() => !isBooked && setTime(slot)}
                              disabled={isBooked}
                              style={[
                                styles.timeSlot,
                                active && styles.timeSlotActive,
                                isBooked && styles.timeSlotBooked,
                              ]}
                            >
                              <Text style={[
                                styles.timeSlotText,
                                active && styles.timeSlotTextActive,
                                isBooked && styles.timeSlotTextBooked,
                              ]}>
                                {slot}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      {bookedSlots.length > 0 && dateObj && (
                        <Text style={styles.bookedInfo}>
                          {bookedSlots.length} horario(s) ocupado(s) — no disponibles
                        </Text>
                      )}

                      <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Duración</Text>
                      <View style={styles.durationGrid}>
                        {durationOptions.map((opt) => {
                          const active = duration === opt.value;
                          return (
                            <Pressable
                              key={opt.value}
                              onPress={() => !opt.disabled && setDuration(opt.value)}
                              disabled={opt.disabled}
                              style={[
                                styles.durationCard,
                                active && styles.durationCardActive,
                                opt.disabled && styles.durationCardDisabled,
                              ]}
                            >
                              <Ionicons
                                name="time-outline"
                                size={20}
                                color={active ? '#fff' : opt.disabled ? colors.textMuted : colors.primary}
                              />
                              <Text style={[
                                styles.durationCardValue,
                                active && styles.durationCardValueActive,
                                opt.disabled && styles.durationCardValueDisabled,
                              ]}>
                                {opt.label}
                              </Text>
                              {opt.reason ? (
                                <Text style={styles.durationConflictText}>{opt.reason}</Text>
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>

                      {time && duration && endTimeLabel && (
                        <View style={styles.timeRangeCard}>
                          <View>
                            <Text style={styles.timeRangeLabel}>{time} – {endTimeLabel}</Text>
                            <Text style={styles.timeRangeDetail}>{duration} min</Text>
                          </View>
                          <Text style={styles.timeRangePrice}>${estimatedPrice}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {step === 3 && (
                    <View>
                      <Text style={styles.stepDescription}>
                        ¿Dónde se realiza el paseo?
                      </Text>
                      <Text style={styles.fieldLabel}>Dirección</Text>
                      <Pressable
                        onPress={() => setMapPickerVisible(true)}
                        style={styles.locationPickerCard}
                      >
                        <Ionicons name="map-outline" size={20} color={colors.primary} />
                        <View style={styles.locationPickerCopy}>
                          <Text style={styles.locationPickerText} numberOfLines={1}>
                            {address || 'Toca para seleccionar ubicacion'}
                          </Text>
                          {bookingLatitude != null && bookingLongitude != null ? (
                            <Text style={styles.locationPickerCoords}>
                              {bookingLatitude.toFixed(4)}, {bookingLongitude.toFixed(4)}
                            </Text>
                          ) : null}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                      </Pressable>

                      <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Notas (opcional)</Text>
                      <TextInput
                        multiline
                        placeholder="Ej: Luna es tranquila, pero se asusta con motos..."
                        placeholderTextColor="#8fa899"
                        style={[styles.formInput, styles.formTextarea]}
                        textAlignVertical="top"
                        value={notes}
                        onChangeText={setNotes}
                      />
                    </View>
                  )}

                  {step === 4 && (
                    <View>
                      <Text style={styles.stepDescription}>
                        Revisa los detalles antes de confirmar
                      </Text>

                      <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                          <View style={styles.summaryAvatar}>
                            {walker.profilePhotoUri ? (
                              <Image source={{ uri: walker.profilePhotoUri }} style={styles.summaryAvatarImg} />
                            ) : (
                              <Ionicons name="person-outline" size={20} color={colors.primary} />
                            )}
                          </View>
                          <View style={styles.summaryInfo}>
                            <Text style={styles.summaryWalkerName}>{walker.name}</Text>
                            <View style={styles.summaryRatingRow}>
                              <Ionicons name="star" size={13} color={colors.primary} />
                              <Text style={styles.summaryRating}>{walker.rating}</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryField}>
                          <Ionicons name="paw-outline" size={16} color={colors.primary} />
                          <Text style={styles.summaryFieldValue}>{petName}</Text>
                        </View>
                        <View style={styles.summaryField}>
                          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                          <Text style={styles.summaryFieldValue}>
                            {dateObj ? dateObj.toLocaleDateString('es-PA') : '—'}
                          </Text>
                        </View>
                        <View style={styles.summaryField}>
                          <Ionicons name="time-outline" size={16} color={colors.primary} />
                          <Text style={styles.summaryFieldValue}>
                            {time}{endTimeLabel ? ` – ${endTimeLabel}` : ''}{duration ? ` · ${duration} min` : ''}
                          </Text>
                        </View>
                        <View style={styles.summaryField}>
                          <Ionicons name="location-outline" size={16} color={colors.primary} />
                          <Text style={styles.summaryFieldValue}>{address}</Text>
                        </View>
                        {notes ? (
                          <View style={styles.summaryField}>
                            <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                            <Text style={styles.summaryFieldValue} numberOfLines={2}>{notes}</Text>
                          </View>
                        ) : null}

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryTotalRow}>
                          <Text style={styles.summaryTotalLabel}>Total estimado</Text>
                          <Text style={styles.summaryTotalValue}>${estimatedPrice}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {step === 5 && (
                    <View>
                      <Text style={styles.stepDescription}>
                        Confirma tu pago para reservar
                      </Text>

                      <View style={styles.summaryCard}>
                        <View style={styles.summaryField}>
                          <Ionicons name="cash-outline" size={16} color={colors.primary} />
                          <Text style={styles.summaryFieldValue}>Monto a pagar</Text>
                          <Text style={styles.summaryTotalValue}>${estimatedPrice}</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryField}>
                          <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                          <Text style={[styles.summaryFieldValue, { fontSize: 13, color: colors.textMuted }]}>
                            El pago se retendra hasta completar el servicio
                          </Text>
                        </View>
                        <View style={styles.summaryField}>
                          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                          <Text style={[styles.summaryFieldValue, { fontSize: 13, color: colors.textMuted }]}>
                            Cancelacion antes: 50% de penalizacion
                          </Text>
                        </View>
                        <View style={styles.summaryField}>
                          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                          <Text style={[styles.summaryFieldValue, { fontSize: 13, color: colors.textMuted }]}>
                            Cancelacion durante: 100% cobro
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>
                <View style={styles.modalFooter}>
                  {step > 1 ? (
                    <Pressable onPress={handleBack} style={styles.backStepBtn}>
                      <Ionicons name="arrow-back" size={16} color={colors.primary} />
                      <Text style={styles.backStepBtnText}>Atrás</Text>
                    </Pressable>
                  ) : (
                    <View />
                  )}

                  {step < 5 ? (
                    <Pressable
                      onPress={handleNext}
                      disabled={!canAdvance()}
                      style={({ pressed }) => [
                        styles.nextStepBtn,
                        pressed && styles.nextStepBtnPressed,
                        !canAdvance() && styles.nextStepBtnDisabled,
                      ]}
                    >
                      <Text style={styles.nextStepBtnText}>
                        {step === 4 ? 'Siguiente' : 'Siguiente'}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={handleBooking}
                      disabled={submitting}
                      style={({ pressed }) => [
                        styles.confirmBtn,
                        pressed && styles.confirmBtnPressed,
                        submitting && styles.confirmBtnDisabled,
                      ]}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="card-outline" size={18} color="#fff" />
                          <Text style={styles.confirmBtnText}>Pagar con PayPal</Text>
                        </>
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <MapPicker
        visible={mapPickerVisible}
        initialLatitude={bookingLatitude}
        initialLongitude={bookingLongitude}
        initialAddress={address}
        onConfirm={({ latitude, longitude, address: addr }) => {
          setBookingLatitude(latitude);
          setBookingLongitude(longitude);
          setAddress(addr);
          setMapPickerVisible(false);
        }}
        onCancel={() => setMapPickerVisible(false)}
      />

      <Modal visible={paypalPolling} transparent animationType="fade">
        <Pressable style={styles.paypalModalOverlay} onPress={() => {}}>
          <View style={styles.paypalPollingCard}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.paypalPollingTitle}>Procesando pago...</Text>
            <Text style={styles.paypalPollingText}>
              Completa el pago en la ventana de PayPal.{'\n'}Esta pantalla se cerrara automaticamente.
            </Text>
            <Text style={styles.paypalTimer}>
              {Math.floor(paypalTimeLeft / 60)}:{String(paypalTimeLeft % 60).padStart(2, '0')}
            </Text>
            <Pressable onPress={handlePayPalCancel} style={styles.paypalCancelBtn}>
              <Text style={styles.paypalCancelBtnText}>Cancelar</Text>
            </Pressable>
          </View>
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
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  backLink: {
    marginTop: 8,
  },
  backLinkText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  content: {
    paddingBottom: 100,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarLarge: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 100,
  },
  avatarImage: {
    height: 100,
    width: 100,
  },
  walkerName: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 14,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  statValue: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  statLabel: {
    color: '#6b7b6f',
    fontSize: 14,
  },
  verifiedBadge: {
    alignItems: 'center',
    backgroundColor: '#d4f1d8',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  verifiedText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  completedText: {
    color: '#6b7b6f',
    fontSize: 14,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  sectionText: {
    color: '#4c6053',
    fontSize: 15,
    lineHeight: 24,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  infoText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  ratingBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  ratingBig: {
    color: colors.primary,
    fontSize: 40,
    fontWeight: '900',
  },
  ratingSubtext: {
    color: '#6b7b6f',
    fontSize: 14,
  },
  stickyFooter: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: 'rgba(83, 128, 93, 0.12)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    ...shadows.nav,
  },
  footerPrice: {
    gap: 2,
  },
  footerPriceLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  footerPriceValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  bookButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  bookButtonPressed: {
    opacity: 0.75,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
    height: '82%',
    paddingBottom: 0,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalHandle: {
    alignSelf: 'center',
    backgroundColor: colors.line,
    borderRadius: 3,
    height: 4,
    marginTop: 10,
    width: 36,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modalCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  modalTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 14,
  },
  progressDot: {
    backgroundColor: colors.line,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  progressDotDone: {
    backgroundColor: colors.primarySoft,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepDescription: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 18,
  },
  successBlock: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  successTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  successSub: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  petGrid: {
    gap: 10,
  },
  petCard: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 2,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  petCardActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  petCardName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  petCardNameActive: {
    color: colors.primary,
  },
  petCardBreed: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  petCardBreedActive: {
    color: colors.primaryDark,
  },
  petIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.line,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  petIconCircleActive: {
    backgroundColor: colors.primary,
  },
  petIconImage: {
    height: 44,
    width: 44,
    borderRadius: 22,
  },
  petIconText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  petIconTextActive: {
    color: '#fff',
  },
  emptyPetsBlock: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: 18,
    gap: 8,
    paddingVertical: 32,
  },
  emptyPetsTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyPetsText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  fieldLabel: {
    color: '#324036',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationPickerCard: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  locationPickerCopy: {
    flex: 1,
  },
  locationPickerText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  locationPickerCoords: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  formTextarea: {
    height: 90,
  },
  dateText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  datePlaceholder: {
    color: '#8fa899',
    fontSize: 15,
  },
  webDateWrapper: {
    marginBottom: 4,
  },
  webDateInput: {
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
    fontFamily: 'inherit',
  },
  dateModalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  dateModalTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickersRow: {
    flexDirection: 'row',
    gap: 10,
    height: 200,
  },
  datePickerCol: {
    flex: 1,
  },
  datePickerLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  datePickerScroll: {
    maxHeight: 180,
  },
  datePickerItem: {
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 8,
  },
  datePickerItemActive: {
    backgroundColor: colors.primary,
  },
  datePickerItemText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  datePickerItemTextActive: {
    color: '#fff',
    fontWeight: '900',
  },
  datePickerItemDisabled: {
    backgroundColor: 'transparent',
    opacity: 0.3,
  },
  datePickerItemTextDisabled: {
    color: colors.textMuted,
  },
  dateConfirmBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    marginTop: 16,
    paddingVertical: 14,
  },
  dateConfirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  timeSlot: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  timeSlotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeSlotText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  timeSlotTextActive: {
    color: '#fff',
  },
  timeSlotBooked: {
    backgroundColor: colors.line,
    borderColor: colors.line,
    opacity: 0.5,
  },
  timeSlotTextBooked: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  bookedInfo: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  durationGrid: {
    gap: 10,
  },
  durationCard: {
    alignItems: 'center',
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  durationCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationCardValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  durationCardValueActive: {
    color: '#fff',
  },
  durationCardDisabled: {
    backgroundColor: colors.line,
    borderColor: colors.line,
    opacity: 0.6,
  },
  durationCardValueDisabled: {
    color: colors.textMuted,
  },
  durationConflictText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  timeRangeCard: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  timeRangeLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  timeRangeDetail: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  timeRangePrice: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  pricePreviewCard: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  pricePreviewLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  pricePreviewDetail: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  pricePreviewValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  summaryCard: {
    backgroundColor: colors.input,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  summaryAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 40,
  },
  summaryAvatarImg: {
    height: 40,
    width: 40,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryWalkerName: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  summaryRatingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  summaryRating: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  summaryDivider: {
    backgroundColor: colors.line,
    height: 1,
  },
  summaryField: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  summaryFieldValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  summaryTotalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryTotalLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  summaryTotalValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  modalFooter: {
    alignItems: 'center',
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexShrink: 0,
  },
  backStepBtn: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backStepBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  nextStepBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  nextStepBtnPressed: {
    opacity: 0.75,
  },
  nextStepBtnDisabled: {
    opacity: 0.4,
  },
  nextStepBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  confirmBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  confirmBtnPressed: {
    opacity: 0.75,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  paypalModalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paypalPollingCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    gap: 14,
    paddingHorizontal: 32,
    paddingVertical: 36,
    alignItems: 'center',
    width: '80%',
  },
  paypalPollingTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  paypalPollingText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  paypalTimer: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  paypalCancelBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  paypalCancelBtnText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
  },
});
