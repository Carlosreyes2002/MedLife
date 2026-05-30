import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import { ROLE_LABELS, ROLE_OPTIONS } from '../constants/roles';
import { useAuth } from '../context/AuthContext';

const validateName = (value) => {
  if (!value?.trim()) return 'El nombre es obligatorio';
  return true;
};

const validateEmail = (value) => {
  if (!value?.trim()) return 'El email es obligatorio';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return 'El email no tiene un formato válido';
  }
  return true;
};

const validatePassword = (value) => {
  if (!value?.trim()) return 'La contraseña es obligatoria';
  return true;
};

const validateRole = (value) => {
  if (!value) return 'Selecciona un rol';
  return true;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'doctor',
    },
  });

  const fetchUsers = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setError('No tienes permiso para ver los usuarios del sistema');
      } else {
        setError(err.response?.data?.message || 'No se pudieron cargar los usuarios');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const openCreateModal = () => {
    setFormError('');
    reset({ name: '', email: '', password: '', role: 'doctor' });
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
      await api.post('/users', {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        role: data.role,
      });
      closeCreateModal();
      setSuccessMessage('Usuario creado correctamente');
      await fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'No se pudo crear el usuario');
    }
  };

  const handleDelete = async (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      setError('No puedes eliminar tu propia cuenta');
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar a ${targetUser.name} (${ROLE_LABELS[targetUser.role] || targetUser.role})? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(targetUser.id);
    setError('');
    try {
      await api.delete(`/users/${targetUser.id}`);
      setSuccessMessage('Usuario eliminado correctamente');
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar el usuario');
    } finally {
      setDeletingId(null);
    }
  };

  const doctorCount = users.filter((u) => u.role === 'doctor').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <main className="page">
      {successMessage && (
        <div className="toast toast--success" role="status">
          {successMessage}
        </div>
      )}

      <div className="admin-banner" role="note">
        Solo los administradores pueden crear y eliminar usuarios del sistema.
      </div>

      <PageHeader
        badge="Administración"
        title="Usuarios del sistema"
        subtitle="Gestiona las cuentas del personal: crea médicos o administradores y elimina usuarios que ya no necesiten acceso."
        action={
          <button type="button" className="btn btn--primary" onClick={openCreateModal}>
            + Nuevo usuario
          </button>
        }
      />

      {!loading && users.length > 0 && (
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-card__label">Total usuarios</span>
            <span className="stat-card__value">{users.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Médicos</span>
            <span className="stat-card__value">{doctorCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Administradores</span>
            <span className="stat-card__value">{adminCount}</span>
          </div>
        </div>
      )}

      {loading && <LoadingState message="Cargando usuarios..." />}
      {error && <div className="alert alert--error">{error}</div>}

      {!loading && !error && (
        <>
          {users.length === 0 ? (
            <EmptyState
              type="default"
              title="Sin usuarios adicionales"
              description="Crea el primer médico o administrador con el botón «Nuevo usuario»."
            />
          ) : (
            <div className="table-wrap card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Registrado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    return (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-badge--${user.role}`}>
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        {isSelf ? (
                          <span className="muted users-table__self">Tu cuenta</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            disabled={deletingId === user.id}
                            onClick={() => handleDelete(user)}
                          >
                            {deletingId === user.id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        )}
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

      {createModalOpen && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div
            className="modal card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title"
          >
            <h2 id="create-user-title">Nuevo usuario</h2>
            <form className="modal__form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <label className="field">
                <span>Nombre completo</span>
                <input type="text" {...register('name', { validate: validateName })} />
                {errors.name && <p className="field-error">{errors.name.message}</p>}
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="off"
                  {...register('email', { validate: validateEmail })}
                />
                {errors.email && <p className="field-error">{errors.email.message}</p>}
              </label>

              <label className="field">
                <span>Contraseña</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...register('password', { validate: validatePassword })}
                />
                {errors.password && (
                  <p className="field-error">{errors.password.message}</p>
                )}
              </label>

              <label className="field">
                <span>Rol</span>
                <select {...register('role', { validate: validateRole })}>
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.role && <p className="field-error">{errors.role.message}</p>}
              </label>

              <p className="field-hint">
                Los médicos pueden gestionar pacientes, citas y diagnósticos. Los administradores
                además pueden crear usuarios.
              </p>

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
                  {isSubmitting ? 'Guardando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
