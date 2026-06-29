import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI client with required telemetry headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Robust helper function with retry logic and model fallback to handle transient 503/429 errors
async function callGeminiWithRetry(params: any, retries = 2, delay = 800) {
  const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];
  let lastError = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[Gemini API] Tentativo con modello: ${model} (tentativo ${attempt}/${retries})...`);
        const response = await ai.models.generateContent({
          ...params,
          model: model,
        });
        if (response && response.text) {
          console.log(`[Gemini API] Successo con modello: ${model}`);
          return response;
        }
        throw new Error("La risposta dell'IA è vuota.");
      } catch (error: any) {
        lastError = error;
        const errMsg = error?.message || String(error);
        console.warn(`[Gemini API Warning] Errore con ${model} al tentativo ${attempt}: ${errMsg}`);
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    }
  }
  throw lastError || new Error("Nessun modello Gemini configurato è stato in grado di rispondere.");
}

// Use standard JSON parsing middleware
app.use(express.json());

// API: Start interrogation (generates the first question)
app.post("/api/start-interrogation", async (req, res) => {
  try {
    const { subject, topic } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({ error: "Materia e argomento sono richiesti." });
    }

    const prompt = `Sei un professore d'italiano interattivo molto competente, cordiale ed incoraggiante.
L'alunno vuole ripassare la materia: "${subject}"
L'argomento specifico scelto è: "${topic}"

Genera una prima domanda interessante, chiara e adatta a testare la preparazione dello studente su questo argomento specifico. 
La domanda deve essere formulata in modo diretto e amichevole. Non inserire preamboli lunghi, vai dritto alla domanda in italiano.`;

    const response = await callGeminiWithRetry({
      contents: prompt,
      config: {
        systemInstruction: "Sei un professore d'italiano interattivo. Generi domande in modo professionale ed incoraggiante.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: "La domanda iniziale in italiano sull'argomento scelto.",
            },
          },
          required: ["question"],
        },
      },
    });

    if (!response.text) {
      throw new Error("Nessuna risposta ricevuta dall'IA.");
    }

    const result = JSON.parse(response.text.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("Errore in /api/start-interrogation:", error);
    return res.status(500).json({ error: "Impossibile generare la prima domanda. Riprova." });
  }
});

// API: Interact/Chat (evaluates student answer, provides explanation, asks next question)
app.post("/api/chat", async (req, res) => {
  try {
    const { subject, topic, history, studentAnswer } = req.body;

    if (!subject || !topic || !studentAnswer) {
      return res.status(400).json({ error: "Dati incompleti per la valutazione." });
    }

    // Prepare conversational context
    let contextStr = `Materia: ${subject}\nArgomento: ${topic}\n\n`;
    contextStr += "Cronologia dell'interrogazione:\n";
    
    const formattedHistory = history || [];
    formattedHistory.forEach((item: any, idx: number) => {
      contextStr += `Domanda ${idx + 1}: ${item.question}\n`;
      contextStr += `Risposta dello studente: ${item.answer || 'Non pervenuta'}\n`;
      contextStr += `Tuo Feedback precedente: ${item.evaluation} (${item.feedback})\n`;
      contextStr += `Tua Spiegazione precedente: ${item.explanation}\n\n`;
    });

    // The current active question is the last question in history, or the initial question if history had no answers yet
    const lastQuestion = formattedHistory.length > 0 ? formattedHistory[formattedHistory.length - 1].question : "Domanda iniziale";

    const prompt = `${contextStr}
Ultima domanda posta: "${lastQuestion}"
Risposta appena data dallo studente: "${studentAnswer}"

Valuta questa risposta in modo accurato.
1. Determina se la risposta è:
   - 'correct' (corretta, esaustiva, precisa)
   - 'partially_correct' (parzialmente corretta, incompleta o con qualche piccola imprecisione)
   - 'incorrect' (completamente errata, fuori strada o non pervenuta)
2. Scrivi un breve verdetto (es. "Perfetto!", "Ottima risposta!", "Risposta parziale", "Non proprio corretto") sotto il campo 'evaluation'.
3. Fornisci una spiegazione dettagliata, chiara ed estremamente utile in italiano sotto 'explanation'. Se ci sono errori, spiega precisamente quali sono e correggili con garbo. Aggiungi dettagli o approfondimenti interessanti che lo studente potrebbe aver tralasciato. Puoi usare la formattazione Markdown.
4. Genera la domanda successiva ('nextQuestion') per approfondire l'argomento scelto o toccare un aspetto collegato ma differente, in modo da valutare appieno lo studente. La domanda deve essere stimolante.`;

    const response = await callGeminiWithRetry({
      contents: prompt,
      config: {
        systemInstruction: "Sei un professore d'italiano interattivo che corrige con precisione ed empatia e formula la domanda successiva.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: {
              type: Type.STRING,
              description: "Deve essere rigorosamente uno tra: 'correct', 'partially_correct', 'incorrect'",
            },
            evaluation: {
              type: Type.STRING,
              description: "Un breve verdetto di approvazione o correzione in italiano (max 5 parole).",
            },
            explanation: {
              type: Type.STRING,
              description: "Spiegazione dettagliata degli errori commessi e approfondimenti sul concetto in italiano. Supporta Markdown.",
            },
            nextQuestion: {
              type: Type.STRING,
              description: "La domanda successiva in italiano da porre all'alunno.",
            },
          },
          required: ["feedback", "evaluation", "explanation", "nextQuestion"],
        },
      },
    });

    if (!response.text) {
      throw new Error("Nessuna risposta ricevuta dall'IA.");
    }

    const result = JSON.parse(response.text.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("Errore in /api/chat:", error);
    return res.status(500).json({ error: "Errore durante l'elaborazione della risposta. Riprova." });
  }
});

// API: Evaluate interrogation (generates the final report card)
app.post("/api/evaluate", async (req, res) => {
  try {
    const { subject, topic, history } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({ error: "Materia e argomento sono richiesti." });
    }

    if (!history || history.length === 0) {
      return res.status(400).json({ error: "Nessuna domanda registrata per fare una valutazione." });
    }

    let summaryContext = `Materia: ${subject}\nArgomento: ${topic}\n\n`;
    summaryContext += "Resoconto di tutta l'interrogazione:\n";
    history.forEach((item: any, idx: number) => {
      summaryContext += `Domanda ${idx + 1}: ${item.question}\n`;
      summaryContext += `Risposta dello studente: ${item.answer}\n`;
      summaryContext += `Valutazione: ${item.evaluation} (${item.feedback})\n`;
      summaryContext += `Spiegazione: ${item.explanation}\n\n`;
    });

    const prompt = `${summaryContext}
L'interrogazione è terminata. Analizza l'intera sessione sopra riportata e compila la scheda di valutazione finale:
1. Assegna un voto finale complessivo (un numero intero da 1 a 10). Sii equo ma incoraggiante. Un 10 si dà solo a chi risponde perfettamente a tutto, un 6 è la sufficienza.
2. Spiega sinteticamente il motivo del voto assegnato ('gradeExplanation') in italiano.
3. Elenca i punti deboli ('weakPoints') riscontrati: concetti su cui lo studente ha esitato, fatto errori o tralasciato dettagli importanti.
4. Elenca i progressi o i punti di forza ('progress'): nozioni che lo studente ha dimostrato di padroneggiare con sicurezza e chiarezza.
5. Scrivi un riepilogo generale ('generalSummary') in stile caloroso, professionale e motivante in italiano. Fornisci consigli pratici per il futuro studio di questo argomento. Supporta la formattazione Markdown.`;

    const response = await callGeminiWithRetry({
      contents: prompt,
      config: {
        systemInstruction: "Sei il Professore Interattivo. Generi un pagellino finale in italiano con voto da 1 a 10, evidenziando in modo chiaro punti di forza, debolezze e consigli.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grade: {
              type: Type.INTEGER,
              description: "Voto finale da 1 a 10 (numero intero).",
            },
            gradeExplanation: {
              type: Type.STRING,
              description: "Spiegazione concisa in italiano del voto attribuito.",
            },
            weakPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista dei punti deboli riscontrati o concetti da ripassare.",
            },
            progress: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista di punti di forza, progressi o concetti ben compresi.",
            },
            generalSummary: {
              type: Type.STRING,
              description: "Consigli finali e riassunto motivante in italiano. Supporta Markdown.",
            },
          },
          required: ["grade", "gradeExplanation", "weakPoints", "progress", "generalSummary"],
        },
      },
    });

    if (!response.text) {
      throw new Error("Nessuna risposta ricevuta dall'IA.");
    }

    const result = JSON.parse(response.text.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("Errore in /api/evaluate:", error);
    return res.status(500).json({ error: "Impossibile generare la valutazione finale. Riprova." });
  }
});

// Configure Vite or Static File Serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite Dev Server integrated as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode serving static production builds
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Professore Interattivo] Server avviato su http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Errore di avvio del server:", err);
});
