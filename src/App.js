import React, { useState, useEffect } from 'react';
import DailyNotes from './components/DailyNotes';
import AuthModal from './components/AuthModal';
import { auth } from './firebase';
import { requestNotificationPermission, getNotificationPermissionStatus, isPWAInstalled } from './notifications';

function getDateString(date) {
  return date.toISOString().split('T')[0];
}

function App() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to midnight local time
  const [currentDate, setCurrentDate] = useState(today);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('default');
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u);
      setAuthOpen(!u);
    });
    
    // Check notification status and PWA status
    setNotificationStatus(getNotificationPermissionStatus());
    setIsPWA(isPWAInstalled());
    
    return unsub;
  }, []);

  const goToYesterday = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const goToTomorrow = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const handleDateChange = (date) => {
    setCurrentDate(new Date(date));
  };

  const handleLogout = () => {
    auth.signOut();
  };

  const handleNotificationRequest = async () => {
    const token = await requestNotificationPermission(user.email);
    if (token) {
      setNotificationStatus('granted');
    }
  };

  return (
    <div style={{ background: '#181818', color: '#fff', padding: '0', margin: '0', boxSizing: 'border-box', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        input:focus, button:focus {
          outline: 2px solid #181818 !important;
          box-shadow: none !important;
          border-color: #181818 !important;
        }
      `}</style>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <div style={{ flex: 1, padding: '24px 12px 0 12px', maxWidth: 500, margin: '0 auto', width: '100%' }}>
        {user && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ marginRight: 12, color: '#aaa', fontSize: 15 }}>{user.email}</span>
            <button
              onClick={handleNotificationRequest}
              style={{
                background: notificationStatus === 'granted' ? '#4fd17c' : '#232323',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                padding: '6px 10px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 18,
                marginRight: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.3s',
              }}
              title={notificationStatus === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
            >
              <span role="img" aria-label="envelope">
                {notificationStatus === 'granted' ? '🔔' : '✉️'}
              </span>
            </button>
            <button onClick={handleLogout} style={{ background: '#232323', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>Logout</button>
          </div>
        )}
        {user && (
          <>
            {/* iOS PWA Installation Notice */}
            {!isPWA && /iPad|iPhone|iPod/.test(navigator.userAgent) && (
              <div style={{
                background: '#2a2a2a',
                border: '1px solid #4f8cff',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
                fontSize: 14,
                color: '#fff',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: 8 }}>
                  <span role="img" aria-label="info">ℹ️</span>
                  <strong> For best experience on iOS:</strong>
                </div>
                <div style={{ fontSize: 13, color: '#ccc' }}>
                  Tap the share button <span role="img" aria-label="share">📤</span> and select "Add to Home Screen"
                </div>
              </div>
            )}
            <DailyNotes
              userId={user.email}
              date={currentDate}
              goToYesterday={goToYesterday}
              goToTomorrow={goToTomorrow}
              onDateChange={handleDateChange}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App; 