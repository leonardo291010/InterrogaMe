import React from 'react';
import { motion } from 'motion/react';
import { Award, AlertTriangle, CheckCircle2, RefreshCw, ChevronRight, FileText, ArrowLeft } from 'lucide-react';
import { EvaluationResult } from '../types';

interface EvaluationReportProps {
  evaluation: EvaluationResult;
  onRestart: () => void;
}

// A safe, custom markdown element renderer for the summary text
function SimpleMarkdown({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-3 text-slate-750 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;

        // Check for list item
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const content = trimmed.substring(1).trim();
          return (
            <ul key={idx} className="list-disc pl-5 my-1 text-slate-700">
              <li>{renderFormattedText(content)}</li>
            </ul>
          );
        }

        return <p key={idx}>{renderFormattedText(trimmed)}</p>;
      })}
    </div>
  );
}

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function EvaluationReport({ evaluation, onRestart }: EvaluationReportProps) {
  const { subject, topic, grade, gradeExplanation, weakPoints, progress, generalSummary, questionCount } = evaluation;

  // Grade badge styling mapping (1-10)
  const getGradeStyle = (v: number) => {
    if (v >= 8) {
      return {
        borderColor: 'border-emerald-200',
        bgColor: 'bg-emerald-50',
        circleBg: 'from-emerald-500 to-teal-500',
        circleRing: 'border-emerald-100',
        textAccent: 'text-emerald-650',
        shadow: 'shadow-emerald-100',
        title: 'Eccellente! 🌟',
      };
    } else if (v >= 6) {
      return {
        borderColor: 'border-amber-250',
        bgColor: 'bg-amber-50/50',
        circleBg: 'from-amber-400 to-orange-500',
        circleRing: 'border-amber-100',
        textAccent: 'text-amber-700',
        shadow: 'shadow-amber-100',
        title: 'Sufficiente / Buono 👍',
      };
    } else {
      return {
        borderColor: 'border-rose-200',
        bgColor: 'bg-rose-50/30',
        circleBg: 'from-rose-500 to-orange-500',
        circleRing: 'border-rose-100',
        textAccent: 'text-rose-650',
        shadow: 'shadow-rose-100',
        title: 'Da Ripassare 📚',
      };
    }
  };

  const style = getGradeStyle(grade);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto w-full pb-16"
      id="report-card-container"
    >
      {/* Title block */}
      <div className="text-center mb-8" id="report-title-block">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold text-indigo-700 mb-3 uppercase tracking-wider">
          <Award className="w-4 h-4" />
          Risultati della Valutazione
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          La tua Pagella Finale
        </h1>
        <p className="text-slate-500 font-medium text-sm mt-1">
          {subject} — <span className="text-slate-750 font-semibold">{topic}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" id="report-grid">
        {/* Left Card: Grade circle and explanation */}
        <div className="md:col-span-1 bg-white rounded-3xl p-6 shadow-md border border-slate-200 flex flex-col items-center text-center justify-between" id="report-grade-card">
          <div className="w-full">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Voto Finale</h3>
            
            {/* Elegant Circular Grade Badge */}
            <div className={`relative w-36 h-36 mx-auto rounded-full flex items-center justify-center border-8 ${style.circleRing} shadow-md mb-5`} id="grade-radial-circle">
              <div className={`absolute inset-1 rounded-full bg-gradient-to-tr ${style.circleBg} flex flex-col items-center justify-center text-white shadow-inner`}>
                <span className="text-5xl font-black font-sans tracking-tighter">{grade}</span>
                <span className="text-[10px] font-bold tracking-widest opacity-85 uppercase mt-0.5">su 10</span>
              </div>
            </div>

            <span className={`text-md font-extrabold ${style.textAccent} block mb-2`}>
              {style.title}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-2 w-full" id="grade-explanation-block">
            <span className="font-bold text-xs text-slate-400 uppercase block text-left mb-1.5">Giudizio sintetico:</span>
            <p className="text-xs text-slate-600 leading-relaxed text-left font-medium">
              {gradeExplanation}
            </p>
          </div>
          
          <div className="text-xs text-slate-400 font-bold font-mono mt-4">
            {questionCount} domande risposte
          </div>
        </div>

        {/* Right Cards: Weak points and Progress / Strengths */}
        <div className="md:col-span-2 space-y-6" id="report-details-cards">
          {/* Strengths / Progress */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200" id="progress-strengths-card">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Progressi e Punti di Forza
            </h3>
            {progress && progress.length > 0 ? (
              <ul className="space-y-2.5">
                {progress.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-700 leading-relaxed bg-emerald-50 border border-emerald-200/60 p-3 rounded-xl" id={`progress-item-${idx}`}>
                    <span className="text-emerald-600 select-none font-extrabold mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">Nessun punto di forza particolare registrato per questa sessione.</p>
            )}
          </div>

          {/* Weak points */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200" id="weak-points-card">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Punti Deboli e da Approfondire
            </h3>
            {weakPoints && weakPoints.length > 0 ? (
              <ul className="space-y-2.5">
                {weakPoints.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-700 leading-relaxed bg-amber-50 border border-amber-200/60 p-3 rounded-xl" id={`weak-point-item-${idx}`}>
                    <span className="text-amber-600 select-none font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-650 font-bold bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                🎉 Bravissimo! Il professore non ha riscontrato lacune significative.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* General Teacher Summary Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-200 mb-8" id="general-summary-card">
        <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-slate-200">
          <FileText className="w-5 h-5 text-indigo-600" />
          Riepilogo e Consigli di Studio del Professore
        </h3>
        <SimpleMarkdown text={generalSummary} />
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4" id="report-actions">
        <button
          id="start-new-session-btn"
          onClick={onRestart}
          className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Inizia una nuova sessione</span>
        </button>
      </div>
    </motion.div>
  );
}
