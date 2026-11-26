import test from "node:test";
import assert from "node:assert/strict";
import { getProgramCalendar, getWeeklySchedule } from "../utils/programCalendar.js";

test("calendar advances to today's program day and lists missed dates", () => {
  const calendar = getProgramCalendar(
    "2026-11-23T00:00:00.000Z",
    [{ date: "2026-11-23T00:00:00.000Z" }],
    "2026-11-26T12:00:00.000Z",
  );

  assert.equal(calendar.programDayNumber, 4);
  assert.equal(calendar.currentZone, 1);
  assert.equal(calendar.currentDay, 4);
  assert.deepEqual(calendar.missedDays.map((day) => day.date), [
    "2026-11-24",
    "2026-11-25",
  ]);
  assert.equal(calendar.todayStatus, "in-progress");
});

test("calendar moves to the next zone after each 21 scheduled days", () => {
  const calendar = getProgramCalendar(
    "2026-11-01T00:00:00.000Z",
    [],
    "2026-11-22T12:00:00.000Z",
  );

  assert.equal(calendar.programDayNumber, 22);
  assert.equal(calendar.currentZone, 2);
  assert.equal(calendar.currentDay, 1);
});

test("calendar follows the patient's local date boundary", () => {
  const calendar = getProgramCalendar(
    "2026-11-25T20:00:00.000Z",
    [],
    "2026-11-26T01:00:00.000Z",
    "Asia/Kolkata",
  );

  assert.equal(calendar.programDayNumber, 1);
  assert.equal(calendar.todayDate, "2026-11-26");
});

test("calendar associates a log with its local day using the submission timestamp", () => {
  const calendar = getProgramCalendar(
    "2026-11-25T20:00:00.000Z",
    [{
      date: "2026-11-25T00:00:00.000Z",
      createdAt: "2026-11-25T20:30:00.000Z",
    }],
    "2026-11-26T01:00:00.000Z",
    "Asia/Kolkata",
  );

  assert.equal(calendar.todayStatus, "logged");
  assert.equal(calendar.missedDayCount, 0);
});

test("calendar removes a made-up scheduled day from missed days", () => {
  const calendar = getProgramCalendar(
    "2026-11-23T00:00:00.000Z",
    [{
      date: "2026-11-23T00:00:00.000Z",
      scheduledDate: "2026-11-23T00:00:00.000Z",
      createdAt: "2026-11-23T00:30:00.000Z",
    }, {
      date: "2026-11-24T00:00:00.000Z",
      scheduledDate: "2026-11-24T00:00:00.000Z",
      createdAt: "2026-11-26T10:00:00.000Z",
    }],
    "2026-11-26T12:00:00.000Z",
  );

  assert.deepEqual(calendar.missedDays.map((day) => day.date), ["2026-11-25"]);
});

test("weekly schedule returns overdue reports by zone and week", () => {
  const missed = getWeeklySchedule(16, [
    { zoneNumber: 1, weekNumber: 1 },
    { zoneNumber: 2, weekNumber: 1 },
  ]);

  assert.deepEqual(missed.filter((week) => week.status === "missed"), [
    { programWeekNumber: 2, zone: 1, week: 2, status: "missed" },
  ]);
});

test("weekly reports due today are not marked missed until the next day", () => {
  const dueToday = getWeeklySchedule(7, []);
  const overdueTomorrow = getWeeklySchedule(8, []);

  assert.equal(dueToday[0].status, "due");
  assert.equal(overdueTomorrow[0].status, "missed");
});

test("calendar marks the schedule complete after day 105 without treating it as graduation", () => {
  const calendar = getProgramCalendar(
    "2026-08-14T00:00:00.000Z",
    [],
    "2026-11-27T12:00:00.000Z",
  );

  assert.equal(calendar.programDayNumber, 105);
  assert.equal(calendar.currentZone, 5);
  assert.equal(calendar.currentDay, 21);
  assert.equal(calendar.scheduleComplete, true);
  assert.equal(calendar.missedDayCount, 105);
});
