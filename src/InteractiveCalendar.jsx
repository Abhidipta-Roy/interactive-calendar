import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800&q=80",
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&q=80",
  "https://images.unsplash.com/photo-1490750967868-88df5691cc50?w=800&q=80",
  "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=80",
  "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
  "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800&q=80",
  "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80",
  "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=800&q=80",
  "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=800&q=80",
  "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800&q=80",
];

const ACCENT_COLORS = [
  "#2B4C7E","#7B3F6E","#2E7D52","#1A5276",
  "#1B6CA8","#006D77","#1E5799","#B8860B",
  "#5D4037","#6A1520","#374151","#1a2a3a",
];

const HOLIDAYS = {
  "0-1":   { label: "New Year's Day",   emoji: "🎆" },
  "0-26":  { label: "Republic Day",     emoji: "🇮🇳" },
  "1-14":  { label: "Valentine's Day",  emoji: "❤️" },
  "3-14":  { label: "Ambedkar Jayanti", emoji: "🇮🇳" },
  "4-1":   { label: "Labour Day",       emoji: "✊" },
  "8-2":   { label: "Gandhi Jayanti",   emoji: "🕊️" },
  "9-2":   { label: "Gandhi Jayanti",   emoji: "🕊️" },
  "9-24":  { label: "Dussehra",         emoji: "🏹" },
  "9-31":  { label: "Halloween",        emoji: "🎃" },
  "10-1":  { label: "Diwali",           emoji: "🪔" },
  "10-14": { label: "Children's Day",   emoji: "🧒" },
  "11-25": { label: "Christmas",        emoji: "🎄" },
  "11-31": { label: "New Year's Eve",   emoji: "🥂" },
};

function getHoliday(month, day) {
  return HOLIDAYS[`${month}-${day}`] || null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firstDayOfMonth(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function toTimestamp(y, m, d) {
  return new Date(y, m, d).getTime();
}

function formatDate(obj) {
  if (!obj) return "";
  return new Date(obj.y, obj.m, obj.d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short",
  });
}

function countDays(start, end) {
  if (!start || !end) return 1;
  return Math.round(Math.abs(
    toTimestamp(end.y, end.m, end.d) - toTimestamp(start.y, start.m, start.d)
  ) / 86400000) + 1;
}

function getNoteKey(year, month, i) {
  return `note-${year}-${month}-${i}`;
}

function getOrderedRange(anchor, current) {
  if (!anchor || !current) return { start: anchor, end: current };
  const aT = toTimestamp(anchor.y, anchor.m, anchor.d);
  const cT = toTimestamp(current.y, current.m, current.d);
  return aT <= cT ? { start: anchor, end: current } : { start: current, end: anchor };
}

// ─── Theme ────────────────────────────────────────────────────────────────────

function getTheme(dark) {
  return dark ? {
    bg: "#111318", calCard: "#1C1F26", calPanel: "#1C1F26",
    notesPanel: "#15171C", notesBorder: "#2A2D35", noteLine: "#3A3D45",
    noteText: "#E0E0E0", text: "#E8E8E8", textMuted: "#666",
    weekend: "#E05050", wday: "#FFFFFF", wdayWeekend: "#E05050",
    rangeHighlight: "#1E2A40", dragHighlight: "#243356",
    hintColor: "#555", shadow: "0 8px 48px rgba(0,0,0,0.6)",
  } : {
    bg: "#F9F7F4", calCard: "#FFFFFF", calPanel: "#FFFFFF",
    notesPanel: "#F4F0E8", notesBorder: "#E8E0D0", noteLine: "#D8D0C0",
    noteText: "#1A1A1A", text: "#1A1A1A", textMuted: "#8A8A8A",
    weekend: "#C0392B", wday: "#8A8A8A", wdayWeekend: "#C0392B",
    rangeHighlight: "#EAF0FA", dragHighlight: "#D6E8FA",
    hintColor: "#8A8A8A", shadow: "0 8px 48px rgba(0,0,0,0.14)",
  };
}

// ─── Binding ──────────────────────────────────────────────────────────────────

function Binding() {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 18,
      background: "#1a1a1a", display: "flex", alignItems: "center",
      justifyContent: "space-around", padding: "0 8px", zIndex: 10,
    }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          width: 13, height: 13, borderRadius: "50%",
          border: "2.5px solid #666", background: "#444", flexShrink: 0,
        }} />
      ))}
    </div>
  );
}

// ─── Hero Panel ───────────────────────────────────────────────────────────────

const heroBtn = {
  width: 34, height: 34, borderRadius: "50%",
  background: "rgba(0,0,0,0.45)",
  border: "2px solid rgba(255,255,255,0.6)",
  color: "#fff", fontSize: 16, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  backdropFilter: "blur(6px)", transition: "background 0.2s",
  fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.8)", flexShrink: 0,
};

function HeroPanel({ month, year, accent, onPrev, onNext, onToday, isCurrentMonth, dark, onToggleDark }) {
  const [imgSrc, setImgSrc]         = useState(HERO_IMAGES[month]);
  const [imgOpacity, setImgOpacity] = useState(1);
  const prevMonth = useRef(month);

  useEffect(() => {
    if (prevMonth.current === month) return;
    prevMonth.current = month;
    setImgOpacity(0);
    const t = setTimeout(() => { setImgSrc(HERO_IMAGES[month]); setImgOpacity(1); }, 250);
    return () => clearTimeout(t);
  }, [month]);

  return (
    <div style={{
      gridColumn: 1, gridRow: "1 / 3", position: "relative",
      minHeight: 0, height: "100%", overflow: "hidden", background: "#1a2a3a",
    }}>
      <Binding />
      <img src={imgSrc} alt={MONTHS[month]} style={{
        width: "100%", height: "100%", objectFit: "cover",
        display: "block", position: "absolute", inset: 0,
        opacity: imgOpacity, transition: "opacity 0.35s ease",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(160deg, transparent 40%, rgba(0,0,0,0.65) 100%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: 24, left: 0, right: 0,
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "0 14px", gap: 6,
      }}>
        <button style={heroBtn} onClick={onPrev}>←</button>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ ...heroBtn, fontSize: 15 }} onClick={onToggleDark}>
            {dark ? "☀️" : "🌙"}
          </button>
          {!isCurrentMonth && (
            <button style={{
              ...heroBtn, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.8px", padding: "0 10px",
              width: "auto", borderRadius: 20,
              background: "rgba(0,0,0,0.55)",
              border: "1.5px solid rgba(255,255,255,0.7)",
            }} onClick={onToday}>TODAY</button>
          )}
        </div>
        <button style={heroBtn} onClick={onNext}>→</button>
      </div>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "48px 24px 22px",
        background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
      }}>
        <div style={{
          fontSize: 11, color: "rgba(255,255,255,0.55)",
          letterSpacing: "3px", textTransform: "uppercase",
          fontWeight: 300, marginBottom: 4,
        }}>{year}</div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 38, fontWeight: 700, color: "#fff",
          letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 10,
        }}>{MONTHS[month]}</div>
        <div style={{ height: 3, width: 40, borderRadius: 2, background: accent }} />
      </div>
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ label }) {
  return (
    <div style={{
      position: "absolute", bottom: "110%", left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.85)", color: "#fff",
      fontSize: 10, padding: "4px 8px", borderRadius: 6,
      whiteSpace: "nowrap", pointerEvents: "none", zIndex: 200,
    }}>{label}</div>
  );
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

function DayCell({
  day, isToday, isWeekend, isStart, isEnd, isInRange,
  isDragging, weekPos, hasNote, accent, theme, holiday,
  onMouseDown, onMouseEnter, onTouchStart,
}) {
  const [showTip, setShowTip] = useState(false);
  const isEdge = isStart || isEnd;

  let bg           = "transparent";
  let color        = isWeekend ? theme.weekend : theme.text;
  let fontWeight   = isToday ? 600 : 400;
  let borderRadius = "8px";
  let scale        = 1;
  let outline      = "none";

  if (isEdge) {
    bg = accent; color = "#fff"; fontWeight = 700; scale = 1.12;
    outline = `2px solid ${accent}`;
  } else if (isInRange) {
    bg = isDragging ? theme.dragHighlight : theme.rangeHighlight;
    color = accent; fontWeight = 500;
    if (weekPos === 0)      borderRadius = "8px 0 0 8px";
    else if (weekPos === 6) borderRadius = "0 8px 8px 0";
    else                    borderRadius = "0";
  }

  const tipLabel = holiday
    ? `${holiday.emoji} ${holiday.label}`
    : isToday ? "Today" : null;

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => { onMouseEnter(); setShowTip(true); }}
      onMouseLeave={() => setShowTip(false)}
      onTouchStart={onTouchStart}
      style={{
        aspectRatio: "1",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, borderRadius, fontWeight, background: bg, color,
        transform: `scale(${scale})`, cursor: "pointer", position: "relative",
        outline, transition: "background 0.08s, color 0.08s, transform 0.1s",
        WebkitUserSelect: "none", userSelect: "none",
      }}
    >
      {day}
      {isToday && !isEdge && (
        <span style={{
          position: "absolute", bottom: 3, left: "50%",
          transform: "translateX(-50%)",
          width: 4, height: 4, borderRadius: "50%", background: "#C8A96E",
        }} />
      )}
      {hasNote && !isEdge && (
        <span style={{
          position: "absolute", top: 2, right: 2,
          width: 5, height: 5, borderRadius: "50%", background: "#C8A96E",
        }} />
      )}
      {holiday && (
        <span style={{
          position: "absolute", top: 1, left: 2,
          fontSize: 8, lineHeight: 1, pointerEvents: "none",
        }}>{holiday.emoji}</span>
      )}
      {showTip && tipLabel && <Tooltip label={tipLabel} />}
    </div>
  );
}

// ─── Calendar Grid — drag engine ──────────────────────────────────────────────

function CalendarGrid({ year, month, rangeStart, rangeEnd, notes, accent, theme, flipDir, onRangeChange, onDragStateChange }) {
  const todayObj  = new Date();
  const fd        = firstDayOfMonth(year, month);
  const totalDays = daysInMonth(year, month);

  // All drag state lives in a ref to avoid stale-closure issues
  const drag = useRef({ active: false, anchor: null, current: null });

  // Live range shown while dragging — starts from committed range
  const [liveRange, setLiveRange] = useState({ start: rangeStart, end: rangeEnd });

  // When parent commits a new range (drag ended), sync it in
  useEffect(() => {
    if (!drag.current.active) {
      setLiveRange({ start: rangeStart, end: rangeEnd });
    }
  }, [rangeStart, rangeEnd]);

  // ── Mouse handlers ────────────────────────────────────────────────────────

  const startDrag = useCallback((y, m, d) => {
    drag.current = { active: true, anchor: { y, m, d }, current: { y, m, d } };
    setLiveRange({ start: { y, m, d }, end: { y, m, d } });
    onDragStateChange(true);

    const onUp = () => {
      if (!drag.current.active) return;
      const { start, end } = getOrderedRange(drag.current.anchor, drag.current.current);
      drag.current.active = false;
      onDragStateChange(false);
      onRangeChange(start, end);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mouseup", onUp);
  }, [onRangeChange, onDragStateChange]);

  const moveDrag = useCallback((y, m, d) => {
    if (!drag.current.active) return;
    drag.current.current = { y, m, d };
    const { start, end } = getOrderedRange(drag.current.anchor, { y, m, d });
    setLiveRange({ start, end });
  }, []);

  // ── Touch handlers ────────────────────────────────────────────────────────

  const startTouch = useCallback((y, m, d, e) => {
    e.preventDefault();
    drag.current = { active: true, anchor: { y, m, d }, current: { y, m, d } };
    setLiveRange({ start: { y, m, d }, end: { y, m, d } });
    onDragStateChange(true);

    const onMove = (ev) => {
      const touch = ev.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el?.dataset?.day) {
        const td = { y: +el.dataset.y, m: +el.dataset.m, d: +el.dataset.day };
        drag.current.current = td;
        const { start, end } = getOrderedRange(drag.current.anchor, td);
        setLiveRange({ start, end });
      }
    };

    const onEnd = () => {
      if (!drag.current.active) return;
      const { start, end } = getOrderedRange(drag.current.anchor, drag.current.current);
      drag.current.active = false;
      onDragStateChange(false);
      onRangeChange(start, end);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };

    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  }, [onRangeChange, onDragStateChange]);

  // ── Render ────────────────────────────────────────────────────────────────

  const sT = liveRange.start ? toTimestamp(liveRange.start.y, liveRange.start.m, liveRange.start.d) : null;
  const eT = liveRange.end   ? toTimestamp(liveRange.end.y,   liveRange.end.m,   liveRange.end.d)   : null;

  const cells = [];

  for (let i = 0; i < fd; i++) {
    cells.push(<div key={`e-${i}`} style={{ aspectRatio: "1" }} />);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dow       = (fd + d - 1) % 7;
    const isWeekend = dow >= 5;
    const isTodayD  =
      year  === todayObj.getFullYear() &&
      month === todayObj.getMonth()    &&
      d     === todayObj.getDate();

    const t         = toTimestamp(year, month, d);
    const isStart   = sT !== null && t === sT;
    const isEnd     = eT !== null && t === eT;
    const isInRange = !!(sT && eT && t > Math.min(sT, eT) && t < Math.max(sT, eT));
    const hasNote   = !!notes[`note-${year}-${month}-day-${d}`];
    const holiday   = getHoliday(month, d);

    cells.push(
      <DayCell
        key={d}
        day={d}
        isToday={isTodayD}
        isWeekend={isWeekend}
        isStart={isStart}
        isEnd={isEnd}
        isInRange={isInRange}
        isDragging={drag.current.active}
        hasNote={hasNote}
        weekPos={dow}
        accent={accent}
        theme={theme}
        holiday={holiday}
        onMouseDown={() => startDrag(year, month, d)}
        onMouseEnter={() => moveDrag(year, month, d)}
        onTouchStart={(e) => startTouch(year, month, d, e)}
        data-day={d}
        data-y={year}
        data-m={month}
      />
    );
  }

  const animName =
    flipDir === "next" ? "flipInNext" :
    flipDir === "prev" ? "flipInPrev" : "none";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 2,
      WebkitUserSelect: "none", userSelect: "none",
      cursor: drag.current.active ? "grabbing" : "default",
      animation: animName !== "none" ? `${animName} 0.38s ease forwards` : "none",
    }}>
      {cells}
    </div>
  );
}

// ─── Range Summary Bar ────────────────────────────────────────────────────────

function RangeSummary({ rangeStart, rangeEnd, isDragging, accent, theme, onClear }) {
  if (!rangeStart) {
    return (
      <div style={{
        textAlign: "center", fontSize: 11, color: theme.hintColor,
        letterSpacing: "0.4px", marginTop: 10, minHeight: 32,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <span style={{ fontSize: 16, opacity: 0.5 }}>⟺</span>
        Click and drag across dates to select a range
      </div>
    );
  }

  const days  = countDays(rangeStart, rangeEnd || rangeStart);
  const label = rangeEnd
    ? `${formatDate(rangeStart)} → ${formatDate(rangeEnd)}`
    : `${formatDate(rangeStart)} — keep dragging`;

  return (
    <div style={{
      marginTop: 10, display: "flex", alignItems: "center",
      justifyContent: "space-between",
      background: isDragging ? theme.dragHighlight : theme.rangeHighlight,
      border: `1.5px solid ${accent}55`,
      borderRadius: 10, padding: "6px 12px",
      transition: "background 0.12s", minHeight: 32,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Day count bubble */}
        <span style={{
          background: accent, color: "#fff", borderRadius: "50%",
          width: 22, height: 22, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0,
        }}>{days}</span>

        <span style={{ fontSize: 11, color: accent, fontWeight: 500 }}>
          {label}
        </span>

        {isDragging && (
          <span style={{
            fontSize: 9, color: accent, opacity: 0.65,
            letterSpacing: "0.5px", textTransform: "uppercase",
            animation: "pulse 0.8s ease infinite alternate",
          }}>dragging…</span>
        )}
      </div>

      {rangeEnd && !isDragging && (
        <button onClick={onClear} style={{
          background: "none", border: "none", cursor: "pointer",
          color: theme.textMuted, fontSize: 18, lineHeight: 1, padding: "0 2px",
        }} title="Clear">×</button>
      )}
    </div>
  );
}

// ─── Notes Panel ──────────────────────────────────────────────────────────────

function NotesPanel({ year, month, rangeStart, rangeEnd, notes, onNoteChange, accent, theme }) {
  const days = rangeStart && rangeEnd ? countDays(rangeStart, rangeEnd) : 0;

  return (
    <div style={{
      gridColumn: 2, gridRow: 2, background: theme.notesPanel,
      padding: "14px 20px 20px", borderTop: `1px solid ${theme.notesBorder}`,
      display: "flex", flexDirection: "column", gap: 10,
      transition: "background 0.3s",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 6,
      }}>
        <span style={{
          fontFamily: "'Playfair Display', serif", fontStyle: "italic",
          fontSize: 14, color: theme.textMuted, letterSpacing: "0.3px",
        }}>Notes &amp; Memos</span>
        {days > 0 && (
          <span style={{
            fontSize: 10, color: "#fff", background: accent,
            padding: "3px 9px", borderRadius: 20,
            fontWeight: 500, letterSpacing: "0.4px",
          }}>{days} {days === 1 ? "day" : "days"} selected</span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <input
            key={getNoteKey(year, month, i)}
            type="text"
            style={{
              width: "100%", background: "transparent", border: "none",
              borderBottom: `1px solid ${theme.noteLine}`,
              padding: "3px 0", fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, color: theme.noteText, outline: "none",
            }}
            placeholder={i === 0 ? "Add a note for this month…" : ""}
            value={notes[getNoteKey(year, month, i)] || ""}
            onChange={(e) => onNoteChange(getNoteKey(year, month, i), e.target.value)}
          />
        ))}
      </div>
      <HolidayLegend month={month} theme={theme} />
    </div>
  );
}

// ─── Holiday Legend ───────────────────────────────────────────────────────────

function HolidayLegend({ month, theme }) {
  const list = Object.entries(HOLIDAYS)
    .filter(([k]) => k.startsWith(`${month}-`))
    .map(([k, v]) => ({ day: parseInt(k.split("-")[1]), ...v }));
  if (!list.length) return null;
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        fontSize: 9, fontWeight: 600, letterSpacing: "1px",
        textTransform: "uppercase", color: theme.textMuted, marginBottom: 5,
      }}>This month</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {list.map((h, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, color: theme.text,
          }}>
            <span style={{ fontSize: 13 }}>{h.emoji}</span>
            <span style={{ color: theme.textMuted }}>{h.day}</span>
            <span>{h.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function InteractiveCalendar() {
  const todayDate = new Date();
  const [curYear,  setCurYear]  = useState(todayDate.getFullYear());
  const [curMonth, setCurMonth] = useState(todayDate.getMonth());
  const [dark,     setDark]     = useState(false);

  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd,   setRangeEnd]   = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [flipDir,    setFlipDir]    = useState("");
  const [notes,      setNotes]      = useState({});

  const theme  = getTheme(dark);
  const accent = ACCENT_COLORS[curMonth];
  const isCurrentMonth =
    curYear  === todayDate.getFullYear() &&
    curMonth === todayDate.getMonth();

  const changeMonth = useCallback((dir) => {
    setFlipDir(dir > 0 ? "next" : "prev");
    setTimeout(() => {
      setCurMonth((prev) => {
        const next = prev + dir;
        if (next > 11) { setCurYear(y => y + 1); return 0; }
        if (next < 0)  { setCurYear(y => y - 1); return 11; }
        return next;
      });
      setTimeout(() => setFlipDir(""), 400);
    }, 10);
  }, []);

  const goToToday = useCallback(() => {
    const t = new Date();
    const dir = t.getFullYear() !== curYear
      ? (t.getFullYear() > curYear ? 1 : -1)
      : t.getMonth() > curMonth ? 1 : -1;
    setFlipDir(dir > 0 ? "next" : "prev");
    setTimeout(() => {
      setCurMonth(t.getMonth());
      setCurYear(t.getFullYear());
      setTimeout(() => setFlipDir(""), 400);
    }, 10);
  }, [curYear, curMonth]);

  const handleRangeChange    = useCallback((s, e) => { setRangeStart(s); setRangeEnd(e); }, []);
  const handleDragStateChange = useCallback((v) => setIsDragging(v), []);
  const clearSelection        = useCallback(() => { setRangeStart(null); setRangeEnd(null); }, []);
  const handleNoteChange      = useCallback((k, v) => setNotes(p => ({ ...p, [k]: v })), []);

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        background: theme.bg, minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 0, transition: "background 0.3s",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr auto",
          maxWidth: 920, width: "100%",
          background: theme.calCard, borderRadius: 16, overflow: "hidden",
          boxShadow: theme.shadow, minHeight: 560, alignItems: "stretch",
          transition: "background 0.3s, box-shadow 0.3s",
        }}>
          <HeroPanel
            month={curMonth} year={curYear} accent={accent}
            onPrev={() => changeMonth(-1)} onNext={() => changeMonth(1)}
            onToday={goToToday} isCurrentMonth={isCurrentMonth}
            dark={dark} onToggleDark={() => setDark(d => !d)}
          />

          <div style={{
            gridColumn: 2, gridRow: 1, padding: "24px 20px 12px",
            background: theme.calPanel, display: "flex", flexDirection: "column",
            transition: "background 0.3s",
          }}>
            {/* Weekday row */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
              marginBottom: 4, gap: 2,
            }}>
              {WEEKDAYS.map((w, i) => (
                <div key={w} style={{
                  textAlign: "center", fontSize: 10, fontWeight: 500,
                  letterSpacing: "0.8px", textTransform: "uppercase", padding: "4px 0",
                  color: i >= 5 ? theme.wdayWeekend : theme.wday,
                }}>{w}</div>
              ))}
            </div>

            <CalendarGrid
              year={curYear} month={curMonth}
              rangeStart={rangeStart} rangeEnd={rangeEnd}
              notes={notes} accent={accent} theme={theme}
              flipDir={flipDir}
              onRangeChange={handleRangeChange}
              onDragStateChange={handleDragStateChange}
            />

            <RangeSummary
              rangeStart={rangeStart} rangeEnd={rangeEnd}
              isDragging={isDragging} accent={accent} theme={theme}
              onClear={clearSelection}
            />
          </div>

          <NotesPanel
            year={curYear} month={curMonth}
            rangeStart={rangeStart} rangeEnd={rangeEnd}
            notes={notes} onNoteChange={handleNoteChange}
            accent={accent} theme={theme}
          />
        </div>
      </div>
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes flipInNext {
    0%   { opacity: 0; transform: rotateY(-25deg) translateX(30px); }
    100% { opacity: 1; transform: rotateY(0deg)   translateX(0); }
  }
  @keyframes flipInPrev {
    0%   { opacity: 0; transform: rotateY(25deg) translateX(-30px); }
    100% { opacity: 1; transform: rotateY(0deg)  translateX(0); }
  }
  @keyframes pulse {
    from { opacity: 0.5; }
    to   { opacity: 1; }
  }

  input::placeholder { color: #C8C0B0; }

  @media (max-width: 640px) {
    /* handled via inline grid overrides */
  }
`;
