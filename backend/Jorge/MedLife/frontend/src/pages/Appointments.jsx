import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import api from '../api/axios';
import AppointmentCalendar from '../components/AppointmentCalendar';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import PatientSearch from '../components/PatientSearch';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Programada' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
];

const STATUS_LABELS = {
  scheduled: 'Programada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const sortByDateAsc = (list) =>
  [...list].sort((a, b) => new Date(a.date) - new Date(b.date));

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getMinDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const getDateTimeLocalFromDate = (date, hour = 9, minute = 0) => {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const formatDayTitle = (date) =>
  date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

const validatePatient = (value) => {
  if (!value) return 'Selecciona un paciente';
  return true;
};

const validateAppointmentDate = (value) => {
  if (!value) return 'La fecha y hora son obligatorias';
  const selected = new Date(value);
  if (Number.isNaN(selected.getTime())) return 'La fecha no es válida';
  if (selected < new Date()) return 'No se permiten fechas pasadas';
  return true;
};

const validateReason = (value) => {
  if (!value?.trim()) return 'El motivo es obligatorio';
  return true;
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [statusEditId, setStatusEditId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm();

  const fetchAppointments = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/appointments');
      setAppointments(sortByDateAsc(Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar las citas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const { data } = await api.get('/patients');
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los pacientes');
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [fetchAppointments, fetchPatients]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const dayAppointments = useMemo(
    () =>
      sortByDateAsc(
        appointments.filter((apt) => isSameDay(new Date(apt.date), selectedDate))
      ),
    [appointments, selectedDate]
  );

  const openCreateModal = (prefillDate = selectedDate) => {
    setFormError('');
    reset({
      patient_id: '',
      date: getDateTimeLocalFromDate(prefillDate),
      reason: '',
    });
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (isSubmitting) return;
    setCreateModalOpen(false);
    setFormError('');
    reset();
  };

  const onCreateSubmit = async (data) => {
    setFormError('');
    try {
      await api.post('/appointments', {
        patient_id: Number(data.patient_id),
        date: new Date(data.date).toISOString(),
        reason: data.reason.trim(),
      });
      closeCreateModal();
      setSuccessMessage('Cita agendada correctamente');
      await fetchAppointments();
    } catch (err) {
      setFormError(err.response?.data?.message || 'No se pudo agendar la cita');
    }
  };

  const startStatusChange = (appointment) => {
    setStatusEditId(appointment.id);
    setPendingStatus(appointment.status);
  };

  const cancelStatusChange = () => {
    setStatusEditId(null);
    setPendingStatus('');
  };

  const confirmStatusChange = async (id) => {
    setUpdatingStatusId(id);
    setError('');
    try {
      await api.patch(`/appointments/${id}/status`, { status: pendingStatus });
      setStatusEditId(null);
      setPendingStatus('');
      await fetchAppointments();
      setSuccessMessage('Estado actualizado');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el estado');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <main className="page">
      {successMessage && (
        <div className="toast toast--success" role="status">
          {successMessage}
        </div>
      )}

      <PageHeader
        badge="Agenda"
        title="Citas médicas"
        subtitle="Visualiza las citas en el calendario, consulta el detalle por día y agenda nuevas citas para pacientes registrados."
        action={
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => openCreateModal()}
            disabled={loadingPatients}
          >
            + Nueva cita
          </button>
        }
      />

      {!loading && appointments.length > 0 && (
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-card__label">Total</span>
            <span className="stat-card__value">{appointments.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Programadas</span>
            <span className="stat-card__value">
              {appointments.filter((a) => a.status === 'scheduled').length}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Completadas</span>
            <span className="stat-card__value">
              {appointments.filter((a) => a.status === 'completed').length}
            </span>
          </div>
        </div>
      )}

      {loading && <LoadingState message="Cargando citas..." />}
      {error && <div className="alert alert--error">{error}</div>}

      {!loading && (
        <div className="appointments-layout">
          <AppointmentCalendar
            viewDate={viewDate}
            onViewDateChange={setViewDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            appointments={appointments}
          />

          <section className="appointments-day card">
            <header className="appointments-day__header">
              <div>
                <p className="appointments-day__label">Día seleccionado</p>
                <h2 className="appointments-day__title">{formatDayTitle(selectedDate)}</h2>
              </div>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => openCreateModal(selectedDate)}
                disabled={loadingPatients}
              >
                Agendar aquí
              </button>
            </header>

            {dayAppointments.length === 0 ? (
              <EmptyState
                type="appointments"
                title="Sin citas este día"
                description="No hay citas programadas. Usa «Agendar aquí» o el botón «Nueva cita»."
              />
            ) : (
              <ul className="appointments-day__list">
                {dayAppointments.map((appointment) => (
                  <li key={appointment.id} className="appointment-card">
                    <div className="appointment-card__time">{formatTime(appointment.date)}</div>
                    <div className="appointment-card__body">
                      <p className="appointment-card__patient">
                        {appointment.Patient?.name || 'Paciente'}
                      </p>
                      <p className="appointment-card__reason">{appointment.reason || '—'}</p>
                      <p className="appointment-card__doctor">
                        Dr. {appointment.doctor?.name || '—'}
                      </p>
                      <span className={`badge badge--${appointment.status}`}>
                        {STATUS_LABELS[appointment.status] || appointment.status}
                      </span>

                      {statusEditId === appointment.id ? (
                        <div className="appointment-card__status-edit">
                          <select
                            className="status-editor__select"
                            value={pendingStatus}
                            onChange={(e) => setPendingStatus(e.target.value)}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn btn--primary btn--sm"
                              disabled={updatingStatusId === appointment.id}
                              onClick={() => confirmStatusChange(appointment.id)}
                            >
                              {updatingStatusId === appointment.id ? 'Guardando...' : 'Confirmar'}
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              disabled={updatingStatusId === appointment.id}
                              onClick={cancelStatusChange}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm appointment-card__action"
                          onClick={() => startStatusChange(appointment)}
                        >
                          Cambiar estado
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {createModalOpen && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div
            className="modal card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-appointment-title"
          >
            <h2 id="create-appointment-title">Nueva cita</h2>
            <form className="modal__form" onSubmit={handleSubmit(onCreateSubmit)} noValidate>
              <div className="field">
                <span>Paciente</span>
                <Controller
                  name="patient_id"
                  control={control}
                  rules={{ validate: validatePatient }}
                  render={({ field }) => (
                    <PatientSearch
                      patients={patients}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Buscar paciente registrado..."
                      disabled={loadingPatients}
                      error={errors.patient_id?.message}
                    />
                  )}
                />
              </div>

              <label className="field">
                <span>Fecha y hora</span>
                <input
                  type="datetime-local"
                  min={getMinDateTimeLocal()}
                  {...register('date', { validate: validateAppointmentDate })}
                />
                {errors.date && <p className="field-error">{errors.date.message}</p>}
              </label>

              <label className="field">
                <span>Motivo de la cita</span>
                <textarea
                  rows={3}
                  placeholder="Ej: Control de rutina, seguimiento de tratamiento..."
                  {...register('reason', { validate: validateReason })}
                />
                {errors.reason && <p className="field-error">{errors.reason.message}</p>}
              </label>

              {formError && <p className="error">{formError}</p>}

              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={closeCreateModal}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                  {isSubmitting && <span className="btn__spinner" aria-hidden="true" />}
                  {isSubmitting ? 'Guardando...' : 'Agendar cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
