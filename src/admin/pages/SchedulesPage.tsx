import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useAdmin } from "../contexts/AdminContext";
import { PageHeading, Badge } from "../components/UI";
import { EntityEditor } from "../components/EntityEditor";
import { newEntity } from "../components/editorFields";
import type { Entity, Schedule } from "../types/models";
export function SchedulesPage() {
  const { db, can } = useAdmin();
  const [params, setParams] = useSearchParams();
  const [editor, setEditor] = useState<Entity | null>(null);
  const [view, setView] = useState("Week");
  const [offset, setOffset] = useState(0);
  const [screen, setScreen] = useState("all");
  const current = new Date();
  current.setDate(
    current.getDate() +
      offset * (view === "Day" ? 1 : view === "Week" ? 7 : 30),
  );
  const start = new Date(current);
  if (view === "Week")
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (view === "Month") start.setDate(1);
  const count =
    view === "Day"
      ? 1
      : view === "Week"
        ? 7
        : new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
  const matches = (s: Schedule, d: Date) => {
    const date = d.toLocaleDateString("en-CA");
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    if (screen !== "all" && !s.screenIds.includes(screen)) return false;
    if (date < s.startDate || (s.endDate && date > s.endDate)) return false;
    if (s.repeat === "Never") return date === s.startDate;
    if (s.repeat === "Weekdays") return d.getDay() > 0 && d.getDay() < 6;
    if (s.repeat === "Weekends") return d.getDay() === 0 || d.getDay() === 6;
    if (s.repeat === "Custom" || s.repeat === "Weekly")
      return s.days.includes(weekday);
    return true;
  };
  const activeEditor =
    editor ||
    db.collections.schedules.find((s) => s.id === params.get("edit")) ||
    (params.has("new") ? newEntity("schedules", db) : undefined);
  return (
    <>
      <PageHeading
        eyebrow="CONTENT PLANNING"
        title="Schedules"
        description="Build a rhythm for your displays. All times are Africa/Kampala."
        actions={
          <button
            className="btn primary"
            disabled={!can("schedules")}
            onClick={() => setEditor(newEntity("schedules", db))}
          >
            <Plus size={16} />
            Schedule content
          </button>
        }
      />
      <div className="calendar-toolbar">
        <div>
          <button className="btn" onClick={() => setOffset(0)}>
            Today
          </button>
          <button
            className="icon-button"
            aria-label="Previous period"
            onClick={() => setOffset((o) => o - 1)}
          >
            <ChevronLeft />
          </button>
          <button
            className="icon-button"
            aria-label="Next period"
            onClick={() => setOffset((o) => o + 1)}
          >
            <ChevronRight />
          </button>
          <h2>
            {current.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </h2>
        </div>
        <div>
          <select
            aria-label="Schedule screen"
            value={screen}
            onChange={(e) => setScreen(e.target.value)}
          >
            <option value="all">All screens</option>
            {db.collections.screens.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="tab-buttons">
            {["Day", "Week", "Month"].map((v) => (
              <button
                key={v}
                className={view === v ? "active" : ""}
                onClick={() => {
                  setView(v);
                  setOffset(0);
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={`calendar-grid calendar-${view.toLowerCase()}`}>
        {days.map((day) => (
          <section className="calendar-day" key={day.toISOString()}>
            <header>
              <span>
                {day.toLocaleDateString("en-GB", { weekday: "short" })}
              </span>
              <b
                className={
                  day.toDateString() === new Date().toDateString()
                    ? "today"
                    : ""
                }
              >
                {day.getDate()}
              </b>
            </header>
            <div>
              {(db.collections.schedules as Schedule[])
                .filter((s) => matches(s, day))
                .map((s, i) => (
                  <button
                    key={s.id}
                    className={`calendar-event event-${i % 3}`}
                    onClick={() => setEditor(s)}
                  >
                    <span>
                      {s.startTime} – {s.endTime}
                    </span>
                    <b>{s.name}</b>
                    <small>
                      {s.type} · Priority {s.priority}
                    </small>
                  </button>
                ))}
            </div>
            <button
              className="calendar-add"
              aria-label={`Add schedule ${day.toLocaleDateString()}`}
              disabled={!can("schedules")}
              onClick={() =>
                setEditor({
                  ...newEntity("schedules", db),
                  startDate: day.toLocaleDateString("en-CA"),
                })
              }
            >
              <Plus size={14} />
            </button>
          </section>
        ))}
      </div>
      <div className="form-hint">
        <CalendarDays size={17} />
        Schedules are saved planning rules in this frontend. A future scheduler
        will resolve priorities and deliver timed configurations to remote
        screens.
      </div>
      {activeEditor && can("schedules") && (
        <EntityEditor
          collection="schedules"
          entity={activeEditor}
          onClose={() => {
            setEditor(null);
            setParams({});
          }}
        />
      )}
    </>
  );
}
