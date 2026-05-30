import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import PatientSearch from '../components/PatientSearch';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const sortByDateDesc = (list) =>
  [...list].sort((a, b) => new Date(b.date) - new Date(a.date));

const truncate = (text, max = 48) => {
  if (!text) return '—';
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const validatePatient = (value) => {
  if (!value) return 'Selecciona un paciente';
  return true;
};

const validateDate = (value) => {
  if (!value) return 'La fecha es obligatoria';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'La fecha no es válida';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return 'La fecha no puede ser futura';
  return true;
};

const validateConsultationReason = (value) => {
  if (!value?.trim()) return 'El motivo de consulta es obligatorio';
  return true;
};

const validateDiagnosis = (value) => {
  if (!value?.trim()) return 'El diagnóstico es obligatorio';
  return true;
};

const validateTreatment = (value) => {
  if (!value?.trim()) return 'El tratamiento es obligatorio';
  return true;
};

const validateNextAppointment = (value) => {
  if (!value?.trim()) return true;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'La fecha no es válida';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date <= today) return 'La próxima cita debe ser una fecha futura';
  return true;
};

export default function Diagnoses() {
  const [patients, setPatients] = useState([]);
  const [filterPatientId, setFilterPatientId] = useState('');
  const [diagnoses, setDiagnoses] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingDiagnoses, setLoadingDiagnoses] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm();

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

  const fetchDiagnoses = useCallback(async (patientFilterId) => {
    setLoadingDiagnoses(true);
    setError('');
    try {
      const params = patientFilterId ? { patient_id: patientFilterId } : {};
      const { data } = await api.get('/diagnoses', { params });
      setDiagnoses(sortByDateDesc(Array.isArray(data) ? data : []));
    } catch (err) {
      setDiagnoses([]);
      setError(err.response?.data?.message || 'No se pudieron cargar los diagnósticos');
    } finally {
      setLoadingDiagnoses(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    fetchDiagnoses('');
  }, [fetchPatients, fetchDiagnoses]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleFilterPatient = (id) => {
    setFilterPatientId(id);
    fetchDiagnoses(id);
  };

  const openCreateModal = () => {
    setFormError('');
    reset({
      patient_id: filterPatientId || '',
      date: getTodayDate(),
      chief_complaint: '',
      diagnosis: '',
      treatment: '',
      medications: '',
      next_appointment: '',
      notes: '',
    });
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (isSubmitting) return;
    setCreateModalOpen(false);
    setFormError('');
    reset();
  };

  const onSubmit = async (data) => {
    setFormError('');
    try {
      await api.post('/diagnoses', {
        patient_id: Number(data.patient_id),
        date: data.date,
        chief_complaint: data.chief_complaint.trim(),
        diagnosis: data.diagnosis.trim(),
        treatment: data.treatment.trim(),
        medications: data.medications?.trim() || null,
        next_appointment: data.next_appointment || null,
        notes: data.notes?.trim() || null,
      });
      closeCreateModal();
      setSuccessMessage('Diagnóstico registrado correctamente');
      await fetchDiagnoses(filterPatientId);
    } catch (err) {
      setFormError(err.response?.data?.message || 'No se pudo registrar el diagnóstico');
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
        badge="Historial clínico"
        title="Diagnósticos"
        subtitle="Registro de consultas, diagnósticos y tratamientos. Busca un paciente para filtrar o crea uno nuevo."
        action={
          <button type="button" className="btn btn--primary" onClick={openCreateModal}>
            + Nuevo diagnóstico
          </button>
        }
      />

      <div className="card search-card">
        <label className="field">
          <span>Buscar paciente</span>
          <PatientSearch
            patients={patients}
            value={filterPatientId}
            onChange={handleFilterPatient}
            disabled={loadingPatients}
            placeholder="Escribe el nombre del paciente..."
          />
        </label>
      </div>

      {(loadingPatients || loadingDiagnoses) && (
        <LoadingState message="Cargando diagnósticos..." />
      )}
      {error && <div className="alert alert--error">{error}</div>}

      {!loadingDiagnoses && !error && (
        <>
          {diagnoses.length === 0 ? (
            <EmptyState
              type="diagnoses"
              title={
                filterPatientId
                  ? 'Sin diagnósticos para este paciente'
                  : 'Sin diagnósticos registrados'
              }
              description={
                filterPatientId
                  ? 'Este paciente aún no tiene historial clínico en el sistema.'
                  : 'Registra el primer diagnóstico clínico con el botón superior.'
              }
            />
          ) : (
            <div className="table-wrap card table-wrap--wide">
              <table className="data-table data-table--diagnoses">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Fecha</th>
                    <th>Motivo de consulta</th>
                    <th>Diagnóstico</th>
                    <th>Tratamiento</th>
                    <th>Medicamentos</th>
                    <th>Próxima cita</th>
                    <th>Doctor</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnoses.map((item) => (
                    <tr key={item.id}>
                      <td>{item.Patient?.name || '—'}</td>
                      <td>{formatDateDDMMYYYY(item.date)}</td>
                      <td className="cell-wrap">{truncate(item.chief_complaint)}</td>
                      <td className="cell-wrap">{truncate(item.diagnosis)}</td>
                      <td className="cell-wrap">{truncate(item.treatment)}</td>
                      <td className="cell-wrap">{truncate(item.medications)}</td>
                      <td>{formatDateDDMMYYYY(item.next_appointment)}</td>
                      <td>{item.doctor?.name || '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => setDetailRecord(item)}
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {createModalOpen && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div
            className="modal modal--form-wide card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2>Nuevo Diagnóstico</h2>
            <form className="modal__form" onSubmit={handleSubmit(onSubmit)} noValidate>
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
                      placeholder="Buscar y seleccionar paciente..."
                      disabled={loadingPatients}
                      error={errors.patient_id?.message}
                    />
                  )}
                />
              </div>

              <label className="field">
                <span>Fecha</span>
                <input
                  type="date"
                  max={getTodayDate()}
                  {...register('date', { validate: validateDate })}
                />
                {errors.date && <p className="field-error">{errors.date.message}</p>}
              </label>

              <label className="field">
                <span>Motivo de consulta</span>
                <textarea
                  rows={2}
                  placeholder="Ej: Dolor de cabeza frecuente"
                  {...register('chief_complaint', { validate: validateConsultationReason })}
                />
                {errors.chief_complaint && (
                  <p className="field-error">{errors.chief_complaint.message}</p>
                )}
              </label>

              <label className="field">
                <span>Diagnóstico</span>
                <textarea
                  rows={3}
                  {...register('diagnosis', { validate: validateDiagnosis })}
                />
                {errors.diagnosis && (
                  <p className="field-error">{errors.diagnosis.message}</p>
                )}
              </label>

              <label className="field">
                <span>Tratamiento</span>
                <textarea
                  rows={3}
                  {...register('treatment', { validate: validateTreatment })}
                />
                {errors.treatment && (
                  <p className="field-error">{errors.treatment.message}</p>
                )}
              </label>

              <label className="field">
                <span>Medicamentos (opcional)</span>
                <textarea rows={2} {...register('medications')} />
              </label>

              <label className="field">
                <span>Próxima cita sugerida (opcional)</span>
                <input
                  type="date"
                  min={getTomorrowDate()}
                  {...register('next_appointment', {
                    validate: validateNextAppointment,
                  })}
                />
                {errors.next_appointment && (
                  <p className="field-error">{errors.next_appointment.message}</p>
                )}
              </label>

              <label className="field">
                <span>Notas adicionales (opcional)</span>
                <textarea rows={2} {...register('notes')} />
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
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailRecord && (
        <div className="modal-overlay" onClick={() => setDetailRecord(null)}>
          <div
            className="modal modal--detail card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="detail-view__header">
              <div>
                <p className="detail-view__label">Paciente</p>
                <h2>{detailRecord.Patient?.name || '—'}</h2>
              </div>
              <div>
                <p className="detail-view__label">Doctor</p>
                <h3 className="detail-view__doctor">{detailRecord.doctor?.name || '—'}</h3>
              </div>
            </div>

            <div className="detail-view__grid">
              <div className="detail-view__item">
                <span>Fecha</span>
                <p>{formatDateDDMMYYYY(detailRecord.date)}</p>
              </div>
              <div className="detail-view__item">
                <span>Próxima cita sugerida</span>
                <p>{formatDateDDMMYYYY(detailRecord.next_appointment)}</p>
              </div>
              <div className="detail-view__item detail-view__item--full">
                <span>Motivo de consulta</span>
                <p>{detailRecord.chief_complaint}</p>
              </div>
              <div className="detail-view__item detail-view__item--full">
                <span>Diagnóstico</span>
                <p>{detailRecord.diagnosis}</p>
              </div>
              <div className="detail-view__item detail-view__item--full">
                <span>Tratamiento</span>
                <p>{detailRecord.treatment}</p>
              </div>
              <div className="detail-view__item detail-view__item--full">
                <span>Medicamentos</span>
                <p>{detailRecord.medications || '—'}</p>
              </div>
              <div className="detail-view__item detail-view__item--full">
                <span>Notas adicionales</span>
                <p>{detailRecord.notes || '—'}</p>
              </div>
            </div>

            <div className="modal__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setDetailRecord(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
