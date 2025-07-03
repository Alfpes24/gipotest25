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

  const idx = getIndiceStanze(stanze);
  let unit = prezzi[bundle][ crm ? 'crm' : 'solo' ][idx];
  if (medici / stanze <= 1.3) unit /= 1.5;

  const canoneReale = unit * stanze;
  const setupReale  = setupFees[idx];

  const tabletFee  = tablet  ? 429 : 0;
  const lettoreFee = lettore ?  79 : 0;

  const addons = Array.from(document.querySelectorAll('.addon:checked'))
    .map(el=>({
      name : el.dataset.name,
      price: parseFloat(el.dataset.price)||0,
      setup: parseFloat(el.dataset.setup)||0
    }));
  const addonMens = addons.reduce((s,a)=> s + a.price, 0);
  const addonSetup= addons.reduce((s,a)=> s + a.setup, 0);

  const canoneListino = (canoneReale + addonMens) * 1.25;
  const setupListino  = (setupReale + addonSetup)  * 2;
  const totaleListino = setupListino + tabletFee + lettoreFee;
  const totaleReale   = setupReale + addonSetup + tabletFee + lettoreFee;

  window._preventivo = {
    // sezione Dati Struttura
    nomeStruttura: '',
    referente:    '',
    telefono:     '',
    dataPreventivo: '',
    // sezione Base
    rooms:        stanze,
    doctors:      medici,
    bundle,
    crm, tablet, lettore,
    addons:       addons.map(a=>a.name),
    // prezzi
    canoneReale, setupReale,
    addonMens, addonSetup,
    canoneListino, setupListino, totaleListino, totaleReale
  };

  document.getElementById('monthly-list-price').textContent = `${canoneListino.toFixed(2)} €`;
  document.getElementById('setup-list-price').textContent   = `${setupListino.toFixed(2)} €`;
  document.getElementById('setup-total').textContent       = `${totaleListino.toFixed(2)} €`;
  document.getElementById('listino-panel').classList.remove('hidden');
  document.getElementById('generate-pdf-btn').classList.remove('hidden');
  toggleModal('addon-modal', false);
}

// ———————————————————————————————
// GENERAZIONE PDF
// ———————————————————————————————
async function confermaGenerazionePDF() {
  const nomeS = document.getElementById('nomeStruttura').value.trim();
  const ref   = document.getElementById('nomeReferente').value.trim();
  const tel   = document.getElementById('telefono').value.trim();
  const dataPrev = new Date().toLocaleDateString('it-IT');

  if(!nomeS||!ref||!tel) {
    mostraErrore('Compila tutti i campi per il PDF (Struttura, Referente, Telefono)');
    return;
  }
  toggleModal('pdf-modal', false);

  Object.assign(window._preventivo, {
    nomeStruttura: nomeS,
    referente: ref,
    telefono: tel,
    dataPreventivo: dataPrev
  });

  await generaPDF(window._preventivo);
}

async function generaPDF(d) {
  try {
    // carica il PDF modello dal percorso relativo
    const url = 'https://alfpes24.github.io/gipotest25/preventivo.pdf';
    const existingBytes = await fetch(url).then(r=>r.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(existingBytes);
    const form   = pdfDoc.getForm();

    // helper per scrivere in sicurezza
    function setField(name, value) {
      try {
        const field = form.getField(name);
        field.setText(value);
      } catch (e) {
        console.warn(`Campo '${name}' non trovato`, e);
      }
    }

    // 1. Dati Struttura
    setField('nome_struttura', d.nomeStruttura);
    setField('nome_referente', d.referente);
    setField('telefono_sale', d.telefono);
    setField('data_preventivo', d.dataPreventivo);

    // 2. Configurazione Base
    setField('n_ambulatori', d.rooms.toString());
    setField('versione_gipo', d.bundle.toUpperCase());
    setField('canone_listino', d.canoneListino.toFixed(2));

    // 3. Moduli Aggiuntivi (lista generica)
    setField('moduli_aggiuntivi', d.addons.join(', ') || '-');

    // 4. Offerta Riservata
    setField('canone_promozionale', d.canoneReale.toFixed(2));
    setField('setup_scontato', d.setupReale.toFixed(2));
    setField('totale_setup_reale', d.totaleReale.toFixed(2));

    // 5. Totale Preventivo
    setField('totale_preventivo_mensile', d.canoneReale.toFixed(2));

    // 6. Firma e Data
    setField('luogo', 'Firma in Sede');
    setField('data', new Date().toLocaleDateString('it-IT'));
    setField('firma_referente', d.referente);

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
  document.getElementById('generate-pdf-btn').addEventListener('click', ()=> toggleModal('pdf-modal', true));
  document.getElementById('annulla-pdf').addEventListener('click', ()=> toggleModal('pdf-modal', false));
  document.getElementById('conferma-pdf').addEventListener('click', confermaGenerazionePDF);
});
