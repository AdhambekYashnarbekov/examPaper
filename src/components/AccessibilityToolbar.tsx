import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Eye, Type, Keyboard, X, Globe, Sun, Moon } from 'lucide-react';
import { Language, translations } from '../translations';

interface AccessibilityToolbarProps {
  announceMessage: string;
  onReadAloudRequest?: () => void;
  currentLang?: Language;
  onLanguageChange?: (lang: Language) => void;
  currentTheme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
}

export default function AccessibilityToolbar({
  announceMessage,
  onReadAloudRequest,
  currentLang = 'en',
  onLanguageChange,
  currentTheme = 'dark',
  onThemeChange
}: AccessibilityToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const t = translations[currentLang] || translations.en;

  // Map app languages to Web Speech API BC47 tags
  const speechLangMap: Record<Language, string> = {
    en: 'en-US',
    uz: 'uz-UZ',
    ru: 'ru-RU'
  };

  // Monitor live announcements and trigger TTS if enabled
  useEffect(() => {
    if (!announceMessage) return;

    if (speechEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel previous
      const utterance = new SpeechSynthesisUtterance(announceMessage);
      utterance.lang = speechLangMap[currentLang];
      utterance.rate = speechRate;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  }, [announceMessage, speechEnabled, speechRate, currentLang]);

  // Apply font size class to root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-size-large', 'text-size-xlarge');
    if (fontSize === 'large') root.classList.add('text-size-large');
    if (fontSize === 'xlarge') root.classList.add('text-size-xlarge');
  }, [fontSize]);

  // Apply high contrast mode to body
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
  }, [highContrast]);

  // macOS & iOS VoiceOver Blind Mode Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Support macOS Option (⌥), Command (⌘), and VoiceOver VO (Ctrl+Option) key combinations
      const isMacModifier = e.altKey || e.metaKey || (e.ctrlKey && e.altKey);
      
      if (!isMacModifier) return;

      // Option/Cmd + A: Toggle Accessibility & Screen Reader Panel
      if (e.code === 'KeyA' || e.key.toLowerCase() === 'a' || e.key === 'å') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      // Option/Cmd + R: VoiceOver Read Current Screen / Question Aloud
      if (e.code === 'KeyR' || e.key.toLowerCase() === 'r' || e.key === '®') {
        e.preventDefault();
        if (onReadAloudRequest) {
          onReadAloudRequest();
        } else if (announceMessage) {
          speakText(announceMessage);
        }
      }

      // Option/Cmd + 1: Skip to Main Content (macOS Blind Mode)
      if (e.code === 'Digit1' || e.key === '1' || e.key === '¡') {
        e.preventDefault();
        const mainEl = document.getElementById('main_content') || document.querySelector('main');
        if (mainEl) {
          mainEl.setAttribute('tabindex', '-1');
          mainEl.focus();
          speakText('Moved focus to main screen content.');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onReadAloudRequest, announceMessage]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLangMap[currentLang];
      utterance.rate = speechRate;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  return (
    <>
      {/* SCREEN READER LIVE ANNOUNCEMENT REGIONS (WCAG 2.1 AA) */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only" 
        id="a11y-live-polite"
      >
        {announceMessage}
      </div>

      <div 
        role="alert" 
        aria-live="assertive" 
        aria-atomic="true" 
        className="sr-only" 
        id="a11y-live-assertive"
      />

      {/* FLOATING ACCESSIBILITY CONTROLLER BAR */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
        {/* Toggle Panel Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="accessibility-settings-panel"
          aria-label={`${t.accessibilityBtn} (Alt+A)`}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2.5 rounded-full font-bold shadow-2xl flex items-center gap-2 cursor-pointer border-2 border-slate-900 focus-visible:outline-4 focus-visible:outline-yellow-400 transition-all hover:scale-105"
        >
          <Volume2 className="w-5 h-5" aria-hidden="true" />
          <span className="text-xs tracking-tight font-sans">{t.accessibilityBtn}</span>
        </button>

        {/* ACCESSIBILITY CONTROL PANEL */}
        {isOpen && (
          <div
            id="accessibility-settings-panel"
            role="region"
            aria-label="Accessibility Settings and Screen Reader Assistant"
            className="w-80 md:w-96 bg-slate-900 border-2 border-cyan-500/40 rounded-2xl p-5 shadow-2xl text-slate-100 space-y-5 animate-fade-in backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-cyan-400" aria-hidden="true" />
                <h2 className="font-display font-bold text-base text-slate-100">{t.screenReaderTitle}</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Accessibility Panel"
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Language Switcher Section */}
            <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-cyan-400" aria-hidden="true" /> Interface Language / Til / Язык
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { code: 'en' as const, label: 'English 🇺🇸' },
                  { code: 'uz' as const, label: "O'zbek 🇺🇿" },
                  { code: 'ru' as const, label: 'Русский 🇷🇺' }
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => onLanguageChange && onLanguageChange(item.code)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                      currentLang === item.code
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                    aria-label={`Switch language to ${item.label}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Read Aloud Voice Assistant */}
            <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-cyan-400" aria-hidden="true" /> {t.voiceSpeechAssistant}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={speechEnabled}
                    onChange={(e) => setSpeechEnabled(e.target.checked)}
                    className="sr-only peer"
                    aria-label="Enable Automatic Speech Voice Assistant"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* Action Read Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    if (onReadAloudRequest) {
                      onReadAloudRequest();
                    } else if (announceMessage) {
                      speakText(announceMessage);
                    } else {
                      speakText(t.keyboardGuide);
                    }
                  }}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  aria-label={t.readAloudBtn}
                >
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" /> {t.readAloudBtn}
                </button>
                {speaking && (
                  <button
                    onClick={stopSpeaking}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                    aria-label={t.stopBtn}
                  >
                    <VolumeX className="w-3.5 h-3.5" aria-hidden="true" /> {t.stopBtn}
                  </button>
                )}
              </div>

              {/* Speed Controller */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{t.speechSpeed}</span>
                  <span>{speechRate}x</span>
                </div>
                <div className="flex gap-1.5">
                  {[0.8, 1, 1.2, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setSpeechRate(rate)}
                      className={`flex-1 py-1 text-[11px] font-mono font-bold rounded border cursor-pointer ${
                        speechRate === rate
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      aria-label={`Set speech rate to ${rate} times speed`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Display & Text Size Controls */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-cyan-400" aria-hidden="true" /> {t.textSize}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'normal', label: t.standardSize },
                  { key: 'large', label: t.largeSize },
                  { key: 'xlarge', label: t.xlargeSize }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFontSize(item.key as any)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                      fontSize === item.key
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                    aria-label={`Set font size to ${item.label}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Theme Control (Dark / Light) */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                {currentTheme === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
                )}
                {t.themeLabel}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onThemeChange && onThemeChange('dark')}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    currentTheme === 'dark'
                      ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  aria-label="Switch to Dark Mode"
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.darkTheme}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onThemeChange && onThemeChange('light')}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    currentTheme === 'light'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  aria-label="Switch to Light Mode"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.lightTheme}</span>
                </button>
              </div>
            </div>

            {/* High Contrast Mode Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-cyan-400" aria-hidden="true" /> {t.highContrast}
              </span>
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer transition ${
                  highContrast
                    ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
                aria-label={highContrast ? 'High Contrast Mode Enabled' : 'Enable High Contrast Mode'}
              >
                {highContrast ? t.on : t.off}
              </button>
            </div>

            {/* Keyboard Guide (macOS / VoiceOver Blind Mode Optimized) */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px] text-slate-400 font-sans">
              <div className="font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Keyboard className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" /> {t.keyboardGuide} (macOS VoiceOver):
                </span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  macOS / iOS
                </span>
              </div>
              <ul className="space-y-1 text-slate-400 list-disc list-inside">
                <li><kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300">Option ⌥ + A</kbd> / <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300">⌘ ⌥ A</kbd>: Accessibility menu</li>
                <li><kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300">Option ⌥ + R</kbd> / <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300">⌘ ⌥ R</kbd>: Read question aloud</li>
                <li><kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300">Option ⌥ + 1</kbd> / <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300">⌘ ⌥ 1</kbd>: Skip to main content</li>
                <li><kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300">Option ⌥ + A/B/C/D</kbd> or <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300">1/2/3/4</kbd>: Select exam choice</li>
                <li><kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300">Option ⌥ + → / ←</kbd>: Next / Previous question</li>
                <li><kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300">Tab</kbd> / <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-cyan-300">Shift + Tab</kbd>: VoiceOver element navigation</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

