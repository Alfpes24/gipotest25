// script.js
// GipoNext Preventivo - Script completo e funzionante
// Include: calcolo prezzi, gestione modali, simulazione promozione, generazione PDF

// =========================
// CONFIGURAZIONE PREZZI BASE
// =========================
const prezzi = {
  starter: { solo: [109, 99, 89, 69, 59, 49, 29, 19], crm: [119, 109, 99, 79, 69, 59, 39, 29] },
  plus:    { solo: [144, 134, 124, 104, 84, 74, 64, 54], crm: [154, 144, 134, 114, 94, 84, 74, 64] },
  vip:     { solo: [154, 144, 134, 114, 94, 84, 74, 64], crm: [164, 154, 144, 124, 104, 94, 84, 74] }
};
const setupFees = [500, 500, 500, 500, 750, 750, 750, 1000];
const soglie    = [1, 2, 4, 6, 8, 10, 15, 20];

// =========================
// UTILITY FUNCTIONS
// =========================
function getIndiceStanze(n) {
  for (let i = 0; i < soglie.length; i++) {
    if (n <= soglie[i]) return i;
  }
  return soglie.length - 1;
}

function toggleModal(id, show) {
  const modal = document.getElementById(id);
  if (show) modal.classList.remove('hidden');
  else      modal.classList.add('hidden');
}

function showError(msg) {
  const form = document.getElementById('calculator-form');
  const container = document.createElement('div');
  container.textContent = msg;
  container.style.cssText = 'color:red;font-weight:bold;text-align:center;margin:10px 0';
  form.prepend(container);
  setTimeout(() => container.remove(), 3000);
}

// =========================
// CALCOLO PREVENTIVO
// =========================
function calcolaPreventivo() {
  const stanze  = parseInt(document.getElementById('rooms').value)   || 0;
  const medici  = parseInt(document.getElementById('doctors').value) || 0;
  const bundle  = document.getElementById('bundle').value;
  const crm     = document.getElementById('crm').checked;
  const tablet  = document.getElementById('tabletFirma').checked;
  const lettore = document.getElementById('lettoreTessera').checked;

  if (!stanze || !medici) {
    showError('Inserisci valori validi per ambulatori e medici');
    return;
  }

  // Indice di prezzo in base alle stanze
  const idx = getIndiceStanze(stanze);
  let unit = prezzi[bundle][crm ? 'crm' : 'solo'][idx];

  // Sconto se rapporto medici/stanze <= 1.3
  if (medici / stanze <= 1.3) unit /= 1.5;

  const canoneReale = unit * stanze;
  const setupReale  = setupFees[idx];
  const tabletFee   = tablet  ? 429 : 0;
  const lettoreFee  = lettore ?  79 : 0;

  // Add-on selezionati
  const addons = Array.from(document.querySelectorAll('.addon:checked')).map(el => ({
    name : el.dataset.name,
    price: parseFloat(el.dataset.price) || 0,
    setup: parseFloat(el.dataset.setup) || 0
  }));
  const addonMens  = addons.reduce((sum, a) => sum + a.price, 0);
  const addonSetup = addons.reduce((sum, a) => sum + a.setup, 0);

  // Calcolo listino vs reale
  const canoneListino  = (canoneReale + addonMens) * 1.25;
  const setupListino   = (setupReale + addonSetup) * 2;
  const totaleListino  = setupListino + tabletFee + lettoreFee;
  const totaleReale    = setupReale + addonSetup + tabletFee + lettoreFee;

  // Salvo tutto in globale per il PDF
  window._preventivo = {
    stanze, medici, bundle, crm, tablet, lettore,
    addons: addons.map(a => a.name),
    canoneReale, setupReale, addonMens, addonSetup,
    canoneListino, setupListino, totaleListino, totaleReale,
    nomeStruttura: '', nomeReferente: '', email: '', telefono: ''
  };

  // Mostro i prezzi a listino
  document.getElementById('monthly-list-price').textContent = `${canoneListino.toFixed(2)} €`;
  document.getElementById('setup-list-price').textContent   = `${setupListino.toFixed(2)} €`;
  document.getElementById('setup-total').textContent        = `${totaleListino.toFixed(2)} €`;

  document.getElementById('listino-panel').classList.remove('hidden');
  document.getElementById('generate-pdf-btn').classList.remove('hidden');
  toggleModal('addon-modal', false);
}

// =========================
// SIMULAZIONE PROMO PROMOZIONALE
// =========================
function avviaVerifica() {
  const spinner   = document.getElementById('loading-spinner');
  const bar       = document.getElementById('progressBar');
  const countdown = document.getElementById('countdown');

  spinner.classList.remove('hidden');
  document.getElementById('dettaglio-panel').classList.add('hidden');
  bar.style.width = '0%';

  // Animazione progress bar
  let p = 0;
  const ani = setInterval(() => {
    p += 100/150;
    bar.style.width = `${p}%`;
    if (p >= 100) clearInterval(ani);
  }, 100);

  // Countdown 15s
  let sec = 15;
  countdown.textContent = `Attendere ${sec}s...`;
  const t = setInterval(() => {
    sec--;
    countdown.textContent = `Attendere ${sec}s...`;
    if (sec <= 0) {
      clearInterval(t);
      spinner.classList.add('hidden');
      mostraOffertaRiservata();
    }
  }, 1000);
}

function mostraOffertaRiservata() {
  const d = window._preventivo;
  document.getElementById('default-monthly-price').textContent = `${d.canoneReale.toFixed(2)} €`;
  document.getElementById('list-monthly-crossed').textContent = `${d.canoneListino.toFixed(2)} €`;
  document.getElementById('setup-fee').textContent           = `${d.setupReale.toFixed(2)} €`;
  document.getElementById('list-setup-crossed').textContent  = `${d.setupListino.toFixed(2)} €`;
  document.getElementById('dettaglio-panel').classList.remove('hidden');
}

// =========================
// GENERAZIONE PDF
// =========================
async function confermaGenerazionePDF() {
  const nome  = document.getElementById('nomeStruttura').value.trim();
  const ref   = document.getElementById('nomeReferente').value.trim();
  const email = document.getElementById('email').value.trim();
  const tel   = document.getElementById('telefono').value.trim();

  if (!nome || !ref || !email || !tel) {
    showError('Compila tutti i campi per generare il PDF');
    return;
  }
  toggleModal('pdf-modal', false);

  Object.assign(window._preventivo, {
    nomeStruttura: nome,
    nomeReferente: ref,
    email: email,
    telefono: tel
  });
  await generaPDF(window._preventivo);
}

async function generaPDF(d) {
  try {
    // prendo PDFDocument da PDFLib caricato in pagina
    const { PDFDocument } = PDFLib;

    // carica modello e compila campi
    const bytes = await fetch('preventivo.pdf').then(r => r.arrayBuffer());
    const pdfDoc = await PDFDocument.load(bytes);
    const form   = pdfDoc.getForm();

    form.getTextField('nome_struttura').setText(d.nomeStruttura);
    form.getTextField('nome_referente').setText(d.nomeReferente);
    form.getTextField('email').setText(d.email);
    form.getTextField('telefono').setText(d.telefono);

    form.getTextField('n_ambulatori').setText(d.stanze.toString());
    form.getTextField('n_medici').setText(d.medici.toString());
    form.getTextField('versione_gipo').setText(d.bundle.toUpperCase());
    form.getTextField('crm_incluso').setText(d.crm ? 'Sì' : 'No');
    form.getTextField('tablet_firma').setText(d.tablet ? 'Sì' : 'No');
    form.getTextField('lettore_ts').setText(d.lettore ? 'Sì' : 'No');
    form.getTextField('addons').setText(d.addons.join(', '));

    form.getTextField('canone_listino').setText(d.canoneListino.toFixed(2));
    form.getTextField('setup_listino').setText(d.setupListino.toFixed(2));
    form.getTextField('totale_setup_listino').setText(d.totaleListino.toFixed(2));

    form.getTextField('default_monthly_price').setText(d.canoneReale.toFixed(2));
    form.getTextField('setup_fee').setText(d.setupReale.toFixed(2));
    form.getTextField('totale_setup_reale').setText(d.totaleReale.toFixed(2));

    const today = new Date().toLocaleDateString('it-IT');
    form.getTextField('data_preventivo').setText(today);

    // scarica il PDF compilato
    const outBytes = await pdfDoc.save();
    const blob     = new Blob([outBytes], { type: 'application/pdf' });
    const link     = document.createElement('a');
    link.href      = URL.createObjectURL(blob);
    link.download  = `Preventivo_${d.nomeStruttura}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);

  } catch (err) {
    console.error(err);
    showError('Errore durante la generazione del PDF');
  }
}

// =========================
// INITIALIZATION
// =========================
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('calculate-btn').addEventListener('click', calcolaPreventivo);
  document.getElementById('addon-btn')     .addEventListener('click',  () => toggleModal('addon-modal',  true));
  document.getElementById('close-addon')   .addEventListener('click', () => toggleModal('addon-modal',  false));
  document.getElementById('check-btn')     .addEventListener('click',    avviaVerifica);
  document.getElementById('generate-pdf-btn').addEventListener('click', () => toggleModal('pdf-modal', true));
  document.getElementById('annulla-pdf')   .addEventListener('click', () => toggleModal('pdf-modal', false));
  document.getElementById('conferma-pdf')  .addEventListener('click', confermaGenerazionePDF);
});
