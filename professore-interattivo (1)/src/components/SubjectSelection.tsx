import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Sparkles, GraduationCap, History, ArrowRight } from 'lucide-react';

interface SubjectSelectionProps {
  onStart: (subject: string, topic: string) => void;
  isLoading: boolean;
  historyCount: number;
  onViewHistory: () => void;
}

const PRESETS = [
  {
    subject: 'Storia',
    icon: '⏳',
    topics: ['La Seconda Guerra Mondiale', 'La Rivoluzione Francese', 'L\'Impero Romano']
  },
  {
    subject: 'Biologia',
    icon: '🌿',
    topics: ['La fotosintesi clorofilliana', 'La struttura della cellula', 'Il sistema circolatorio']
  },
  {
    subject: 'Letteratura Italiana',
    icon: '✍️',
    topics: ['Dante Alighieri e la Divina Commedia', 'Giacomo Leopardi', 'I Promessi Sposi']
  },
  {
    subject: 'Scienze',
    icon: '⚛️',
    topics: ['Il sistema solare', 'La tavola periodica degli elementi', 'La tettonica delle placche']
  },
];

export default function SubjectSelection({ onStart, isLoading, historyCount, onViewHistory }: SubjectSelectionProps) {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim() && topic.trim()) {
      onStart(subject.trim(), topic.trim());
    }
  };

  const selectPreset = (index: number, sub: string, top: string) => {
    setSubject(sub);
    setTopic(top);
    setActivePreset(index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto w-full"
      id="subject-selection-container"
    >
      {/* Title & Welcoming message */}
      <div className="text-center mb-10" id="welcome-header">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-4 shadow-sm" id="welcome-badge">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Professore Interattivo AI
        </h1>
        <p className="text-slate-600 text-lg max-w-xl mx-auto">
          Preparati al meglio per i tuoi esami! Scegli una materia, specifica un argomento e lascia che il professore ti metta alla prova.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" id="main-content-grid">
        {/* Left side: Input form */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-md border border-slate-200/60" id="selection-form-card">
          <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Configura la Sessione
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5" id="session-setup-form">
            <div>
              <label htmlFor="subject-input" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Materia da studiare/ripassare
              </label>
              <input
                id="subject-input"
                type="text"
                placeholder="es. Storia, Matematica, Filosofia..."
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setActivePreset(null);
                }}
                className="w-full bg-white border-2 border-slate-200 rounded-2xl py-3.5 px-5 shadow-sm focus:border-indigo-500 focus:outline-none text-slate-800 transition-all placeholder-slate-400 font-medium"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="topic-input" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Argomento specifico
              </label>
              <input
                id="topic-input"
                type="text"
                placeholder="es. La Rivoluzione Industriale, I Polinomi..."
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setActivePreset(null);
                }}
                className="w-full bg-white border-2 border-slate-200 rounded-2xl py-3.5 px-5 shadow-sm focus:border-indigo-500 focus:outline-none text-slate-800 transition-all placeholder-slate-400 font-medium"
                required
                disabled={isLoading}
              />
            </div>

            <button
              id="start-interrogation-button"
              type="submit"
              disabled={isLoading || !subject.trim() || !topic.trim()}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isLoading || !subject.trim() || !topic.trim()
                  ? 'bg-slate-300 shadow-none cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generazione prima domanda...</span>
                </>
              ) : (
                <>
                  <span>Inizia l'interrogazione</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right side: History quick access / Info */}
        <div className="space-y-4" id="sidebar-info-panel">
          {historyCount > 0 && (
            <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100 rounded-3xl p-5 shadow-sm" id="history-shortcut-card">
              <h3 className="text-slate-800 font-bold mb-1 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                Pagelle Precedenti
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Hai {historyCount} sessione/i registrate nel tuo storico locale.
              </p>
              <button
                id="view-history-button"
                onClick={onViewHistory}
                className="w-full bg-white hover:bg-slate-100 text-indigo-650 border-2 border-indigo-100 py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Vedi storico valutazioni
              </button>
            </div>
          )}

          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm" id="prof-guide-card">
            <h3 className="text-slate-800 font-bold mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Come Funziona?
            </h3>
            <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Digita una materia e l'argomento specifico.</li>
              <li>Il professore ti farà domande personalizzate.</li>
              <li>Rispondi in modo discorsivo per spiegare ciò che sai.</li>
              <li>Ricevi spiegazioni dettagliate sui tuoi errori.</li>
              <li>Scrivi o premi <span className="font-semibold text-rose-500">"Termina"</span> per concludere e ricevere la pagella finale.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Preset Recommendations */}
      <div id="presets-container" className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm mb-12">
        <h3 className="text-md font-bold text-slate-700 mb-4 flex items-center gap-2">
          💡 Idee pronte da ripassare
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESETS.map((preset, idx) => (
            <div key={idx} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-150 shadow-sm" id={`preset-card-${idx}`}>
              <div className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                <span className="text-xl">{preset.icon}</span>
                <span>{preset.subject}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {preset.topics.map((t, tIdx) => (
                  <button
                    key={tIdx}
                    id={`preset-topic-btn-${idx}-${tIdx}`}
                    onClick={() => selectPreset(idx, preset.subject, t)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all text-slate-600 border border-slate-200 cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
