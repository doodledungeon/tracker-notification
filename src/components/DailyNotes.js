import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { addTask as addTaskFS, getTasks as getTasksFS, toggleTask as toggleTaskFS, removeTask as removeTaskFS } from '../utils/firestoreTasks';
import confetti from 'canvas-confetti';

function getDateString(date) {
  return date.toISOString().split('T')[0];
}

function DailyNotes({ userId, date, goToYesterday, goToTomorrow, onDateChange }) {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [confettiFired, setConfettiFired] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(true);
  const dateString = getDateString(date);
  const audioRef = useRef(null);
  const audio100Ref = useRef(null);

  // Load tasks from Firestore when date or userId changes
  useEffect(() => {
    if (!userId) return;
    setTasks([]); // Clear tasks immediately when user or date changes
    let mounted = true;
    setLoading(true);
    getTasksFS(userId, dateString)
      .then(fetched => {
        console.log("Fetched tasks:", fetched);
        if (mounted) setTasks(fetched);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error loading tasks:", error);
        setLoading(false);
      });
    // Stop 100.mp3 if playing when changing date
    if (audio100Ref.current) {
      audio100Ref.current.pause();
      audio100Ref.current.currentTime = 0;
    }
    return () => { mounted = false; };
  }, [userId, dateString]);

  // Add a new task to Firestore
  const addTask = async (text) => {
    if (text.trim()) {
      const newTask = await addTaskFS(userId, dateString, text);
      setTasks(prev => [...prev, newTask]);
      setInput('');
    }
  };

  // Toggle a task's done status in Firestore
  const toggleTask = async idx => {
    const task = tasks[idx];
    await toggleTaskFS(task.id, !task.done);
    setTasks(prev => prev.map((t, i) => i === idx ? { ...t, done: !t.done } : t));
    if (!task.done) {
      setShake(true);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    }
  };

  // Remove a task from Firestore
  const removeTask = async idx => {
    const task = tasks[idx];
    await removeTaskFS(task.id);
    setTasks(prev => prev.filter((_, i) => i !== idx));
  };

  // Progress bar calculation
  const total = tasks.length;
  const completed = tasks.filter(t => t.done).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Confetti effect and 100% sound when 100% is reached
  useEffect(() => {
    if (percent === 100 && total > 0 && !confettiFired) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      if (audio100Ref.current) {
        audio100Ref.current.currentTime = 0;
        audio100Ref.current.play();
      }
      setConfettiFired(true);
    } else if (percent < 100 && confettiFired) {
      setConfettiFired(false);
    }
    // Stop 100.mp3 if progress drops below 100%
    if (percent < 100 && audio100Ref.current) {
      audio100Ref.current.pause();
      audio100Ref.current.currentTime = 0;
    }
  }, [percent, total, confettiFired]);

  // Remove shake after animation
  useEffect(() => {
    if (shake) {
      const timeout = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [shake]);

  return (
    <div>
      <audio ref={audioRef} src="/chime.mp3" preload="auto" />
      <audio ref={audio100Ref} src="/100.mp3" preload="auto" />
      <div style={{ textAlign: 'center', marginBottom: 28, position: 'relative' }}>
        <div
          style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, cursor: 'pointer', display: 'inline-block' }}
          onClick={() => setShowCalendar(v => !v)}
          title="Pick a date"
        >
          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: '2-digit', year: 'numeric' })}
        </div>
        {showCalendar && (
          <>
            {/* Overlay to close calendar on outside click */}
            <div
              onClick={() => setShowCalendar(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.01)',
                zIndex: 9,
              }}
            />
            <div style={{ position: 'absolute', left: '50%', top: '100%', transform: 'translateX(-50%)', zIndex: 10, marginTop: 8, boxShadow: '0 2px 12px #0008', borderRadius: 12 }}>
              <Calendar
                onChange={d => {
                  setShowCalendar(false);
                  if (onDateChange) onDateChange(d);
                }}
                value={date}
                maxDetail="month"
                minDetail="year"
                calendarType="US"
              />
            </div>
          </>
        )}
      </div>
      {/* Progress Bar with Flames and Flash */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          margin: '0 0 18px 0',
          height: 18,
          background: '#232323',
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          transition: 'box-shadow 0.2s',
        }}
        className={
          (shake ? 'progress-shake ' : '') + (percent > 50 ? 'progress-flash' : '')
        }
      >
        {/* Flames */}
        {percent > 50 && (
          <div style={{ position: 'absolute', left: 0, top: -28, width: '100%', height: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none', zIndex: 2, animation: 'flame-bounce 1s infinite alternate' }}>
            <span style={{ fontSize: 28, filter: 'drop-shadow(0 2px 4px #0008)', animation: 'flame-flicker 0.7s infinite alternate' }}>🔥</span>
            <span style={{ fontSize: 28, marginLeft: 8, filter: 'drop-shadow(0 2px 4px #0008)', animation: 'flame-flicker 0.8s infinite alternate-reverse' }}>🔥</span>
            <span style={{ fontSize: 28, marginLeft: 8, filter: 'drop-shadow(0 2px 4px #0008)', animation: 'flame-flicker 0.6s infinite alternate' }}>🔥</span>
          </div>
        )}
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background:
              percent === 100
                ? '#4fd17c'
                : percent > 50
                ? '#ff3b3b'
                : '#4f8cff',
            transition: 'width 0.3s, background 0.3s',
            borderRadius: 10,
          }}
        ></div>
        <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 13, letterSpacing: 1, textShadow: '0 1px 2px #0008' }}>{percent}%</div>
      </div>
      <ul style={{ minHeight: 120, padding: 0, background: '#26282b', borderRadius: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 32, marginTop: 0 }}>
        {loading ? (
          <li style={{ color: '#888', textAlign: 'center', padding: '28px 0', fontSize: 17, listStyle: 'none' }}>Loading...</li>
        ) : tasks.length === 0 ? (
          <li style={{ color: '#888', textAlign: 'center', padding: '28px 0', fontSize: 17, listStyle: 'none' }}>No tasks yet. Add one below!</li>
        ) : (
          tasks.map((task, idx) => (
            <li key={task.id} style={{ display: 'flex', alignItems: 'center', position: 'relative', cursor: 'pointer', listStyle: 'none', marginBottom: 0, padding: '18px 14px', borderBottom: idx !== tasks.length - 1 ? '1px solid #292929' : 'none', fontSize: 19 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}>
                {task.done && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '50%',
                    height: 2,
                    background: 'black',
                    zIndex: 5,
                    transform: 'translateY(-50%)',
                  }} />
                )}
                <span 
                  style={{ flex: 1, position: 'relative', zIndex: 2 }} 
                  onClick={() => toggleTask(idx)}
                >
                  {task.text}
                </span>
                <button onClick={() => removeTask(idx)} style={{ marginLeft: 10, background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: 24, borderRadius: 8, padding: 4, position: 'relative', zIndex: 2 }} title="Remove task">🗑️</button>
              </div>
            </li>
          ))
        )}
      </ul>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTask(input); }}
          placeholder="Add a task..."
          style={{ fontSize: 19, padding: '14px 16px', borderRadius: 14, border: 'none', outline: 'none', background: '#292929', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 0, width: '100%' }}
        />
        <button onClick={() => addTask(input)} style={{ fontSize: 19, padding: '14px 0', borderRadius: 14, border: 'none', background: '#4f8cff', color: '#fff', fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', width: '100%' }}>Add</button>
      </div>
      {/* Navigation Arrows */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 auto', maxWidth: 220, width: '100%', marginBottom: 10 }}>
        <button
          onClick={goToYesterday}
          aria-label="Go to yesterday"
          style={{ fontSize: 32, padding: '10px 0', borderRadius: '50%', border: 'none', background: '#232323', color: '#fff', flex: 'none', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', marginRight: 8, cursor: 'pointer' }}
        >
          &#8592;
        </button>
        <button
          onClick={goToTomorrow}
          aria-label="Go to tomorrow"
          style={{ fontSize: 32, padding: '10px 0', borderRadius: '50%', border: 'none', background: '#232323', color: '#fff', flex: 'none', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', marginLeft: 8, cursor: 'pointer' }}
        >
          &#8594;
        </button>
      </div>
      <style>{`
        input:focus, button:focus {
          outline: 2px solid #181818 !important;
          box-shadow: none !important;
          border-color: #181818 !important;
        }
        .progress-shake {
          animation: shake-progress 0.5s;
        }
        .progress-flash {
          animation: flash-bar 0.7s infinite alternate;
        }
        @keyframes shake-progress {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
        @keyframes flame-flicker {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-4px) scale(1.08); opacity: 0.85; }
        }
        @keyframes flame-bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-2px); }
        }
        @keyframes flash-bar {
          0% { filter: brightness(0.6); }
          100% { filter: brightness(1.6); }
        }
        /* Custom Calendar Styles */
        .react-calendar {
          background: #232323 !important;
          color: #fff !important;
          border-radius: 16px !important;
          border: none !important;
          box-shadow: 0 2px 12px #0008 !important;
          padding: 12px 8px 8px 8px !important;
          font-size: 1.1rem !important;
        }
        .react-calendar__navigation button {
          color: #fff !important;
          background: none !important;
          min-width: 36px !important;
          font-size: 1.2rem !important;
          border-radius: 8px !important;
        }
        .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus {
          background: #333 !important;
        }
        .react-calendar__tile {
          background: none !important;
          color: #fff !important;
          border-radius: 8px !important;
          padding: 8px 0 !important;
          font-size: 1.1rem !important;
        }
        .react-calendar__tile--now {
          background: #4f8cff !important;
          color: #fff !important;
        }
        .react-calendar__tile--active {
          background: #ff3b3b !important;
          color: #fff !important;
        }
        .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus {
          background: #333 !important;
        }
        .react-calendar__month-view__weekdays {
          text-align: center !important;
          color: #aaa !important;
        }
        .react-calendar__month-view__days__day--weekend {
          color: #ffb36b !important;
        }
        .react-calendar__tile--now.react-calendar__tile--active {
          background: linear-gradient(90deg, #ff3b3b 60%, #4f8cff 100%) !important;
        }
      `}</style>
    </div>
  );
}

export default DailyNotes; 