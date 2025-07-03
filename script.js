// script.js
// Gestione completa preventivatore + generazione PDF personalizzato

// ———————————————————————————————
// CONFIGURAZIONE PREZZI BASE
// ———————————————————————————————
const prezzi = {
  starter: { solo: [109,99,89,69,59,49,29,19], crm: [119,109,99,79,69,59,39,29] },
  plus:    { solo: [144,134,124,104,84,74,64,54], crm: [154,144,134,114,94,84,74,64] },
  vip:     { solo: [154,144,134,114,94,84,74,64], crm: [164,154,144,124,104,94,84,74] }
};
const setupFees = [500,500,500,500,750,750,750,1000];
const soglie = [1,2,4,6,8,10,15,20];

// ———————————————————————————————
// UTILITY
// ———————————————————————————————
function getIndiceStanze(n) {
  for (let i = 0; i < soglie.length; i++) {
    if (n <= soglie[i]) return i;
  }
  return soglie.length - 1;
}

function toggleModal(id, show) {
  document.getElementById(id).classList[show ? 'remove' : 'add']('hidden');
}

function mostraErrore(msg) {
  const form = document.getElementById('calculator-form');
  const div = document.createElement('div');
  div.textContent = msg;
  div.style.cssText = 'color:red;font-weight:bold;text-align:center;margin:12px 0';
  form.prepend(div);
  setTimeout(()=>div.remove(),3000);
}

// ———————————————————————————————
// CALCOLO PREVENTIVO
// ———————————————————————————————
function calcolaPreventivo() {
  const stanze  = parseInt(document.getElementById('rooms').value)  || 0;
  const medici  = parseInt(document.getElementById('doctors').value)|| 0;
  const bundle  = document.getElementById('bundle').value;
  const crm     = document.getElementById('crm').checked;
  const tablet  = document.getElementById('tabletFirma').checked;
  const lettore = document.getElementById('lettoreTessera').checked;

  if (!stanze || !medici) {
    mostraErrore('Inserisci valori validi per ambulatori e medici');
    return;
  }

  // base tariffa
  const idx = getIndiceStanze(stanze);
  let unit = prezzi[bundle][ crm ? 'crm' : 'solo' ][idx];
  // sconto se pochi medici
  if (medici / stanze <= 1.3) unit /= 1.5;

  const canoneReale = unit * stanze;
  const setupReale  = setupFees[idx];

  // opzionali fissi
  const tabletFee  = tablet  ? 429 : 0;
  const lettoreFee = lettore ?  79 : 0;

  // add-on variabili
  const addons = Array.from(document.querySelectorAll('.addon:checked'))
    .map(el=>({
      name : el.dataset.name,
      price: parseFloat(el.dataset.price)||0,
      setup: parseFloat(el.dataset.setup)||0
    }));
  const addonMens = addons.reduce((s,a)=> s + a.price, 0);
  const addonSetup= addons.reduce((s,a)=> s + a.setup, 0);

  // prezzi a listino con maggiorazione 25% e setup x2
  const canoneListino = (canoneReale + addonMens) * 1.25;
  const setupListino  = (setupReale + addonSetup)  * 2;
  const totaleListino = setupListino + tabletFee + lettoreFee;
  const totaleReale   = setupReale + addonSetup + tabletFee + lettoreFee;

  // salvo per PDF
  window._preventivo = {
    // sezione Dati Struttura
    nomeStruttura: '',
    referente:    '',
    email:        '',
    telefono:     '',
    // sezione Base
    rooms:        stanze,
    doctors:      medici,
    bundle,
    crm, tablet, lettore,
    // addon
    addons:       addons.map(a=>a.name),
    // prezzi
    canoneReale, setupReale,
    addonMens, addonSetup,
    canoneListino, setupListino, totaleListino, totaleReale
  };

  // aggiorno DOM
  document.getElementById('monthly-list-price').textContent = `${canoneListino.toFixed(2)} €`;
  document.getElementById('setup-list-price').textContent   = `${setupListino.toFixed(2)} €`;
  document.getElementById('setup-total').textContent       = `${totaleListino.toFixed(2)} €`;
  document.getElementById('listino-panel').classList.remove('hidden');
  document.getElementById('generate-pdf-btn').classList.remove('hidden');
  toggleModal('addon-modal', false);
}

// ———————————————————————————————
// SIMULAZIONE PROMOZIONE
// ———————————————————————————————
function avviaVerifica() {
  const spinner = document.getElementById('loading-spinner');
  const countdownEl = document.getElementById('countdown');
  const bar = document.getElementById('progressBar');

  spinner.classList.remove('hidden');
  document.getElementById('dettaglio-panel').classList.add('hidden');
  bar.style.width = '0%';

  let progress = 0;
  const anim = setInterval(()=>{
    progress += 100/150;
    bar.style.width = `${progress}%`;
    if (progress>=100) clearInterval(anim);
  },100);

  let secs = 15;
  countdownEl.textContent = `Attendere ${secs}s...`;
  const timer = setInterval(()=>{
    secs--;
    countdownEl.textContent = `Attendere ${secs}s...`;
    if (secs<=0) {
      clearInterval(timer);
      spinner.classList.add('hidden');
      mostraOffertaRiservata();
    }
  },1000);
}

function mostraOffertaRiservata() {
  const d = window._preventivo;
  document.getElementById('default-monthly-price').textContent = `${d.canoneReale.toFixed(2)} €`;
  document.getElementById('list-monthly-crossed').textContent = `${d.canoneListino.toFixed(2)} €`;
  document.getElementById('setup-fee').textContent           = `${d.setupReale.toFixed(2)} €`;
  document.getElementById('list-setup-crossed').textContent = `${d.setupListino.toFixed(2)} €`;

  document.getElementById('dettaglio-panel').classList.remove('hidden');
  document.getElementById('dettaglio-panel').scrollIntoView({behavior:'smooth'});
}

// ———————————————————————————————
// GENERAZIONE PDF
// ———————————————————————————————
async function confermaGenerazionePDF() {
  // prendo i dati extra dal form
  const nomeS = document.getElementById('nomeStruttura').value.trim();
  const ref   = document.getElementById('nomeReferente').value.trim();
  const email = document.getElementById('email').value.trim();
  const tel   = document.getElementById('telefono').value.trim();

  if(!nomeS||!ref||!email||!tel) {
    mostraErrore('Compila tutti i campi per il PDF (Struttura, Referente, Email, Telefono)');
    return;
  }
  toggleModal('pdf-modal', false);

  // aggiorno dati globali
  Object.assign(window._preventivo, {
    nomeStruttura: nomeS,
    referente: ref,
    email, telefono: tel
  });

  await generaPDF(window._preventivo);
}

async function generaPDF(d) {
  try {
    // carica il PDF modello
    const url = 'https://alfpes24.github.io/gipotest25/preventivo.pdf';
    const existingBytes = await fetch(url).then(r=>r.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(existingBytes);
    const form   = pdfDoc.getForm();

    // 1. Dati Struttura
    form.getTextField('nome_struttura').setText(d.nomeStruttura);
    form.getTextField('referente').setText(d.referente);
    form.getTextField('email').setText(d.email);
    form.getTextField('telefono').setText(d.telefono);

    // 2. Configurazione Base
    form.getTextField('n_ambulatori').setText(d.rooms.toString());
    form.getTextField('n_medici').setText(d.doctors.toString());
    form.getTextField('versione_gipo').setText(d.bundle.toUpperCase());
    form.getTextField('crm_incluso').setText(d.crm ? 'Sì' : 'No');
    form.getTextField('tablet_firma').setText(d.tablet ? 'Sì' : 'No');
    form.getTextField('lettore_ts').setText(d.lettore ? 'Sì' : 'No');

    // 3. Moduli Aggiuntivi
    form.getTextField('moduli_aggiuntivi').setText(d.addons.join(', ') || '-');

    // 4. Prezzi di Listino
    form.getTextField('canone_listino').setText(d.canoneListino.toFixed(2));
    form.getTextField('setup_listino').setText(d.setupListino.toFixed(2));
    form.getTextField('totale_setup_listino').setText(d.totaleListino.toFixed(2));

    // 5. Offerta Riservata
    form.getTextField('canone_promozionale').setText(d.canoneReale.toFixed(2));
    form.getTextField('setup_scontato').setText(d.setupReale.toFixed(2));
    form.getTextField('totale_setup_reale').setText(d.totaleReale.toFixed(2));

    // 6. Dettaglio Sconti (puoi personalizzare)
    form.getTextField('sconti_attivi').setText('–');
    form.getTextField('scadenza_offerta').setText(new Date(Date.now()+7*24*3600e3).toLocaleDateString('it-IT'));

    // 7. Totale Preventivo
    form.getTextField('totale_preventivo_mensile').setText((d.canoneReale).toFixed(2));

    // 8. Note Aggiuntive
    form.getTextField('note_aggiuntive').setText('-');

    // 9. Firma e Accettazione
    const today = new Date();
    form.getTextField('luogo').setText('Firma in Sede');
    form.getTextField('data').setText(today.toLocaleDateString('it-IT'));
    form.getTextField('firma_referente').setText(d.referente);

    // salva e download
    const pdfBytes = await pdfDoc.save();
    const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
    const link     = document.createElement('a');
    link.href      = URL.createObjectURL(blob);
    link.download  = `Preventivo_${d.nomeStruttura}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);

  } catch (err) {
    console.error(err);
    mostraErrore('Errore generazione PDF');
  }
}

// ———————————————————————————————
// INIT
// ———————————————————————————————
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('calculate-btn').addEventListener('click', calcolaPreventivo);
  document.getElementById('addon-btn').addEventListener('click', ()=> toggleModal('addon-modal', true));
  document.getElementById('close-addon').addEventListener('click', ()=> toggleModal('addon-modal', false));
  document.getElementById('check-btn').addEventListener('click', avviaVerifica);
  document.getElementById('generate-pdf-btn').addEventListener('click', ()=> toggleModal('pdf-modal', true));
  document.getElementById('annulla-pdf').addEventListener('click', ()=> toggleModal('pdf-modal', false));
  document.getElementById('conferma-pdf').addEventListener('click', confermaGenerazionePDF);
});
