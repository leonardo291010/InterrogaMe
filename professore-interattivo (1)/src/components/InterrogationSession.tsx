import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Send, AlertCircle, CheckCircle, HelpCircle, GraduationCap, XCircle, ChevronRight, Award } from 'lucide-react';
import { HistoryItem } from '../types';

interface InterrogationSessionProps {
  subject: string;
  topic: string;
  currentQuestion: string;
  history: HistoryItem[];
  onSubmitAnswer: (answer: string) => Promise<{ feedback: 'correct' | 'partially_correct' | 'incorrect'; evaluation: string; explanation: string; nextQuestion: string }>;
  onFinish: () => void;
  isFinishing: boolean;
}

// A robust, safe custom parser to render simple markdown-like elements (bold, bullet lists, paragraph linebreaks)
function SimpleMarkdown({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-2.5 text-slate-700 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;

        // Check for list item
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const content = trimmed.substring(1).trim();
          return (
            <ul key={idx} className="list-disc pl-5 my-1">
              <li>{renderFormattedText(content)}</li>
            </ul>
          );
        }

        // Check for numbered list item
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
          const content = numberedMatch[2];
          return (
            <ol key={idx} className="list-decimal pl-5 my-1">
              <li>{renderFormattedText(content)}</li>
            </ol>
          );
        }

        return <p key={idx}>{renderFormattedText(trimmed)}</p>;
      })}
    </div>
  );
}

// Helper to replace **bold** markers with <strong> tags safely
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function InterrogationSession({
  subject,
  topic,
  currentQuestion,
  history,
  onSubmitAnswer,
  onFinish,
  isFinishing,
}: InterrogationSessionProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{
    answer: string;
    feedback: 'correct' | 'partially_correct' | 'incorrect';
    evaluation: string;
    explanation: string;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastFeedback && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lastFeedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const userAns = answer.trim();
      const result = await onSubmitAnswer(userAns);
      setLastFeedback({
        answer: userAns,
        feedback: result.feedback,
        evaluation: result.evaluation,
        explanation: result.explanation,
      });
      // Clear current text area for next turn
      setAnswer('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setLastFeedback(null);
  };

  const handleDontKnow = () => {
    setAnswer("Non ricordo bene questo dettaglio, professore. Può spiegarmelo?");
  };

  // Feedback styles mapping
  const feedbackConfig = {
    correct: {
      bgColor: 'bg-emerald-50/75',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-800',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
      badgeColor: 'bg-emerald-100 text-emerald-800',
      labelText: 'Corretto',
    },
    partially_correct: {
      bgColor: 'bg-amber-50/75',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-800',
      icon: <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
      badgeColor: 'bg-amber-100 text-amber-800',
      labelText: 'Parziale',
    },
    incorrect: {
      bgColor: 'bg-rose-50/75',
      borderColor: 'border-rose-200',
      textColor: 'text-rose-800',
      icon: <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
      badgeColor: 'bg-rose-100 text-rose-800',
      labelText: 'Incompleto/Errato',
    },
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-16" id="interrogation-wrapper">
        {/* Upper header dashboard */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4" id="session-dashboard-header">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              Interrogazione Attiva
            </span>
            <h2 className="text-xl font-bold text-slate-800 mt-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              {subject}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Argomento: <span className="text-slate-700 font-semibold">{topic}</span>
            </p>
          </div>

          {/* Dashboard Indicators */}
          <div className="flex items-center gap-4 self-start md:self-auto" id="dashboard-indicators">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-semibold uppercase">Domande Poste</span>
              <span className="text-lg font-extrabold text-slate-800 font-mono">
                {history.length + (lastFeedback ? 0 : 1)}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            {/* Quick circular status indicators of past turns */}
            <div className="flex items-center gap-1.5" id="history-dots">
              {history.length === 0 ? (
                <span className="text-xs text-slate-400 font-medium">Inizio sessione</span>
              ) : (
                history.slice(-6).map((item, index) => {
                  let dotClass = "bg-rose-500";
                  if (item.feedback === 'correct') dotClass = "bg-emerald-500";
                  if (item.feedback === 'partially_correct') dotClass = "bg-amber-500";
                  return (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full ${dotClass} shadow-sm`}
                      title={`Domanda ${index + 1}: ${item.feedback}`}
                    />
                  );
                })
              )}
              {history.length > 6 && <span className="text-xs text-slate-400 ml-1">+{history.length - 6}</span>}
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <button
              id="terminate-session-btn"
              onClick={onFinish}
              disabled={isFinishing}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 py-2.5 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-rose-100 shadow-sm"
            >
              {isFinishing ? (
                <span className="animate-pulse">Valutazione...</span>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Termina</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6" id="session-dialogue-flow">
          {/* Previous Answer Feedback Section (if evaluated) */}
          <AnimatePresence mode="wait">
            {lastFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
                id="feedback-card-wrapper"
              >
                {/* 1. Student answer bubble with profile block */}
                <div className="flex gap-4 flex-row-reverse items-start">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl shadow-sm flex items-center justify-center border border-indigo-200 shrink-0 text-xl select-none">
                    👤
                  </div>
                  <div className="flex flex-col gap-1.5 max-w-[80%] items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">La tua risposta:</span>
                    <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-md text-sm leading-relaxed text-left">
                      "{lastFeedback.answer}"
                    </div>
                  </div>
                </div>

                {/* 2. Professor feedback bubble & detailed explanation */}
                <div className="flex gap-4 items-start" id="feedback-card">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-200 shrink-0 text-2xl select-none">
                    👨‍🏫
                  </div>
                  <div className={`flex-1 rounded-3xl border-2 ${feedbackConfig[lastFeedback.feedback].borderColor} ${feedbackConfig[lastFeedback.feedback].bgColor} p-5 md:p-6 shadow-sm`}>
                    <div className="flex items-center justify-between border-b border-slate-200/50 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        {feedbackConfig[lastFeedback.feedback].icon}
                        <span className="font-extrabold text-slate-900 text-sm md:text-base">
                          {lastFeedback.evaluation}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${feedbackConfig[lastFeedback.feedback].badgeColor}`}>
                        {feedbackConfig[lastFeedback.feedback].labelText}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5 font-mono">
                        <GraduationCap className="w-4 h-4 text-slate-650" />
                        Spiegazione del Professore
                      </h4>
                      <SimpleMarkdown text={lastFeedback.explanation} />
                    </div>

                    <div className="flex justify-end pt-3 border-t border-slate-200/30">
                      <button
                        id="next-question-btn"
                        onClick={handleNextQuestion}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        <span>Fai la prossima domanda</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        {/* Current Question & Input Form (only show if no pending feedback) */}
        <AnimatePresence mode="wait">
          {!lastFeedback && (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
              id="active-question-section"
            >
              {/* Question card styled as Professor Conversation */}
              <div className="flex gap-4 items-start" id="active-question-card">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-200 shrink-0 text-2xl select-none">
                  👨‍🏫
                </div>
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-md border border-slate-200 flex-1 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      Domanda #{history.length + 1}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold leading-relaxed text-slate-850">
                    {currentQuestion}
                  </h3>
                </div>
              </div>

              {/* Student answer submission block */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 ml-0 sm:ml-16" id="answer-form-card">
                <form onSubmit={handleSubmit} className="space-y-4" id="active-answer-form">
                  <div>
                    <label htmlFor="student-answer-textarea" className="block text-sm font-semibold text-slate-700 mb-2">
                      Scrivi la tua risposta
                    </label>
                    <textarea
                      id="student-answer-textarea"
                      rows={5}
                      placeholder="Scrivi qui la tua risposta dettagliata. Puoi spiegare i dettagli del concetto, date importanti, cause ed effetti..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl py-3.5 px-5 shadow-sm focus:border-indigo-500 focus:outline-none text-slate-900 placeholder-slate-400 font-medium resize-none leading-relaxed"
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2" id="answer-form-actions">
                    <button
                      id="dont-know-btn"
                      type="button"
                      onClick={handleDontKnow}
                      disabled={isSubmitting}
                      className="text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer border-2 border-slate-200 hover:bg-slate-50 py-2.5 px-4 rounded-xl transition-all w-full sm:w-auto text-center"
                    >
                      Non so rispondere 🤔
                    </button>

                    <button
                      id="submit-answer-btn"
                      type="submit"
                      disabled={isSubmitting || !answer.trim()}
                      className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isSubmitting || !answer.trim()
                          ? 'bg-slate-300 shadow-none cursor-not-allowed'
                          : 'bg-indigo-650 hover:bg-indigo-750 active:scale-[0.98]'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Il professore sta correggendo...</span>
                        </>
                      ) : (
                        <>
                          <span>Invia Risposta</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Anchor for scrolling */}
      <div ref={bottomRef} />
    </div>
  );
}
