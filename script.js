// script.js
// Gestione completa del preventivatore GipoNext + generazione PDF

// ———————————————————————————————
// 1) CONFIGURAZIONE PREZZI E SOGLIE
// ———————————————————————————————
const prezzi = {
  starter: { solo: [109,99,89,69,59,49,29,19], crm: [119,109,99,79,69,59,39,29] },
  plus:    { solo: [144,134,124,104,84,74,64,54], crm: [154,144,134,114,94,84,74,64] },
  vip:     { solo: [154,144,134,114,94,84,74,64], crm: [164,154,144,124,104,94,84,74] }
};
const setupFees = { starter: 500, plus: 750, vip: 1000 };
const soglie    = [1,2,4,6,8,10,15,20];

// stato globale del preventivo
let state = {
  rooms: 0,
  doctors: 0,
  bundle: 'plus',
  crm: false,
  tablet: false,
  cardReader: false,
  additional: 0,
  addons: [],
  canoneReale: 0,
  setupReale: 0,
  addonMens: 0,
  addonSetup: 0,
  canoneListino: 0,
  setupListino: 0,
  totaleListino: 0,
  totaleOneOff: 0,
  promoActive: false
};

// ———————————————————————————————
// 2) FUNZIONI UTILI
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
// 3) CALCOLO PREVENTIVO A LISTINO
// ———————————————————————————————
document.getElementById('calculate-btn').addEventListener('click', () => {
  // raccogli input
  const rooms   = parseInt(document.getElementById('rooms').value) || 0;
  const doctors = parseInt(document.getElementById('doctors').value) || 0;
  if (!rooms || !doctors) return showError('Inserisci N° Ambulatori e Medici validi.');

  const bundle     = document.getElementById('bundle').value;
  const crm        = document.getElementById('crm').checked;
  const tablet     = document.getElementById('tabletFirma').checked;
  const cardReader = document.getElementById('lettoreTessera').checked;
  const additional = parseInt(document.getElementById('additional-locations')?.value || 0);

  // soglia bundle
  const idx = getSogliaIndex(doctors);
  const baseUnit = prezzi[bundle][ crm ? 'crm' : 'solo' ][idx];

  // costi reali
  const canoneReale = baseUnit;
  const setupReale  = setupFees[bundle];

  // read addons selezionati
  const addons = Array.from(document.querySelectorAll('.addon:checked')).map(ch => ({
    name:  ch.dataset.name,
    price: parseFloat(ch.dataset.price)||0,
    setup: parseFloat(ch.dataset.setup)||0
  }));
  const addonMens  = addons.reduce((s,a) => s + a.price, 0);
  const addonSetup = addons.reduce((s,a) => s + a.setup, 0);

  // costi accessori
  const tabletFee     = tablet     ? 429 : 0;
  const cardReaderFee = cardReader ?  79 : 0;
  const sediFee       = additional * 99;

  // prezzi listino (+25%)
  const canoneListino = (canoneReale + addonMens) * 1.25;
  const setupListino  = (setupReale  + addonSetup) * 1.25;
  const totaleListino = (canoneListino + sediFee).toFixed(2);
  const totaleOneOff  = (setupListino + tabletFee + cardReaderFee).toFixed(2);

  // aggiorna stato
  Object.assign(state, {
    rooms, doctors, bundle, crm, tablet, cardReader, additional, addons,
    canoneReale, setupReale, addonMens, addonSetup,
    canoneListino, setupListino,
    totaleListino, totaleOneOff,
    promoActive: false
  });

  // mostra pannello listino
  document.getElementById('monthly-list-price').textContent = `${canoneListino.toFixed(2)} €`;
  document.getElementById('setup-list-price').textContent   = `${setupListino.toFixed(2)} €`;
  document.getElementById('setup-total').textContent       = `${totaleListino} €`;
  toggle('listino-panel', true);
});

// ———————————————————————————————
// 4) VERIFICA CONDIZIONI RISERVATE (COUNTDOWN 15s)
// ———————————————————————————————
document.getElementById('check-btn').addEventListener('click', () => {
  toggle('listino-panel',   false);
  toggle('loading-spinner', true);

  // barra progresso
  const bar = document.getElementById('progressBar');
  setTimeout(() => bar.style.width = '100%', 50);

  // countdown
  let count = 15;
  const cdEl = document.getElementById('countdown');
  cdEl.textContent = count;
  const timer = setInterval(() => {
    count--;
    cdEl.textContent = count;
    if (count <= 0) {
      clearInterval(timer);
      state.promoActive = true;

      // ricalcolo prezzi scontati
      const sediFee = state.additional * 99;
      const canonePromo = state.canoneReale + sediFee;
      const setupPromo  = state.setupReale + state.addonSetup
                         + (state.tablet?429:0) + (state.cardReader?79:0);

      // mostra pannello promo
      document.getElementById('default-monthly-price').textContent = `${canonePromo.toFixed(2)} €`;
      document.getElementById('list-monthly-crossed').textContent  = `${state.canoneListino.toFixed(2)} €`;
      document.getElementById('setup-fee').textContent            = `${setupPromo.toFixed(2)} €`;
      document.getElementById('list-setup-crossed').textContent   = `${state.setupListino.toFixed(2)} €`;
      document.getElementById('promo-panel') && toggle('promo-panel', true);
      toggle('loading-spinner', false);
    }
  }, 1000);
});

// ———————————————————————————————
// 5) MODAL ADD-ON
// ———————————————————————————————
document.getElementById('addon-btn').addEventListener('click', () => toggle('addon-modal', true));
document.getElementById('close-addon').addEventListener('click', () => toggle('addon-modal', false));

// ———————————————————————————————
// 6) GENERAZIONE PDF
// ———————————————————————————————
document.getElementById('generate-pdf-btn').addEventListener('click', () => toggle('pdf-modal', true));
document.getElementById('annulla-pdf').addEventListener('click', () => toggle('pdf-modal', false));

document.getElementById('conferma-pdf').addEventListener('click', async () => {
  // dati da modal
  const nome   = document.getElementById('nomeStruttura').value.trim();
  const referente = document.getElementById('nomeReferente').value.trim();
  const email  = document.getElementById('email').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const sala   = document.getElementById('nomeSale').value.trim();
  if (!nome || !referente || !email || !telefono || !sala) {
    return showError('Compila tutti i campi per il PDF');
  }
  toggle('pdf-modal', false);

  // prepara dati PDF
  const today = new Date().toLocaleDateString('it-IT');
  const promo = state.promoActive;
  const sediFee = state.additional * 99;
  const canone = (promo
    ? state.canoneReale + sediFee
    : state.canoneListino
  ).toFixed(2);
  const setup  = (promo
    ? state.setupReale + state.addonSetup + (state.tablet?429:0) + (state.cardReader?79:0)
    : state.setupListino
  ).toFixed(2);

  // oggetto dati per PDF-lib
  const pdfData = {
    nome_struttura:    nome,
    nome_referente:    referente,
    email:             email,
    telefono_sale:     telefono,
    nome_sale:         sala,
    data_preventivo:   today,
    canone_listino:    `${canone} €`,
    setup_scontato:    `${setup} €`
  };

  // crea e scarica PDF
  try {
    const { PDFDocument } = PDFLib;
    const url = 'preventivo.pdf'; // o URL raw GitHub
    const arrayBuffer = await fetch(url).then(r => r.arrayBuffer());
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const form = pdfDoc.getForm();

    // riempi i campi
    Object.entries(pdfData).forEach(([key, val]) => {
      try { form.getTextField(key).setText(val); }
      catch (e) { /* campo assente */ }
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Preventivo_${nome}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error(err);
    showError('Errore nella generazione del PDF');
  }
});
