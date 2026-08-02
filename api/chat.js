export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    const { messaggio } = req.body;

    const risposta = await fetch(
      ""https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key="" +
        process.env.InterrogaMeprofai,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Sei il Prof AI di InterrogaMe.

Aiuti gli studenti italiani.

Regole:
- Rispondi sempre in italiano.
- Se ti chiedono una spiegazione, spiega in modo semplice.
- Se scelgono interrogazione, fai una domanda alla volta.
- Se scelgono quiz, crea un quiz.
- Correggi gli errori con gentilezza.

Messaggio dello studente:

${messaggio}`
                }
              ]
            }
          ]
        })
      }
    );

    const dati = await risposta.json();

    if (!risposta.ok) {
      return res.status(500).json({
        error: dati.error?.message || "Errore Gemini"
      });
    }

    const testo =
      dati.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Non sono riuscito a rispondere.";

    res.status(200).json({
      risposta: testo
    });

  } catch (errore) {
    res.status(500).json({
      error: errore.message
    });
  }
}
