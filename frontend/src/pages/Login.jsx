import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { LogoMark } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

const LOCKOUT_MS = 30000;
const MAX_ATTEMPTS = 3;

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

function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.5 10.7A4 4 0 0 0 12 16a4 4 0 0 0 3.9-3.1M6.2 6.2C3.6 8.1 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.7-1.2M14 9.3A4 4 0 0 0 9.7 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  useEffect(() => {
    if (!lockedUntil) return undefined;

    const tick = () => {
      const left = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (left <= 0) {
        setLockedUntil(null);
        setFailedAttempts(0);
        setLockSecondsLeft(0);
        setError('');
      } else {
        setLockSecondsLeft(left);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  if (token) {
    return <Navigate to="/patients" replace />;
  }

  const handleFailedLogin = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    if (nextAttempts >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCKOUT_MS);
      setError('Demasiados intentos fallidos. Espera 30 segundos.');
      return;
    }

    setError('Credenciales inválidas');
  };

  const onSubmit = async (data) => {
    if (isLocked) {
      setError(
        `Demasiados intentos fallidos. Espera ${lockSecondsLeft || 30} segundos.`
      );
      return;
    }

    setError('');
    try {
      const { data: response } = await api.post('/auth/login', {
        email: data.email.trim(),
        password: data.password,
      });
      setFailedAttempts(0);
      login(response.token, response.user);
      navigate('/patients');
    } catch (err) {
      if (!err.response) {
        setError('Error de conexión. Intenta de nuevo.');
        return;
      }

      if (err.response.status === 401) {
        handleFailedLogin();
        return;
      }

      setError(err.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-page">
      <aside className="login-hero" aria-hidden="true">
        <div className="login-hero__content">
          <LogoMark size={48} />
          <h1>MedLife</h1>
          <p>
            Plataforma integral para la gestión de pacientes, historiales clínicos
            y agenda médica de tu centro de salud.
          </p>
          <div className="login-hero__features">
            <span className="login-hero__feature">Expedientes y diagnósticos centralizados</span>
            <span className="login-hero__feature">Agenda de citas en tiempo real</span>
            <span className="login-hero__feature">Acceso seguro para personal médico</span>
          </div>
        </div>
      </aside>

      <div className="login-panel">
        <form className="card login-card" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="login-card__header">
            <LogoMark size={40} />
            <h2>Bienvenido</h2>
            <p className="subtitle">Inicia sesión en tu cuenta clínica</p>
          </div>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            disabled={isSubmitting || isLocked}
            {...register('email', { validate: validateEmail })}
          />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </label>

        <label className="field">
          <span>Contraseña</span>
          <div className="field-password">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isSubmitting || isLocked}
              {...register('password', { validate: validatePassword })}
            />
            <button
              type="button"
              className="field-password__toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}
            >
              <EyeIcon hidden={showPassword} />
            </button>
          </div>
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </label>

        {error && <p className="error login-error">{error}</p>}

        <button
          type="submit"
          className="btn btn--primary login-submit"
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
          }}
          disabled={isSubmitting || isLocked}
        >
          {isSubmitting && <span className="btn__spinner" aria-hidden="true" />}
          {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
        </form>
      </div>
    </div>
  );
}
