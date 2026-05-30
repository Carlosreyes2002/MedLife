import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const getMinDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const formatDateDDMMYYYY = (dateStr) => {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const calculateAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

const validateName = (value) => {
  if (!value?.trim()) return 'El nombre es obligatorio';
  return true;
};

const validateDob = (value) => {
  if (!value) return 'La fecha de nacimiento es obligatoria';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'La fecha no es válida';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return 'La fecha no puede ser futura';
  return true;
};

const validatePhone = (value) => {
  if (!value?.trim()) return true;
  const digits = value.replace(/\s/g, '');
  if (!/^\d+$/.test(digits)) return 'El teléfono solo debe contener números';
  return true;
};

const validateEmail = (value) => {
  if (!value?.trim()) return true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return 'El email no tiene un formato válido';
  }
  return true;
};

const validateConsultationReason = (value) => {
  if (!value?.trim()) return 'El motivo de consulta es obligatorio';
  return true;
};

const validateDiagnosisText = (value) => {
  if (!value?.trim()) return 'El diagnóstico es obligatorio';
  return true;
};

const validateTreatment = (value) => {
  if (!value?.trim()) return 'El tratamiento es obligatorio';
  return true;
};

const validateDiagnosisDate = (value) => {
  if (!value) return 'La fecha es obligatoria';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'La fecha no es válida';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return 'No se permiten fechas futuras';
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

const sortByDateDesc = (list) =>
  [...list].sort((a, b) => new Date(b.date) - new Date(a.date));

const sortByDateAsc = (list) =>
  [...list].sort((a, b) => new Date(a.date) - new Date(b.date));

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const [formModal, setFormModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');

  const [detailPatient, setDetailPatient] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingDiagnoses, setLoadingDiagnoses] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [subModal, setSubModal] = useState(null);
  const [subFormError, setSubFormError] = useState('');

  const patientForm = useForm();
  const diagnosisForm = useForm();
  const appointmentForm = useForm();

  const {
    register: registerPatient,
    handleSubmit: handlePatientSubmit,
    reset: resetPatient,
    formState: { errors: patientErrors, isSubmitting: isPatientSubmitting },
  } = patientForm;

  const {
    register: registerDiagnosis,
    handleSubmit: handleDiagnosisSubmit,
    reset: resetDiagnosis,
    formState: { errors: diagnosisErrors, isSubmitting: isDiagnosisSubmitting },
  } = diagnosisForm;

  const {
    register: registerAppointment,
    handleSubmit: handleAppointmentSubmit,
    reset: resetAppointment,
    formState: { errors: appointmentErrors, isSubmitting: isAppointmentSubmitting },
  } = appointmentForm;

  const fetchPatients = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/patients');
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los pacientes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatientDiagnoses = useCallback(async (patientId) => {
    setLoadingDiagnoses(true);
    setDetailError('');
    try {
      const { data } = await api.get(`/diagnoses/patient/${patientId}`);
      setDiagnoses(sortByDateDesc(data));
    } catch (err) {
      setDiagnoses([]);
      setDetailError(err.response?.data?.message || 'No se pudieron cargar los diagnósticos');
    } finally {
      setLoadingDiagnoses(false);
    }
  }, []);

  const fetchPatientAppointments = useCallback(async (patientId) => {
    setLoadingAppointments(true);
    setDetailError('');
    try {
      const { data } = await api.get('/appointments', {
        params: { patient_id: patientId },
      });
      setAppointments(sortByDateAsc(data));
    } catch (err) {
      setAppointments([]);
      setDetailError(err.response?.data?.message || 'No se pudieron cargar las citas');
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormModal('create');
    setFormError('');
    resetPatient({ name: '', dob: '', phone: '', address: '', email: '' });
  };

  const openEditModal = (patient) => {
    setEditingId(patient.id);
    setFormModal('edit');
    setFormError('');
    resetPatient({
      name: patient.name,
      dob: patient.dob,
      phone: patient.phone || '',
      address: patient.address || '',
      email: patient.email || '',
    });
  };

  const closeFormModal = () => {
    if (isPatientSubmitting) return;
    setFormModal(null);
    setEditingId(null);
    setFormError('');
    resetPatient();
  };

  const onPatientSubmit = async (data) => {
    setFormError('');
    const payload = {
      name: data.name.trim(),
      dob: data.dob,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      email: data.email?.trim() || null,
    };

    try {
      if (editingId) {
        await api.put(`/patients/${editingId}`, payload);
        setSuccessMessage('Paciente actualizado correctamente');
      } else {
        await api.post('/patients', payload);
        setSuccessMessage('Paciente creado correctamente');
      }
      closeFormModal();
      await fetchPatients();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          `No se pudo ${editingId ? 'actualizar' : 'crear'} el paciente`
      );
    }
  };

  const handleDelete = async (patient) => {
    const confirmed = window.confirm(
      `¿Estás seguro que deseas eliminar a ${patient.name}?`
    );
    if (!confirmed) return;

    setDeletingId(patient.id);
    setError('');
    try {
      await api.delete(`/patients/${patient.id}`);
      setSuccessMessage('Paciente eliminado correctamente');
      if (detailPatient?.id === patient.id) {
        setDetailPatient(null);
      }
      await fetchPatients();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar el paciente');
    } finally {
      setDeletingId(null);
    }
  };

  const openDetailModal = async (patient) => {
    setDetailPatient(patient);
    setDetailError('');
    setSubModal(null);
    await Promise.all([
      fetchPatientDiagnoses(patient.id),
      fetchPatientAppointments(patient.id),
    ]);
  };

  const closeDetailModal = () => {
    if (isDiagnosisSubmitting || isAppointmentSubmitting) return;
    setDetailPatient(null);
    setDiagnoses([]);
    setAppointments([]);
    setSubModal(null);
    setDetailError('');
    resetDiagnosis();
    resetAppointment();
  };

  const openDiagnosisSubModal = () => {
    setSubFormError('');
    resetDiagnosis({
      chief_complaint: '',
      diagnosis: '',
      treatment: '',
      date: getTodayDate(),
    });
    setSubModal('diagnosis');
  };

  const openAppointmentSubModal = () => {
    setSubFormError('');
    resetAppointment({ date: '', reason: '' });
    setSubModal('appointment');
  };

  const closeSubModal = () => {
    if (isDiagnosisSubmitting || isAppointmentSubmitting) return;
    setSubModal(null);
    setSubFormError('');
    resetDiagnosis();
    resetAppointment();
  };

  const onDiagnosisSubmit = async (data) => {
    if (!detailPatient) return;
    setSubFormError('');
    try {
      await api.post('/diagnoses', {
        patient_id: detailPatient.id,
        chief_complaint: data.chief_complaint.trim(),
        diagnosis: data.diagnosis.trim(),
        treatment: data.treatment.trim(),
        date: data.date,
      });
      closeSubModal();
      await fetchPatientDiagnoses(detailPatient.id);
      setSuccessMessage('Diagnóstico agregado correctamente');
    } catch (err) {
      setSubFormError(err.response?.data?.message || 'No se pudo crear el diagnóstico');
    }
  };

  const onAppointmentSubmit = async (data) => {
    if (!detailPatient) return;
    setSubFormError('');
    try {
      await api.post('/appointments', {
        patient_id: detailPatient.id,
        date: new Date(data.date).toISOString(),
        reason: data.reason.trim(),
      });
      closeSubModal();
      await fetchPatientAppointments(detailPatient.id);
      setSuccessMessage('Cita agendada correctamente');
    } catch (err) {
      setSubFormError(err.response?.data?.message || 'No se pudo agendar la cita');
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
        badge="Expedientes"
        title="Pacientes"
        subtitle="Gestiona el registro de pacientes. Desde el detalle puedes agregar diagnósticos y agendar citas."
        action={
          <button type="button" className="btn btn--primary" onClick={openCreateModal}>
            + Nuevo paciente
          </button>
        }
      />

      {!loading && patients.length > 0 && (
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-card__label">Total registrados</span>
            <span className="stat-card__value">{patients.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Con email</span>
            <span className="stat-card__value">
              {patients.filter((p) => p.email).length}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Con teléfono</span>
            <span className="stat-card__value">
              {patients.filter((p) => p.phone).length}
            </span>
          </div>
        </div>
      )}

      {loading && <LoadingState message="Cargando pacientes..." />}
      {error && <div className="alert alert--error">{error}</div>}

      {!loading && (
        <>
          {patients.length === 0 ? (
            <EmptyState
              type="patients"
              title="Sin pacientes registrados"
              description="Comienza agregando el primer paciente al sistema clínico."
            />
          ) : (
            <div className="table-wrap card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Fecha de nacimiento</th>
                    <th>Edad</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => {
                    const age = calculateAge(patient.dob);
                    return (
                      <tr key={patient.id}>
                        <td>{patient.name}</td>
                        <td>{formatDateDDMMYYYY(patient.dob)}</td>
                        <td>{age !== null ? `${age} años` : '—'}</td>
                        <td>{patient.phone || '—'}</td>
                        <td>{patient.email || '—'}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => openDetailModal(patient)}
                            >
                              Ver Detalle
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => openEditModal(patient)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              disabled={deletingId === patient.id}
                              onClick={() => handleDelete(patient)}
                            >
                              {deletingId === patient.id ? 'Eliminando...' : 'Eliminar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {formModal && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div
            className="modal card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2>{formModal === 'edit' ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
            <form
              className="modal__form"
              onSubmit={handlePatientSubmit(onPatientSubmit)}
              noValidate
            >
              <label className="field">
                <span>Nombre</span>
                <input type="text" {...registerPatient('name', { validate: validateName })} />
                {patientErrors.name && (
                  <p className="field-error">{patientErrors.name.message}</p>
                )}
              </label>
              <label className="field">
                <span>Fecha de nacimiento</span>
                <input
                  type="date"
                  max={getTodayDate()}
                  {...registerPatient('dob', { validate: validateDob })}
                />
                {patientErrors.dob && (
                  <p className="field-error">{patientErrors.dob.message}</p>
                )}
              </label>
              <label className="field">
                <span>Teléfono</span>
                <input type="tel" {...registerPatient('phone', { validate: validatePhone })} />
                {patientErrors.phone && (
                  <p className="field-error">{patientErrors.phone.message}</p>
                )}
              </label>
              <label className="field">
                <span>Dirección</span>
                <input type="text" {...registerPatient('address')} />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  {...registerPatient('email', { validate: validateEmail })}
                />
                {patientErrors.email && (
                  <p className="field-error">{patientErrors.email.message}</p>
                )}
              </label>
              {formError && <p className="error">{formError}</p>}
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={closeFormModal}
                  disabled={isPatientSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isPatientSubmitting}
                >
                  {isPatientSubmitting && <span className="btn__spinner" aria-hidden="true" />}
                  {isPatientSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailPatient && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div
            className="modal modal--detail card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2>{detailPatient.name}</h2>
            <p className="muted detail-modal__label">Perfil del paciente</p>
            <div className="detail-info">
              <p><span>Nombre:</span> {detailPatient.name}</p>
              <p><span>Fecha de nacimiento:</span> {formatDateDDMMYYYY(detailPatient.dob)}</p>
              <p>
                <span>Edad:</span>{' '}
                {calculateAge(detailPatient.dob) !== null
                  ? `${calculateAge(detailPatient.dob)} años`
                  : '—'}
              </p>
              <p><span>Teléfono:</span> {detailPatient.phone || '—'}</p>
              <p><span>Dirección:</span> {detailPatient.address || '—'}</p>
              <p><span>Email:</span> {detailPatient.email || '—'}</p>
            </div>

            {detailError && <p className="error">{detailError}</p>}

            <section className="detail-section">
              <div className="detail-section__header">
                <h3>Diagnósticos</h3>
                <button type="button" className="btn btn--primary btn--sm" onClick={openDiagnosisSubModal}>
                  Agregar Diagnóstico
                </button>
              </div>
              {loadingDiagnoses && <p className="muted">Cargando diagnósticos...</p>}
              {!loadingDiagnoses && diagnoses.length === 0 && (
                <p className="muted">Este paciente no tiene diagnósticos registrados.</p>
              )}
              <div className="detail-list">
                {diagnoses.map((diagnosis) => (
                  <article key={diagnosis.id} className="detail-item card">
                    <p className="detail-item__date">{formatDateDDMMYYYY(diagnosis.date)}</p>
                    <p><span>Motivo:</span> {diagnosis.chief_complaint}</p>
                    <p><span>Diagnóstico:</span> {diagnosis.diagnosis}</p>
                    <p><span>Tratamiento:</span> {diagnosis.treatment}</p>
                    <p><span>Doctor:</span> {diagnosis.doctor?.name || '—'}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="detail-section">
              <div className="detail-section__header">
                <h3>Citas</h3>
                <button type="button" className="btn btn--primary btn--sm" onClick={openAppointmentSubModal}>
                  Agendar Cita
                </button>
              </div>
              {loadingAppointments && <p className="muted">Cargando citas...</p>}
              {!loadingAppointments && appointments.length === 0 && (
                <p className="muted">Este paciente no tiene citas registradas.</p>
              )}
              <div className="detail-list">
                {appointments.map((appointment) => (
                  <article key={appointment.id} className="detail-item card">
                    <p className="detail-item__date">
                      {new Date(appointment.date).toLocaleString()}
                    </p>
                    <p>{appointment.reason || '—'}</p>
                    <p><span>Doctor:</span> {appointment.doctor?.name || '—'}</p>
                    <span className={`badge badge--${appointment.status}`}>
                      {appointment.status}
                    </span>
                  </article>
                ))}
              </div>
            </section>

            <div className="modal__actions">
              <button type="button" className="btn btn--ghost" onClick={closeDetailModal}>
                Cerrar
              </button>
            </div>

            {subModal === 'diagnosis' && (
              <div className="submodal-overlay" onClick={closeSubModal}>
                <div className="submodal card" onClick={(e) => e.stopPropagation()}>
                  <h3>Nuevo Diagnóstico</h3>
                  <form
                    className="modal__form"
                    onSubmit={handleDiagnosisSubmit(onDiagnosisSubmit)}
                    noValidate
                  >
                    <label className="field">
                      <span>Motivo de consulta</span>
                      <textarea
                        rows={2}
                        {...registerDiagnosis('chief_complaint', {
                          validate: validateConsultationReason,
                        })}
                      />
                      {diagnosisErrors.chief_complaint && (
                        <p className="field-error">
                          {diagnosisErrors.chief_complaint.message}
                        </p>
                      )}
                    </label>
                    <label className="field">
                      <span>Diagnóstico</span>
                      <textarea
                        rows={3}
                        {...registerDiagnosis('diagnosis', { validate: validateDiagnosisText })}
                      />
                      {diagnosisErrors.diagnosis && (
                        <p className="field-error">{diagnosisErrors.diagnosis.message}</p>
                      )}
                    </label>
                    <label className="field">
                      <span>Tratamiento</span>
                      <textarea rows={3} {...registerDiagnosis('treatment', { validate: validateTreatment })} />
                      {diagnosisErrors.treatment && (
                        <p className="field-error">{diagnosisErrors.treatment.message}</p>
                      )}
                    </label>
                    <label className="field">
                      <span>Fecha</span>
                      <input
                        type="date"
                        max={getTodayDate()}
                        {...registerDiagnosis('date', { validate: validateDiagnosisDate })}
                      />
                      {diagnosisErrors.date && (
                        <p className="field-error">{diagnosisErrors.date.message}</p>
                      )}
                    </label>
                    {subFormError && <p className="error">{subFormError}</p>}
                    <div className="modal__actions">
                      <button type="button" className="btn btn--ghost" onClick={closeSubModal} disabled={isDiagnosisSubmitting}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn--primary" disabled={isDiagnosisSubmitting}>
                        {isDiagnosisSubmitting && <span className="btn__spinner" aria-hidden="true" />}
                        {isDiagnosisSubmitting ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {subModal === 'appointment' && (
              <div className="submodal-overlay" onClick={closeSubModal}>
                <div className="submodal card" onClick={(e) => e.stopPropagation()}>
                  <h3>Agendar Cita</h3>
                  <form
                    className="modal__form"
                    onSubmit={handleAppointmentSubmit(onAppointmentSubmit)}
                    noValidate
                  >
                    <label className="field">
                      <span>Fecha y hora</span>
                      <input
                        type="datetime-local"
                        min={getMinDateTimeLocal()}
                        {...registerAppointment('date', { validate: validateAppointmentDate })}
                      />
                      {appointmentErrors.date && (
                        <p className="field-error">{appointmentErrors.date.message}</p>
                      )}
                    </label>
                    <label className="field">
                      <span>Motivo</span>
                      <textarea rows={3} {...registerAppointment('reason', { validate: validateReason })} />
                      {appointmentErrors.reason && (
                        <p className="field-error">{appointmentErrors.reason.message}</p>
                      )}
                    </label>
                    {subFormError && <p className="error">{subFormError}</p>}
                    <div className="modal__actions">
                      <button type="button" className="btn btn--ghost" onClick={closeSubModal} disabled={isAppointmentSubmitting}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn--primary" disabled={isAppointmentSubmitting}>
                        {isAppointmentSubmitting && <span className="btn__spinner" aria-hidden="true" />}
                        {isAppointmentSubmitting ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
