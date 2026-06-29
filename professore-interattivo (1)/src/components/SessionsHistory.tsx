import React from 'react';
import { motion } from 'motion/react';
import { History, Trash2, Calendar, Award, ChevronRight, ArrowLeft } from 'lucide-react';
import { EvaluationResult } from '../types';

interface SessionsHistoryProps {
  sessions: EvaluationResult[];
  onSelectSession: (session: EvaluationResult) => void;
  onClearHistory: () => void;
  onBack: () => void;
}

export default function SessionsHistory({ sessions, onSelectSession, onClearHistory, onBack }: SessionsHistoryProps) {
  
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 8) return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    if (grade >= 6) return 'bg-amber-50 text-amber-800 border-amber-100';
    return 'bg-rose-50 text-rose-800 border-rose-100';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto w-full"
      id="history-view-container"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8" id="history-header">
        <div className="flex items-center gap-3">
          <button
            id="history-back-btn"
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Torna indietro"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-indigo-600" />
              Storico delle Valutazioni
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-0.5">
              Tieni traccia delle tue interrogazioni e dei progressi fatti
            </p>
          </div>
        </div>

        {sessions.length > 0 && (
          <button
            id="clear-all-history-btn"
            onClick={onClearHistory}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold border border-rose-200 rounded-xl py-2 px-4 transition-colors cursor-pointer flex items-center gap-1.5 self-end sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Cancella Storico</span>
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center bg-white rounded-3xl p-12 border border-slate-200 shadow-sm" id="empty-history-state">
          <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Nessuna valutazione ancora registrata</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Completa la tua prima interrogazione con il professore per salvare la tua pagella qui.
          </p>
          <button
            id="history-back-setup-btn"
            onClick={onBack}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-6 rounded-xl shadow transition-transform active:scale-[0.98] cursor-pointer"
          >
            Inizia il primo ripasso
          </button>
        </div>
      ) : (
        <div className="space-y-4" id="sessions-list">
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectSession(session)}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4 group"
              id={`history-session-row-${session.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap text-xs text-slate-400 font-semibold font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(session.timestamp)}
                  </span>
                  <span>•</span>
                  <span>{session.questionCount} domande</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug truncate">
                  {session.subject}
                </h3>
                <p className="text-xs text-slate-650 font-semibold truncate mt-0.5">
                  Argomento: <span className="text-slate-800 font-bold">{session.topic}</span>
                </p>
              </div>

              {/* Grade Badge & Chevron */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border font-sans font-black text-lg ${getGradeColor(session.grade)} shadow-sm`}>
                  {session.grade}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
