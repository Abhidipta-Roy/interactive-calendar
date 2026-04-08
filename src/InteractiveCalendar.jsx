import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800&q=80", // Jan
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&q=80", // Feb
  "https://images.unsplash.com/photo-1490750967868-88df5691cc50?w=800&q=80", // Mar
  "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=80", // Apr
  "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80", // May
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", // Jun
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80", // Jul
  "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800&q=80", // Aug
  "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80", // Sep
  "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=800&q=80", // Oct
  "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=800&q=80", // Nov
  "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800&q=80", // Dec
];

const ACCENT_COLORS = [
  "#2B4C7E","#7B3F6E","#2E7D52","#1A5276",
  "#1B6CA8","#006D77","#1E5799","#B8860B",
  "#5D4037","#6A1520","#374151","#1a2a3a",
];

// ─── Holiday definitions (month is 0-indexed) ─────────────────────────────────
// Format: "month-day" : { label, emoji }
const HOLIDAYS = {
  "0-1":   { label: "New Year's Day",       emoji: "🎆" },
  "0-26":  { label: "Republic Day",         emoji: "🇮🇳" },
  "1-14":  { label: "Valentine's Day",      emoji: "❤️" },
  "3-14":  { label: "Ambedkar Jayanti",     emoji: "🇮🇳" },
  "4-1":   { label: "Labour Day",           emoji: "✊" },
  "8-2":   { label: "Gandhi Jayanti",       emoji: "🕊️" },
  "9-2":   { label: "Gandhi Jayanti",       emoji: "🕊️" },
  "9-24":  { label: "Dussehra",             emoji: "🏹" },
  "9-31":  { label: "Halloween",            emoji: "🎃" },
  "10-1":  { label: "Diwali",               emoji: "🪔" },
  "10-14": { label: "Children's Day",       emoji: "🧒" },
  "11-25": { label: "Christmas",            emoji: "🎄" },
  "11-31": { label: "New Year's Eve",       emoji: "🥂" },
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

function getNoteKey(year, month, lineIndex) {
  return `note-${year}-${month}-${lineIndex}`;
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────

function getTheme(dark) {
  return dark ? {
    bg:           "#111318",
    calCard:      "#1C1F26",
    calPanel:     "#1C1F26",
    notesPanel:   "#15171C",
    notesBorder:  "#2A2D35",
    noteLine:     "#3A3D45",
    noteText:     "#E0E0E0",
    notePlaceholder: "#555",
    text:         "#E8E8E8",
    textMuted:    "#666",
    weekend:      "#E05050",
    wday:         "#555",
    wdayWeekend:  "#E05050",
    rangeHighlight:"#1E2A40",
    hintColor:    "#555",
    bindingBg:    "#0A0A0A",
    ringBorder:   "#555",
    ringBg:       "#333",
    shadow:       "0 8px 48px rgba(0,0,0,0.6)",
  } : {
    bg:           "#F9F7F4",
    calCard:      "#FFFFFF",
    calPanel:     "#FFFFFF",
    notesPanel:   "#F4F0E8",
    notesBorder:  "#E8E0D0",
    noteLine:     "#D8D0C0",
    noteText:     "#1A1A1A",
    notePlaceholder: "#C8C0B0",
    text:         "#1A1A1A",
    textMuted:    "#8A8A8A",
    weekend:      "#C0392B",
    wday:         "#8A8A8A",
    wdayWeekend:  "#C0392B",
    rangeHighlight:"#EAF0FA",
    hintColor:    "#8A8A8A",
    bindingBg:    "#2a2a2a",
    ringBorder:   "#888",
    ringBg:       "#555",
    shadow:       "0 8px 48px rgba(0,0,0,0.14)",
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Binding({ theme }) {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0,
      height: 18, background: theme.bindingBg,
      display: "flex", alignItems: "center",
      justifyContent: "space-around", padding: "0 8px", zIndex: 10,
    }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          width: 13, height: 13, borderRadius: "50%",
          border: `2.5px solid ${theme.ringBorder}`,
          background: theme.ringBg, flexShrink: 0,
        }} />
      ))}
    </div>
  );
}

function HeroPanel({ month, year, accent, onPrev, onNext, onToday, isCurrentMonth, dark, onToggleDark }) {
  const [imgSrc, setImgSrc]       = useState(HERO_IMAGES[month]);
  const [imgOpacity, setImgOpacity] = useState(1);
  const prevMonth = useRef(month);

  useEffect(() => {
    if (prevMonth.current === month) return;
    prevMonth.current = month;
    setImgOpacity(0);
    const t = setTimeout(() => {
      setImgSrc(HERO_IMAGES[month]);
      setImgOpacity(1);
    }, 250);
    return () => clearTimeout(t);
  }, [month]);

  return (
    <div style={{
      gridColumn: 1, gridRow: "1 / 3",
      position: "relative", minHeight: 0, height: "100%",
      overflow: "hidden", background: "#1a2a3a",
    }}>
      <Binding theme={{ bindingBg: "#1a1a1a", ringBorder: "#666", ringBg: "#444" }} />

      <img
        src={imgSrc}
        alt={`${MONTHS[month]} scenery`}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          display: "block", position: "absolute", inset: 0,
          opacity: imgOpacity,
          transition: "opacity 0.35s ease",
        }}
      />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(160deg, transparent 40%, rgba(0,0,0,0.65) 100%)",
        pointerEvents: "none",
      }} />

      {/* Top bar: nav + dark toggle + today */}
      <div style={{
        position: "absolute", top: 24, left: 0, right: 0,
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "0 14px", gap: 6,
      }}>
        <button style={heroBtn} onClick={onPrev} aria-label="Previous month">←</button>

        <div style={{ display: "flex", gap: 6 }}>
          {/* Dark mode toggle */}
          <button
            style={{ ...heroBtn, fontSize: 15 }}
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? "☀️" : "🌙"}
          </button>

          {/* Today button — only show when not on current month */}
          {!isCurrentMonth && (
            <button
              style={{
                ...heroBtn,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.8px",
                padding: "0 10px",
                width: "auto",
                borderRadius: 20,
                background: "rgba(0,0,0,0.55)",
                border: "1.5px solid rgba(255,255,255,0.7)",
              }}
              onClick={onToday}
              aria-label="Go to today"
            >
              TODAY
            </button>
          )}
        </div>

        <button style={heroBtn} onClick={onNext} aria-label="Next month">→</button>
      </div>

      {/* Month label */}
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

const heroBtn = {
  width: 34, height: 34, borderRadius: "50%",
  background: "rgba(0,0,0,0.45)",
  border: "2px solid rgba(255,255,255,0.6)",
  color: "#fff", fontSize: 16, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  backdropFilter: "blur(6px)",
  transition: "background 0.2s",
  fontWeight: 700,
  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
  flexShrink: 0,
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ label }) {
  return (
    <div style={{
      position: "absolute",
      bottom: "110%", left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.82)",
      color: "#fff",
      fontSize: 10,
      padding: "4px 7px",
      borderRadius: 6,
      whiteSpace: "nowrap",
      pointerEvents: "none",
      zIndex: 100,
      letterSpacing: "0.3px",
    }}>
      {label}
    </div>
  );
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

function DayCell({
  day, isToday, isWeekend, isStart, isEnd,
  isInRange, isHoverRange, isHoverEnd,
  hasNote, weekPos, accent, theme, holiday,
  onClick, onMouseEnter,
}) {
  const [showTip, setShowTip] = useState(false);
  const isEdge = isStart || isEnd || isHoverEnd;

  let bg          = "transparent";
  let color       = isWeekend ? theme.weekend : theme.text;
  let fontWeight  = isToday ? 600 : 400;
  let borderRadius = "8px";
  let scale       = 1;

  if (isEdge) {
    bg = accent; color = "#fff"; fontWeight = 700; scale = 1.1;
  } else if (isInRange || isHoverRange) {
    bg = theme.rangeHighlight; color = accent; fontWeight = 500;
    if (weekPos === 0)      borderRadius = "8px 0 0 8px";
    else if (weekPos === 6) borderRadius = "0 8px 8px 0";
    else                    borderRadius = "0";
  }

  const tipLabel = holiday
    ? `${holiday.emoji} ${holiday.label}`
    : isToday
    ? "Today"
    : null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => { onMouseEnter(); setShowTip(true); }}
      onMouseLeave={() => setShowTip(false)}
      style={{
        aspectRatio: "1",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, borderRadius, fontWeight,
        background: bg, color,
        transform: `scale(${scale})`,
        cursor: "pointer",
        position: "relative",
        transition: "background 0.15s, color 0.15s, transform 0.1s",
      }}
    >
      {day}

      {/* Today dot */}
      {isToday && !isEdge && (
        <span style={{
          position: "absolute", bottom: 3, left: "50%",
          transform: "translateX(-50%)",
          width: 4, height: 4, borderRadius: "50%",
          background: "#C8A96E",
        }} />
      )}

      {/* Note dot */}
      {hasNote && !isEdge && (
        <span style={{
          position: "absolute", top: 2, right: 2,
          width: 5, height: 5, borderRadius: "50%",
          background: "#C8A96E",
        }} />
      )}

      {/* Holiday emoji badge */}
      {holiday && (
        <span style={{
          position: "absolute", top: 1, left: 2,
          fontSize: 8, lineHeight: 1,
          pointerEvents: "none",
        }}>
          {holiday.emoji}
        </span>
      )}

      {/* Tooltip */}
      {showTip && tipLabel && <Tooltip label={tipLabel} />}
    </div>
  );
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────

function CalendarGrid({
  year, month, rangeStart, rangeEnd, hoverDate,
  selecting, notes, accent, theme, flipDir,
  onDayClick, onDayHover,
}) {
  const today = new Date();
  const fd        = firstDayOfMonth(year, month);
  const totalDays = daysInMonth(year, month);
  const cells     = [];

  for (let i = 0; i < fd; i++) {
    cells.push(
      <div key={`e-${i}`} style={{ aspectRatio: "1" }} />
    );
  }

  for (let d = 1; d <= totalDays; d++) {
    const dow      = (fd + d - 1) % 7;
    const isWeekend = dow >= 5;
    const isTodayD  =
      year  === today.getFullYear() &&
      month === today.getMonth()    &&
      d     === today.getDate();

    const t  = toTimestamp(year, month, d);
    const sT = rangeStart ? toTimestamp(rangeStart.y, rangeStart.m, rangeStart.d) : null;
    const eT = rangeEnd   ? toTimestamp(rangeEnd.y,   rangeEnd.m,   rangeEnd.d)   : null;
    const hT = hoverDate  ? toTimestamp(hoverDate.y,  hoverDate.m,  hoverDate.d)  : null;

    const isStart     = sT !== null && t === sT;
    const isEnd       = eT !== null && t === eT;
    const isInRange   = !!(sT && eT && t > Math.min(sT, eT) && t < Math.max(sT, eT));
    const isHoverRange = !!(selecting && !rangeEnd && sT && hT && t > Math.min(sT, hT) && t < Math.max(sT, hT));
    const isHoverEnd  = !!(selecting && !rangeEnd && hT !== null && t === hT);
    const noteKey     = `note-${year}-${month}-day-${d}`;
    const hasNote     = !!notes[noteKey];
    const holiday     = getHoliday(month, d);

    cells.push(
      <DayCell
        key={d}
        day={d}
        isToday={isTodayD}
        isWeekend={isWeekend}
        isStart={isStart}
        isEnd={isEnd}
        isInRange={isInRange}
        isHoverRange={isHoverRange}
        isHoverEnd={isHoverEnd}
        hasNote={hasNote}
        weekPos={dow}
        accent={accent}
        theme={theme}
        holiday={holiday}
        onClick={() => onDayClick(year, month, d)}
        onMouseEnter={() => onDayHover(year, month, d)}
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
      animation: animName !== "none" ? `${animName} 0.38s ease forwards` : "none",
    }}>
      {cells}
    </div>
  );
}

// ─── Notes Panel ──────────────────────────────────────────────────────────────

function NotesPanel({ year, month, rangeStart, rangeEnd, notes, onNoteChange, accent, theme }) {
  const rangeLabel =
    rangeStart && rangeEnd
      ? `${formatDate(rangeStart)} → ${formatDate(rangeEnd)}`
      : rangeStart
      ? `From ${formatDate(rangeStart)} — pick end date`
      : "";

  return (
    <div style={{
      gridColumn: 2, gridRow: 2,
      background: theme.notesPanel,
      padding: "14px 20px 20px",
      borderTop: `1px solid ${theme.notesBorder}`,
      display: "flex", flexDirection: "column", gap: 10,
      transition: "background 0.3s",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 6,
      }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: "italic", fontSize: 14,
          color: theme.textMuted, letterSpacing: "0.3px",
        }}>
          Notes &amp; Memos
        </span>
        {rangeLabel && (
          <span style={{
            fontSize: 10, color: "#fff",
            background: accent,
            padding: "3px 9px", borderRadius: 20,
            fontWeight: 500, letterSpacing: "0.4px",
            maxWidth: "100%", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {rangeLabel}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Array.from({ length: 4 }).map((_, i) => {
          const key = getNoteKey(year, month, i);
          return (
            <input
              key={key}
              type="text"
              style={{
                width: "100%", background: "transparent",
                border: "none",
                borderBottom: `1px solid ${theme.noteLine}`,
                padding: "3px 0",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12, color: theme.noteText, outline: "none",
              }}
              placeholder={i === 0 ? "Add a note for this month…" : ""}
              value={notes[key] || ""}
              onChange={(e) => onNoteChange(key, e.target.value)}
            />
          );
        })}
      </div>

      {/* Holiday legend for current month */}
      <HolidayLegend month={month} theme={theme} />
    </div>
  );
}

// ─── Holiday Legend ───────────────────────────────────────────────────────────

function HolidayLegend({ month, theme }) {
  const holidays = Object.entries(HOLIDAYS)
    .filter(([key]) => key.startsWith(`${month}-`))
    .map(([key, val]) => {
      const day = parseInt(key.split("-")[1]);
      return { day, ...val };
    });

  if (holidays.length === 0) return null;

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        fontSize: 9, fontWeight: 600, letterSpacing: "1px",
        textTransform: "uppercase", color: theme.textMuted,
        marginBottom: 5,
      }}>
        This month
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {holidays.map((h, i) => (
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InteractiveCalendar() {
  const todayDate = new Date();
  const [curYear,  setCurYear]  = useState(todayDate.getFullYear());
  const [curMonth, setCurMonth] = useState(todayDate.getMonth());
  const [dark,     setDark]     = useState(false);

  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd,   setRangeEnd]   = useState(null);
  const [hoverDate,  setHoverDate]  = useState(null);
  const [selecting,  setSelecting]  = useState(false);

  const [notes,   setNotes]   = useState({});
  const [hint,    setHint]    = useState("Tap a date to begin selecting a range");
  const [flipDir, setFlipDir] = useState("");

  const theme  = getTheme(dark);
  const accent = ACCENT_COLORS[curMonth];

  const isCurrentMonth =
    curYear  === todayDate.getFullYear() &&
    curMonth === todayDate.getMonth();

  // ── Month navigation ─────────────────────────────────────────────────────

  const changeMonth = useCallback((dir) => {
    setFlipDir(dir > 0 ? "next" : "prev");
    setTimeout(() => {
      setCurMonth((prev) => {
        let next = prev + dir;
        if (next > 11) { setCurYear((y) => y + 1); return 0; }
        if (next < 0)  { setCurYear((y) => y - 1); return 11; }
        return next;
      });
      setTimeout(() => setFlipDir(""), 400);
    }, 10);
  }, []);

  // ── Today ────────────────────────────────────────────────────────────────

  const goToToday = useCallback(() => {
    const t = new Date();
    const targetMonth = t.getMonth();
    const targetYear  = t.getFullYear();
    const dir = targetYear !== curYear
      ? (targetYear > curYear ? 1 : -1)
      : targetMonth > curMonth ? 1 : -1;

    setFlipDir(dir > 0 ? "next" : "prev");
    setTimeout(() => {
      setCurMonth(targetMonth);
      setCurYear(targetYear);
      setTimeout(() => setFlipDir(""), 400);
    }, 10);
  }, [curYear, curMonth]);

  // ── Day click ────────────────────────────────────────────────────────────

  const handleDayClick = useCallback((y, m, d) => {
    if (!selecting || (rangeStart && rangeEnd)) {
      setRangeStart({ y, m, d });
      setRangeEnd(null);
      setHoverDate(null);
      setSelecting(true);
      setHint("Now tap an end date");
    } else {
      const sT = toTimestamp(rangeStart.y, rangeStart.m, rangeStart.d);
      const eT = toTimestamp(y, m, d);
      if (eT < sT) { setRangeEnd(rangeStart); setRangeStart({ y, m, d }); }
      else         { setRangeEnd({ y, m, d }); }
      setSelecting(false);
      setHoverDate(null);
      setHint("Range selected — tap a date to restart");
    }
  }, [selecting, rangeStart, rangeEnd]);

  const handleDayHover = useCallback((y, m, d) => {
    if (selecting && !rangeEnd) setHoverDate({ y, m, d });
  }, [selecting, rangeEnd]);

  const clearSelection = () => {
    setRangeStart(null); setRangeEnd(null);
    setSelecting(false); setHoverDate(null);
    setHint("Tap a date to begin selecting a range");
  };

  const handleNoteChange = useCallback((key, value) => {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{getCSS(dark)}</style>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        background: theme.bg,
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 0,
        transition: "background 0.3s",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr auto",
          maxWidth: 920, width: "100%",
          background: theme.calCard,
          borderRadius: 16, overflow: "hidden",
          boxShadow: theme.shadow,
          minHeight: 560,
          alignItems: "stretch",
          transition: "background 0.3s, box-shadow 0.3s",
        }}>

          {/* LEFT: Hero */}
          <HeroPanel
            month={curMonth}
            year={curYear}
            accent={accent}
            onPrev={() => changeMonth(-1)}
            onNext={() => changeMonth(1)}
            onToday={goToToday}
            isCurrentMonth={isCurrentMonth}
            dark={dark}
            onToggleDark={() => setDark((d) => !d)}
          />

          {/* RIGHT TOP: Calendar grid */}
          <div style={{
            gridColumn: 2, gridRow: 1,
            padding: "24px 20px 12px",
            background: theme.calPanel,
            display: "flex", flexDirection: "column",
            transition: "background 0.3s",
          }}>
            {/* Weekday headers */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              marginBottom: 4, gap: 2,
            }}>
              {WEEKDAYS.map((w, i) => (
  <div key={w} style={{
    textAlign: "center",
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    padding: "4px 0",

    // ✅ Sat & Sun always red
    color: i >= 5
      ? theme.weekend   // red (works for both dark & light)
      : (dark ? "#FFFFFF" : theme.wday), // Mon–Fri white in dark, normal in light
  }}>
    {w}
  </div>
))}
            </div>

            <CalendarGrid
              year={curYear}
              month={curMonth}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              hoverDate={hoverDate}
              selecting={selecting}
              notes={notes}
              accent={accent}
              theme={theme}
              flipDir={flipDir}
              onDayClick={handleDayClick}
              onDayHover={handleDayHover}
            />

            <div style={{
              textAlign: "center", fontSize: 10,
              color: theme.hintColor, letterSpacing: "0.4px",
              marginTop: 10, minHeight: 14,
            }}>
              {hint}
            </div>

            {(rangeStart || rangeEnd) && (
              <button
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                  textDecoration: "underline", alignSelf: "flex-end",
                  marginTop: 6, padding: 0, color: accent,
                }}
                onClick={clearSelection}
              >
                Clear selection ×
              </button>
            )}
          </div>

          {/* RIGHT BOTTOM: Notes */}
          <NotesPanel
            year={curYear}
            month={curMonth}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            notes={notes}
            onNoteChange={handleNoteChange}
            accent={accent}
            theme={theme}
          />
        </div>
      </div>
    </>
  );
}

// ─── CSS (keyframes + font import + responsive) ───────────────────────────────

function getCSS(dark) {
  return `
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

    input::placeholder {
      color: ${dark ? "#555" : "#C8C0B0"};
    }

    @media (max-width: 640px) {
      /* The grid wrapper needs an id or class — we use inline style overrides below */
    }
  `;
}

