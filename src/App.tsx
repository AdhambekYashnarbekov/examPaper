/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogOut, Key, UserCheck, Play, ArrowRight, Users, GraduationCap, Monitor, Sparkles, BookOpen, Globe, Sun, Moon } from 'lucide-react';
import StudentPortal from './components/StudentPortal';
import TeacherPortal from './components/TeacherPortal';
import AdminPortal from './components/AdminPortal';
import ExamScreen from './components/ExamScreen';
import AccessibilityToolbar from './components/AccessibilityToolbar';
import { AuthResponse, TestRoom, Question } from './types';
import { Language, translations } from './translations';

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('exampaper_theme') as 'dark' | 'light') || 'dark';
  });
  const [announceMsg, setAnnounceMsg] = useState<string>('Welcome to examPaper. Press Option plus A (or Command plus Option plus A) on macOS to open accessibility settings.');

  // Sync light/dark theme class to document body
  useEffect(() => {
    localStorage.setItem('exampaper_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  // Auth Forms
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regRole, setRegRole] = useState<'student' | 'teacher'>('student');
  
  // Forms states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [departmentInput, setDepartmentInput] = useState('');
  
  // Handlers and feedbacks
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active testing chamber overlay states
  const [activeSession, setActiveSession] = useState<{ room: TestRoom; questions: Question[] } | null>(null);

  // Automatic session restore
  useEffect(() => {
    const savedToken = localStorage.getItem('exampaper_token') || localStorage.getItem('quant_token');
    if (savedToken) {
      restoreSession(savedToken);
    }
  }, []);

  const restoreSession = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAuthToken(token);
        setCurrentUser(data.user);
        localStorage.setItem('exampaper_token', token);
      } else {
        handleLogout();
      }
    } catch (e) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem('exampaper_token');
    localStorage.removeItem('quant_token');
    setAuthError(null);
    setSuccessMsg(null);
    setAnnounceMsg("Logged out of examPaper. Returned to sign-in portal.");
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email || !password) return;

    try {
      const response = await fetch('/api/auth/login', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        const err = data.error || "Login verification failed.";
        setAuthError(err);
        setAnnounceMsg(`Login error: ${err}`);
        return;
      }

      setAuthToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('quant_token', data.token);
      setSuccessMsg("Logged in successfully!");
      setAnnounceMsg(`Login successful. Signed in as ${data.user.full_name}, role ${data.user.role}.`);
      // Reset text inputs
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError("Could not reach secure login server.");
      setAnnounceMsg("Error: Could not reach secure login server.");
    }
  };

  // Register handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMsg(null);

    if (!email || !password || !fullName || !institution) {
      setAuthError("Please fill in all requested fields.");
      setAnnounceMsg("Error: Please fill in all requested fields.");
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: regRole,
          full_name: fullName,
          email,
          password,
          institution,
          student_id: regRole === 'student' ? studentIdInput : undefined,
          department: regRole === 'teacher' ? departmentInput : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        const err = data.error || "Registration validation failed.";
        setAuthError(err);
        setAnnounceMsg(`Registration error: ${err}`);
        return;
      }

      setAuthToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('quant_token', data.token);
      setSuccessMsg("Account registered successfully!");
      setAnnounceMsg(`Account created. Signed in as ${data.user.full_name}.`);
      
      // Clear inputs
      setFullName('');
      setEmail('');
      setPassword('');
      setInstitution('');
      setStudentIdInput('');
      setDepartmentInput('');
    } catch (err) {
      setAuthError("Connection issue during registration.");
      setAnnounceMsg("Error: Connection issue during registration.");
    }
  };

  // Screen Reader Intelligent Read-Aloud Handler for Blind Educators and Students
  const handleReadCurrentScreenAloud = () => {
    let summaryText = "";
    if (activeSession) {
      summaryText = `Exam Session Active for assessment room ${activeSession.room?.title || 'examination'}. Use option choices or press Alt plus R to read questions aloud.`;
    } else if (currentUser) {
      if (currentUser.role === 'teacher') {
        summaryText = `Welcome to the Teacher Portal, ${currentUser.full_name}. You are logged in at ${currentUser.institution}. Four management tabs are available: Examination Rooms, Approval Waiting Lobby, Real-time Activity Deck, and Performance Analytics. Press Tab to navigate controls or create a new examination room.`;
      } else if (currentUser.role === 'admin') {
        summaryText = `Welcome to the Governance Administration Portal, ${currentUser.full_name}. Here you can audit platform accounts, manage student and lecturer permissions, and monitor server health. Press Tab to browse the registered user directories.`;
      } else if (currentUser.role === 'student') {
        summaryText = `Welcome to the Student Portal, ${currentUser.full_name} at ${currentUser.institution}. Here you can view assigned examinations, join live rooms, or inspect past performance results. Press Tab to view available exam rooms.`;
      }
    } else {
      summaryText = `Welcome to examPaper AI-Powered Examination Platform. You are on the authentication gateway. Press Tab to enter sign-in credentials or switch to registration.`;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(summaryText);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative" id="exampaper_root">
      
      {/* ACCESSIBLE SKIP TO MAIN CONTENT LINK (WCAG 2.1 AA) */}
      <a 
        href="#main_content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[10000] focus:px-5 focus:py-3 focus:bg-yellow-400 focus:text-slate-950 font-bold font-sans text-xs rounded-xl border-2 border-slate-900 shadow-2xl transition focus:outline-none focus:ring-4 focus:ring-cyan-500"
      >
        Skip to Main Content (Option ⌥ + 1)
      </a>

      {/* 2. CHIEF HEADER & BRAND CAROUSEL */}
      {!activeSession && (
        <nav className="bg-slate-900 border-b border-slate-850 px-6 py-4 flex items-center justify-between sticky top-0 z-45" id="main_dashboard_navbar">
          <div className="flex items-center gap-3">
            {/* examPaper Brand Logo Badge matching attached logo design */}
            <div className="px-3 py-1.5 rounded-xl bg-[#00A8CC] text-slate-950 font-display text-base flex items-center shadow-md shadow-cyan-500/20 tracking-tight select-none">
              <span className="text-white font-medium">exam</span>
              <span className="text-black font-extrabold ml-0.5">Paper</span>
            </div>
            <div>
              <span className="font-display font-bold text-lg text-slate-100 tracking-tight leading-none block">
                exam<span className="text-cyan-400">Paper</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400 lowercase tracking-wider">
                {currentUser ? currentUser.institution : translations[currentLang].appName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* LANGUAGE SELECTOR PILL */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800" role="group" aria-label="Language Selector">
              <Globe className="w-3.5 h-3.5 text-cyan-400 ml-1.5" aria-hidden="true" />
              <button
                onClick={() => setCurrentLang('en')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  currentLang === 'en' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
                aria-label="Set English Language"
              >
                EN
              </button>
              <button
                onClick={() => setCurrentLang('uz')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  currentLang === 'uz' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
                aria-label="O'zbek tiliga o'tkazish"
              >
                UZ
              </button>
              <button
                onClick={() => setCurrentLang('ru')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  currentLang === 'ru' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
                aria-label="Переключить на Русский язык"
              >
                RU
              </button>
            </div>

            {/* LIGHT / DARK THEME TOGGLE BUTTON */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              id="theme_toggle_btn"
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 text-slate-200 shadow-sm"
              title={theme === 'dark' ? translations[currentLang].lightTheme : translations[currentLang].darkTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline text-amber-300 font-medium">{translations[currentLang].lightTheme}</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="hidden sm:inline text-indigo-600 font-medium">{translations[currentLang].darkTheme}</span>
                </>
              )}
            </button>

            {currentUser && (
              <>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200">{currentUser.full_name}</span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{currentUser.role}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  id="btn_logout"
                  className="p-2 bg-slate-850 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-red-400 border border-slate-800 hover:border-slate-750 cursor-pointer transition flex items-center gap-1 text-xs font-mono"
                  title="Logout session"
                >
                  <LogOut className="w-4 h-4" /> <span className="hidden md:inline">{translations[currentLang].logout}</span>
                </button>
              </>
            )}
          </div>
        </nav>
      )}

      {/* 3. DYNAMIC WORKSPACE ROUTER VIEWPORT */}
      {activeSession ? (
        <ExamScreen
          room={activeSession.room}
          questions={activeSession.questions}
          authToken={authToken!}
          currentLang={currentLang}
          onFinished={() => {
            setActiveSession(null);
            // Force status reload
            window.location.reload();
          }}
        />
      ) : currentUser ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 outline-none" id="main_content" tabIndex={-1}>
          {currentUser.role === 'student' && (
            <StudentPortal
              user={currentUser}
              authToken={authToken!}
              currentLang={currentLang}
              onEnterExam={(room, questions) => {
                setActiveSession({ room, questions });
              }}
            />
          )}

          {currentUser.role === 'teacher' && (
            <TeacherPortal
              user={currentUser}
              authToken={authToken!}
              currentLang={currentLang}
            />
          )}

          {currentUser.role === 'admin' && (
            <AdminPortal
              authToken={authToken!}
              currentLang={currentLang}
            />
          )}
        </main>
      ) : (
        /* 4. LANDING AND AUTHENTICATION GATEWAY */
        <div className="flex-1 flex flex-col justify-center items-center p-6" id="exampaper_auth_lobby">
          <div className="max-w-md w-full text-center space-y-6 mb-6 mt-4">
            <div className="space-y-4">
              {/* Main examPaper Logo Badge */}
              <div className="inline-flex items-center justify-center px-7 py-3.5 rounded-2xl bg-[#00A8CC] shadow-2xl shadow-cyan-500/30 mx-auto select-none transform hover:scale-105 transition-transform duration-200">
                <span className="font-display font-medium text-3xl md:text-4xl text-white tracking-tight">exam</span>
                <span className="font-display font-extrabold text-3xl md:text-4xl text-black tracking-tight ml-0.5">Paper</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold text-slate-100 tracking-tight leading-none">
                exam<span className="text-cyan-400">Paper</span>
              </h1>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                {translations[currentLang].tagline}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-850 shadow-2xl rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Form Title & Toggles */}
            <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800" id="auth_portal_toggles">
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition overflow-hidden cursor-pointer ${
                  !isRegisterMode ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {translations[currentLang].signIn}
              </button>
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition overflow-hidden cursor-pointer ${
                  isRegisterMode ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {translations[currentLang].register}
              </button>
            </div>

            {authError && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl text-center font-medium">
                {authError}
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-center font-medium">
                {successMsg}
              </p>
            )}

            {/* REGISTER PORTAL FORM */}
            {isRegisterMode ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-4" id="register_form">
                
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-mono font-bold text-left block">{translations[currentLang].educationalCapacity}:</label>
                  <div className="grid grid-cols-2 gap-3" id="selection_reg_role">
                    <button
                      type="button"
                      onClick={() => setRegRole('student')}
                      className={`py-3 px-4 rounded-xl border text-center font-medium font-mono text-xs cursor-pointer transition ${
                        regRole === 'student' ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-950 border-slate-850 text-slate-400'
                      }`}
                    >
                      🎓 {translations[currentLang].studentRole}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('teacher')}
                      className={`py-3 px-4 rounded-xl border text-center font-medium font-mono text-xs cursor-pointer transition ${
                        regRole === 'teacher' ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-950 border-slate-850 text-slate-400'
                      }`}
                    >
                      👨‍🏫 {translations[currentLang].teacherRole}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-mono text-left block">{translations[currentLang].fullNameLabel}:</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded-xl px-4 py-2 text-xs placeholder-slate-700 text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-mono text-left block">{translations[currentLang].emailLabel}:</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded-xl px-4 py-2 text-xs placeholder-slate-700 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-mono text-left block">{translations[currentLang].passwordLabel}:</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded-xl px-4 py-2 text-xs placeholder-slate-700 text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-mono text-left block">{translations[currentLang].institutionLabel}:</label>
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded-xl px-4 py-2 text-xs placeholder-slate-700 text-slate-200 focus:outline-none"
                  />
                </div>

                {/* Sub Role details inputs */}
                {regRole === 'student' ? (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-xs text-slate-400 font-mono text-left block">{translations[currentLang].studentIdLabel}:</label>
                    <input
                      type="text"
                      required
                      value={studentIdInput}
                      onChange={(e) => setStudentIdInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded-xl px-4 py-2 text-xs placeholder-slate-700 text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-xs text-slate-400 font-mono text-left block">{translations[currentLang].departmentLabel}:</label>
                    <input
                      type="text"
                      required
                      value={departmentInput}
                      onChange={(e) => setDepartmentInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded-xl px-4 py-2 text-xs placeholder-slate-700 text-slate-100 focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  id="btn_register"
                  className="w-full mt-4 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition select-none flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {translations[currentLang].createAccountBtn} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* LOGIN PORTAL FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-4" id="login_form">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-mono text-left block">{translations[currentLang].emailLabel}:</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs placeholder-slate-700 text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-mono text-left block">{translations[currentLang].passwordLabel}:</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs placeholder-slate-700 text-slate-100 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  id="btn_login"
                  className="w-full mt-4 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition select-none flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {translations[currentLang].signInBtn} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. GREETING FOOTER */}
      <footer className="py-6 border-t border-slate-900 text-center text-[10px] font-mono text-slate-600 shrink-0">
        examPaper Assessment Services, International Inc. © 2026. All Rights Reserved.
      </footer>

      {/* 6. ACCESSIBILITY OVERLAY TOOLBAR FOR SCREEN READERS & BLIND EDUCATORS */}
      <AccessibilityToolbar
        announceMessage={announceMsg}
        onReadAloudRequest={handleReadCurrentScreenAloud}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        currentTheme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
}
