let livello = "";
let index = 0;
let punti = 0;

// avvia quiz
function mostraDomande() {
  livello = document.getElementById("difficolta").value;

  if (!livello) return alert("Scegli difficoltà!");

  index = 0;
  punti = 0;

  mostra();
}

// mostra domanda
function mostra() {
  const q = quiz[livello][index];

  document.getElementById("quiz").innerHTML = `
    <h3>${q.q}</h3>
    ${q.opzioni.map((op, i) =>
      `<button onclick="rispondi(${i})">${op}</button>`
    ).join("")}
  `;
}

// risposta
function rispondi(i) {
  if (i === quiz[livello][index].giusta) {
    punti++;
  }

  index++;

  if (index < quiz[livello].length) {
    mostra();
  } else {
    mostraRisultato();
  }
}

// risultato finale
function mostraRisultato() {
  let totale = quiz[livello].length;

  let percentuale = (punti / totale) * 100;

  // voto arrotondato a 0.5
  let voto = Math.round((percentuale / 10) * 2) / 2;

  document.getElementById("quiz").innerHTML = "";

  document.getElementById("risultato").innerHTML = `
    📊 Risultato: ${punti}/${totale}<br>
    📈 Percentuale: ${percentuale.toFixed(0)}%<br>
    🎓 Voto: ${voto}
  `;
}
