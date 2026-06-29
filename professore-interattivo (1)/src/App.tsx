import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, History, Sparkles, BookOpen, ChevronLeft, AlertCircle } from 'lucide-react';
import { InterrogationStage, HistoryItem, EvaluationResult } from './types';
import SubjectSelection from './components/SubjectSelection';
import InterrogationSession from './components/InterrogationSession';
import EvaluationReport from './components/EvaluationReport';
import SessionsHistory from './components/SessionsHistory';

const LOCAL_STORAGE_KEY = 'prof_interattivo_sessions';

export default function App() {
  const [stage, setStage] = useState<InterrogationStage>('SETUP');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [activeEvaluation, setActiveEvaluation] = useState<EvaluationResult | null>(null);
  const [allSessions, setAllSessions] = useState<EvaluationResult[]>([]);
  const [viewHistory, setViewHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setAllSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Impossibile caricare lo storico da localStorage:", e);
    }
  }, []);

  // Start the interrogation
  const handleStartInterrogation = async (selectedSubject: string, selectedTopic: string) => {
    setIsStarting(true);
    setError(null);
    try {
      const response = await fetch('/api/start-interrogation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: selectedSubject, topic: selectedTopic }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Errore durante la creazione della sessione.');
      }

      const data = await response.json();
      setSubject(selectedSubject);
      setTopic(selectedTopic);
      setCurrentQuestion(data.question);
      setHistory([]);
      setStage('ACTIVE');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connessione al server non riuscita. Riprova.');
    } finally {
      setIsStarting(false);
    }
  };

  // Submit student response and evaluate it
  const handleSubmitAnswer = async (answer: string) => {
    setError(null);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          history,
          studentAnswer: answer,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Impossibile correggere la risposta.');
      }

      const data = await response.json();

      // Append to local history
      const newHistoryItem: HistoryItem = {
        question: currentQuestion,
        answer,
        feedback: data.feedback,
        evaluation: data.evaluation,
        explanation: data.explanation,
      };

      setHistory(prev => [...prev, newHistoryItem]);
      setCurrentQuestion(data.nextQuestion);

      return data;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Errore di connessione. Riprova.');
      throw err;
    }
  };

  // End interrogation and compile report card
  const handleFinishInterrogation = async () => {
    if (history.length === 0) {
      // If student hasn't answered anything yet, go back to SETUP stage
      setStage('SETUP');
      return;
    }

    setIsFinishing(true);
    setError(null);
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          history,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Impossibile completare la valutazione.');
      }

      const data = await response.json();

      const newEvalResult: EvaluationResult = {
        id: Math.random().toString(36).substr(2, 9),
        subject,
        topic,
        grade: data.grade,
        gradeExplanation: data.gradeExplanation,
        weakPoints: data.weakPoints,
        progress: data.progress,
        generalSummary: data.generalSummary,
        timestamp: new Date().toISOString(),
        questionCount: history.length,
      };

      // Save to state and localStorage
      const updatedSessions = [newEvalResult, ...allSessions];
      setAllSessions(updatedSessions);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSessions));

      setActiveEvaluation(newEvalResult);
      setStage('EVALUATED');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Errore durante la compilazione del report finale.');
    } finally {
      setIsFinishing(false);
    }
  };

  const handleSelectHistoricalSession = (session: EvaluationResult) => {
    setActiveEvaluation(session);
    setSubject(session.subject);
    setTopic(session.topic);
    setStage('EVALUATED');
    setViewHistory(false);
  };

  const handleClearHistory = () => {
    if (window.confirm("Sei sicuro di voler cancellare tutto lo storico delle valutazioni? Questa azione è irreversibile.")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setAllSessions([]);
    }
  };

  const resetToSetup = () => {
    setSubject('');
    setTopic('');
    setCurrentQuestion('');
    setHistory([]);
    setActiveEvaluation(null);
    setStage('SETUP');
    setViewHistory(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900" id="app-root-div">
      
      {/* Visual background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-indigo-50/50 via-transparent to-transparent pointer-events-none" />

      {/* Primary Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 transition-all shadow-sm" id="main-app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={resetToSetup} id="header-logo-group">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm" id="logo-icon-box">
              👨‍🏫
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-800">
                AcademiAI <span className="text-indigo-600 text-xs font-semibold ml-1 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100/50">Professore Virtuale</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 border-r border-slate-200 pr-4 py-1">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Studente</span>
                <span className="text-xs font-bold text-slate-700 font-sans">Marco Rossi</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                MR
              </div>
            </div>

            <div className="flex items-center gap-3">
            {stage === 'SETUP' && !viewHistory && allSessions.length > 0 && (
              <button
                id="header-history-btn"
                onClick={() => setViewHistory(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 px-3.5 py-2 rounded-xl border border-slate-200/60 transition-all cursor-pointer"
              >
                <History className="w-4 h-4" />
                <span>Storico Pagelle</span>
              </button>
            )}

            {viewHistory && (
              <button
                id="header-back-setup-btn"
                onClick={() => setViewHistory(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200/60 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Nuova Sessione</span>
              </button>
            )}

            {stage !== 'SETUP' && (
              <button
                id="header-quit-btn"
                onClick={() => {
                  if (stage === 'ACTIVE') {
                    if (window.confirm("Vuoi davvero abbandonare l'interrogazione attiva? I progressi di questa sessione andranno persi.")) {
                      resetToSetup();
                    }
                  } else {
                    resetToSetup();
                  }
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 py-2 px-3.5 rounded-xl transition-all border border-transparent hover:border-slate-200 cursor-pointer"
              >
                Esci
              </button>
            )}
          </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 flex flex-col justify-center" id="main-content-section">
        
        {/* Persistent Error Banner */}
        {error && (
          <div className="max-w-2xl mx-auto w-full bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-sm animate-shake" id="global-error-banner">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm">Attenzione</h4>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
            <button
              id="close-error-btn"
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-600 font-bold text-xs px-2 cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {viewHistory ? (
            <motion.div key="history-view" className="w-full">
              <SessionsHistory
                sessions={allSessions}
                onSelectSession={handleSelectHistoricalSession}
                onClearHistory={handleClearHistory}
                onBack={() => setViewHistory(false)}
              />
            </motion.div>
          ) : stage === 'SETUP' ? (
            <motion.div key="setup-stage" className="w-full">
              <SubjectSelection
                onStart={handleStartInterrogation}
                isLoading={isStarting}
                historyCount={allSessions.length}
                onViewHistory={() => setViewHistory(true)}
              />
            </motion.div>
          ) : stage === 'ACTIVE' ? (
            <motion.div key="active-stage" className="w-full">
              <InterrogationSession
                subject={subject}
                topic={topic}
                currentQuestion={currentQuestion}
                history={history}
                onSubmitAnswer={handleSubmitAnswer}
                onFinish={handleFinishInterrogation}
                isFinishing={isFinishing}
              />
            </motion.div>
          ) : stage === 'EVALUATED' && activeEvaluation ? (
            <motion.div key="evaluated-stage" className="w-full">
              <EvaluationReport
                evaluation={activeEvaluation}
                onRestart={resetToSetup}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* App Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 font-medium">
          <p>© 2026 Professore Interattivo AI — Costruito con Gemini per un apprendimento intelligente</p>
        </div>
      </footer>
    </div>
  );
}
