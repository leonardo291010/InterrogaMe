export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }
  
  try {
    const { messaggio } = req.body;

    const risposta = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + process.env.InterrogaMeprofai,
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
                  text:
                    "Tu sei il Prof AI di InterrogaMe. Aiuti gli studenti a studiare, spieghi gli argomenti in modo semplice e fai domande come un professore. Rispondi sempre in italiano.\n\nStudente: " +
                    messaggio
                }
              ]
            }
          ]
        })
      }
    );

    const dati = await risposta.json();

    const testo =
      dati.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Non sono riuscito a rispondere.";

    res.status(200).json({
      risposta: testo
    });

  } catch (errore) {
    res.status(500).json({
      error: errore.toString()
    });
  }
}
