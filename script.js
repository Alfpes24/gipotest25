// script.js
// Gestione completa preventivatore GipoNext + generazione PDF

// ———————————————————————————————
// CONFIGURAZIONE PREZZI BASE E SOGLIE
// ———————————————————————————————
const prezzi = {
  starter: { solo: [109, 99, 89, 69, 59, 49, 29, 19], crm: [119, 109, 99, 79, 69, 59, 39, 29] },
  plus:    { solo: [144,134,124,104,84,74,64,54],  crm: [154,144,134,114,94,84,74,64] },
  vip:     { solo: [154,144,134,114,94,84,74,64],  crm: [164,154,144,124,104,94,84,74] }
};
const setupFees = { starter: 500, plus: 750, vip: 1000 };
const soglie = [1,2,4,6,8,10,15,20];

// stato globale del preventivo
let preventivo = {
  // campi configurazione e calcolo
  rooms: 0,
  doctors: 0,
  bundle: 'plus',
  crm: false,
  tablet: false,
  cardReader: false,
  additionalLoc: 0,
  // risultati calcolo
  canoneReale: 0,
  setupReale: 0,
  addonMens: 0,
  addonSetup: 0,
  canoneListino: 0,
  setupListino: 0,
  totaleListino: 0,
  totaleReale: 0,
  // flag promozione
  promoActive: false
};

// ———————————————————————————————
// UTILITY
// ———————————————————————————————
function getSogliaIndex(n) {
  for (let i = 0; i < soglie.length; i++) {
    if (n <= soglie[i]) return i;
  }
  return soglie.length - 1;
}
function toggle(id, show) {
  document.getElementById(id).classList[show ? 'remove' : 'add']('hidden');
}
function showError(msg) {
  alert(msg);
}

// ———————————————————————————————
// STEP 1: CALCOLO PREVENTIVO A LISTINO
// ———————————————————————————————
document.getElementById('calculate-btn').addEventListener('click', () => {
  const rooms   = parseInt(document.getElementById('rooms').value) || 0;
  const doctors = parseInt(document.getElementById('doctors').value) || 0;
  if (!rooms || !doctors) return showError('Inserisci N° Ambulatori e Medici validi.');

  const bundle      = document.getElementById('bundle').value;
  const crm         = document.getElementById('crm').checked;
  const tablet      = document.getElementById('tabletFirma').checked;
  const cardReader  = document.getElementById('lettoreTessera').checked;
  const additional  = parseInt(document.getElementById('additional-locations')?.value || 0);

  // soglia per il bundle
  const idx = getSogliaIndex(doctors);
  const baseUnit = prezzi[bundle][ crm ? 'crm' : 'solo' ][idx];

  // costi reali
  const canoneReale = baseUnit;
  const setupReale  = setupFees[bundle];

  // add-on installati
  const addons = Array.from(document.querySelectorAll('.addon:checked'))
    .map(ch => ({
      price:  parseFloat(ch.dataset.price)||0,
      setup:  parseFloat(ch.dataset.setup)||0
    }));
  const addonMens  = addons.reduce((sum,a) => sum + a.price, 0);
  const addonSetup = addons.reduce((sum,a) => sum + a.setup, 0);

  // costi accessori
  const tabletFee     = tablet     ? 429 : 0;
  const cardReaderFee = cardReader ?  79 : 0;
  const sediFee       = additional * 99;

  // listino (con +25%)
  const canoneListino = (canoneReale + addonMens) * 1.25;
  const setupListino  = (setupReale  + addonSetup) * 1.25;
  const totaleListino = (canoneListino + sediFee).toFixed(2);
  const totaleOneOff  = (setupListino + tabletFee + cardReaderFee).toFixed(2);

  // salva nel globale
  Object.assign(preventivo, {
    rooms, doctors, bundle, crm, tablet, cardReader, additional,
    canoneReale, setupReale, addonMens, addonSetup,
    canoneListino, setupListino,
    totaleListino, totaleOneOff,
    promoActive: false
  });

  // mostra panel listino
  document.getElementById('listino-monthly').textContent = `${canoneListino.toFixed(2)} €`;
  document.getElementById('listino-setup').textContent   = `${setupListino.toFixed(2)} €`;
  document.getElementById('listino-total-month').textContent = `${totaleListino} €`;
  toggle('listino-panel', true);
});

// ———————————————————————————————
// STEP 2: VERIFICA CONDIZIONI RISERVATE
// ———————————————————————————————
document.getElementById('check-btn').addEventListener('click', () => {
  toggle('listino-panel', false);
  toggle('loading-panel', true);

  // avvia barra progresso
  const bar = document.getElementById('progress-bar');
  setTimeout(() => bar.style.width = '100%', 50);

  // countdown 15s
  let count = 15;
  const cdEl = document.getElementById('countdown');
  cdEl.textContent = count;
  const interval = setInterval(() => {
    count--;
    cdEl.textContent = count;
    if (count === 0) {
      clearInterval(interval);
      // promozione attiva
      preventivo.promoActive = true;
      const {
        canoneReale,  setupReale,
        addonMens,    addonSetup,
        rooms,        doctors,       additional,
        tablet,       cardReader
      } = preventivo;

      // calcola prezzi reali + costi sedi
      const sediFee = additional * 99;
      const canonePromo   = canoneReale + sediFee;
      const setupPromo    = setupReale  + addonSetup + (tablet?429:0) + (cardReader?79:0);

      // mostra pannello promozione
      document.getElementById('promo-monthly').textContent = `${canonePromo.toFixed(2)} €`;
      document.getElementById('crossed-monthly').textContent = `${preventivo.canoneListino.toFixed(2)} €`;
      document.getElementById('promo-setup').textContent   = `${setupPromo.toFixed(2)} €`;
      document.getElementById('crossed-setup').textContent  = `${preventivo.setupListino.toFixed(2)} €`;
      document.getElementById('promo-total-month').textContent = `${canonePromo.toFixed(2)} €`;

      toggle('loading-panel', false);
      toggle('promo-panel', true);
    }
  }, 1000);
});

// ———————————————————————————————
// STEP 3: GENERAZIONE PDF
// ———————————————————————————————
document.getElementById('generate-pdf-btn').addEventListener('click', () => {
  toggle('pdf-modal', true);
});
document.getElementById('cancel-pdf-btn').addEventListener('click', () => {
  toggle('pdf-modal', false);
});

document.getElementById('conferma-pdf').addEventListener('click', async () => {
  // raccogli dati modal
  const nomeS = document.getElementById('nomeStruttura').value.trim();
  const ref   = document.getElementById('nomeReferente').value.trim();
  const mail  = document.getElementById('email').value.trim();
  const tel   = document.getElementById('telefono').value.trim();
  const sale  = document.getElementById('nomeSale').value.trim();
  if (!nomeS||!ref||!mail||!tel||!sale) {
    return showError('Compila tutti i campi per il PDF.');
  }
  toggle('pdf-modal', false);

  // prepara oggetto dati per PDF
  const dataPrev = new Date().toLocaleDateString('it-IT');
  const isPromo  = preventivo.promoActive;
  const sediFee  = preventivo.additional * 99;
  const canone   = (isPromo
    ? preventivo.canoneReale + sediFee
    : preventivo.canoneListino
  ).toFixed(2);
  const setup    = (isPromo
    ? preventivo.setupReale + preventivo.addonSetup + (preventivo.tablet?429:0) + (preventivo.cardReader?79:0)
    : preventivo.setupListino
  ).toFixed(2);

  const pdfData = {
    nome_struttura: nomeS,
    nome_referente: ref,
    email,
    telefono_sale: tel,
    nome_sale: sale,
    data_preventivo: dataPrev,
    canone_listino: `${canone} €`,
    setup_scontato: `${setup} €`
  };

  // genera PDF tramite PDF-lib
  try {
    const { PDFDocument } = PDFLib;
    const url = 'preventivo.pdf';  // o URL GitHub raw
    const bytes = await fetch(url).then(r => r.arrayBuffer());
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();

    // riempi campi
    Object.entries(pdfData).forEach(([key, val]) => {
      try { form.getTextField(key).setText(val); }
      catch (e) { /* campo non esiste, skip */ }
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Preventivo_${nomeS}.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error(err);
    showError('Errore generazione PDF.');
  }
});
