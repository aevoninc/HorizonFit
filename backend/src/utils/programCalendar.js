const DAY_MS = 24 * 60 * 60 * 1000;
export const DAYS_PER_ZONE = 21;
export const TOTAL_PROGRAM_DAYS = 105;
export const TOTAL_PROGRAM_WEEKS = 15;

export const getWeeklySchedule = (programDayNumber, weeklyLogs = [], scheduleComplete = false) => {
  const completedWeeks = Math.min(
    TOTAL_PROGRAM_WEEKS,
    Math.floor(Math.min(programDayNumber || 0, TOTAL_PROGRAM_DAYS) / 7),
  );
  const loggedWeeks = new Set(
    weeklyLogs.map((log) => `${log.zoneNumber}:${log.weekNumber}`),
  );

  return Array.from({ length: completedWeeks }, (_, index) => {
    const zone = Math.floor(index / 3) + 1;
    const week = (index % 3) + 1;
    const isLogged = loggedWeeks.has(`${zone}:${week}`);
    return {
      programWeekNumber: index + 1,
      zone,
      week,
      status: isLogged
        ? "logged"
        : !scheduleComplete && programDayNumber === (index + 1) * 7
          ? "due"
          : "missed",
    };
  });
};

export const isValidTimeZone = (timeZone) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
};

export const getDateKey = (value, timeZone = "UTC") => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};

export const dateKeyToUtcDate = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const getHabitLogDateKey = (log, timeZone = "UTC") => (
  log.scheduledDate
    ? getDateKey(log.scheduledDate, "UTC")
    : getDateKey(log.createdAt || log.date, timeZone)
);

export const getProgramCalendar = (
  programStartDate,
  logs = [],
  referenceDate = new Date(),
  timeZone = "UTC",
) => {
  const start = programStartDate ? new Date(programStartDate) : null;
  if (!start || Number.isNaN(start.getTime())) {
    return {
      started: false,
      programDayNumber: null,
      currentZone: null,
      currentDay: null,
      totalProgramDays: TOTAL_PROGRAM_DAYS,
      todayDate: getDateKey(referenceDate, timeZone),
      todayStatus: "unavailable",
      missedDays: [],
      missedDayCount: 0,
      scheduleComplete: false,
    };
  }

  const startDate = getDateKey(start, timeZone);
  const todayDate =
    typeof referenceDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(referenceDate)
      ? referenceDate
      : getDateKey(referenceDate, timeZone);
  const startDay = dateKeyToUtcDate(startDate).getTime();
  const todayDay = dateKeyToUtcDate(todayDate).getTime();
  const elapsedDays = Math.floor((todayDay - startDay) / DAY_MS) + 1;
  if (elapsedDays < 1) {
    return {
      started: false,
      programDayNumber: 1,
      currentZone: 1,
      currentDay: 1,
      totalProgramDays: TOTAL_PROGRAM_DAYS,
      todayDate,
      startDate,
      todayStatus: "upcoming",
      missedDays: [],
      missedDayCount: 0,
      scheduleComplete: false,
    };
  }

  const programDayNumber = Math.min(elapsedDays, TOTAL_PROGRAM_DAYS);
  const currentZone = Math.floor((programDayNumber - 1) / DAYS_PER_ZONE) + 1;
  const currentDay = ((programDayNumber - 1) % DAYS_PER_ZONE) + 1;
  const loggedDates = new Set(logs.map((log) => getHabitLogDateKey(log, timeZone)));
  const missedDays = [];

  for (let day = 1; day < Math.min(elapsedDays, TOTAL_PROGRAM_DAYS + 1); day += 1) {
    const date = new Date(startDay + (day - 1) * DAY_MS).toISOString().slice(0, 10);
    if (!loggedDates.has(date)) {
      missedDays.push({
        programDayNumber: day,
        zone: Math.floor((day - 1) / DAYS_PER_ZONE) + 1,
        dayInZone: ((day - 1) % DAYS_PER_ZONE) + 1,
        date,
      });
    }
  }

  const todayStatus = elapsedDays > TOTAL_PROGRAM_DAYS
    ? "schedule-complete"
    : loggedDates.has(todayDate) ? "logged" : "in-progress";

  return {
    started: true,
    programDayNumber,
    currentZone,
    currentDay,
    totalProgramDays: TOTAL_PROGRAM_DAYS,
    todayDate,
    startDate,
    todayStatus,
    missedDays,
    missedDayCount: missedDays.length,
    scheduleComplete: elapsedDays > TOTAL_PROGRAM_DAYS,
  };
};
