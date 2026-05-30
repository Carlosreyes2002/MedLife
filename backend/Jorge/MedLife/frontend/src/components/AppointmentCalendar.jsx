const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function buildCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const lastOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastOfMonth.getDate();

  let startWeekday = new Date(year, month, 1).getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;

  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const days = [];

  for (let cell = 0; cell < totalCells; cell += 1) {
    const dayNum = cell - startWeekday + 1;
    days.push({
      date: new Date(year, month, dayNum),
      inMonth: dayNum >= 1 && dayNum <= daysInMonth,
    });
  }

  return days;
}

function groupAppointmentsByDay(appointments) {
  const map = {};
  appointments.forEach((apt) => {
    const key = toDateKey(new Date(apt.date));
    if (!map[key]) map[key] = [];
    map[key].push(apt);
  });
  return map;
}

export default function AppointmentCalendar({
  viewDate,
  onViewDateChange,
  selectedDate,
  onSelectDate,
  appointments,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = buildCalendarDays(viewDate);
  const byDay = groupAppointmentsByDay(appointments);

  const goMonth = (delta) => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + delta);
    onViewDateChange(next);
  };

  const goToday = () => {
    const now = new Date();
    onViewDateChange(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectDate(now);
  };

  return (
    <div className="appointment-calendar card">
      <div className="appointment-calendar__header">
        <button
          type="button"
          className="appointment-calendar__nav"
          onClick={() => goMonth(-1)}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <h2 className="appointment-calendar__title">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h2>
        <button
          type="button"
          className="appointment-calendar__nav"
          onClick={() => goMonth(1)}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <button type="button" className="btn btn--ghost btn--sm appointment-calendar__today" onClick={goToday}>
        Hoy
      </button>

      <div className="appointment-calendar__weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="appointment-calendar__grid">
        {days.map(({ date, inMonth }) => {
          const key = toDateKey(date);
          const dayAppointments = byDay[key] || [];
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);

          return (
            <button
              key={key + (inMonth ? '' : '-pad')}
              type="button"
              className={[
                'appointment-calendar__day',
                !inMonth && 'appointment-calendar__day--muted',
                isToday && 'appointment-calendar__day--today',
                isSelected && 'appointment-calendar__day--selected',
                dayAppointments.length > 0 && 'appointment-calendar__day--has-events',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(new Date(date))}
            >
              <span className="appointment-calendar__day-num">{date.getDate()}</span>
              {dayAppointments.length > 0 && (
                <span className="appointment-calendar__dots" aria-hidden="true">
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <span
                      key={apt.id}
                      className={`appointment-calendar__dot appointment-calendar__dot--${apt.status}`}
                    />
                  ))}
                </span>
              )}
              {dayAppointments.length > 0 && (
                <span className="appointment-calendar__count">{dayAppointments.length}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="appointment-calendar__legend">
        <span><i className="appointment-calendar__dot appointment-calendar__dot--scheduled" /> Programada</span>
        <span><i className="appointment-calendar__dot appointment-calendar__dot--completed" /> Completada</span>
        <span><i className="appointment-calendar__dot appointment-calendar__dot--cancelled" /> Cancelada</span>
      </div>
    </div>
  );
}
