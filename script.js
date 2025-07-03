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
  setTimeout(() => div.remove(), 3000);
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
  let unit = prezzi[bundle][crm ? 'crm' : 'solo'][idx];
  if (medici / stanze <= 1.3) unit /= 1.5;

  const canoneReale = unit * stanze;
  const setupReale  = setupFees[idx];

  const tabletFee  = tablet  ? 429 : 0;
  const lettoreFee = lettore ?  79 : 0;

  const addons = Array.from(document.querySelectorAll('.addon:checked'))
    .map(el => ({ name: el.dataset.name, price: parseFloat(el.dataset.price)||0, setup: parseFloat(el.dataset.setup)||0 }));
  const addonMens  = addons.reduce((s,a)=> s+a.price,0);
  const addonSetup = addons.reduce((s,a)=> s+a.setup,0);

  const canoneListino  = (canoneReale + addonMens)*1.25;
  const setupListino   = (setupReale  + addonSetup)*2;
  const totaleListino  = setupListino + tabletFee + lettoreFee;
  const totaleReale    = setupReale + addonSetup + tabletFee + lettoreFee;

  window._preventivo = { nomeStruttura:'', referente:'', telefono:'', dataPreventivo:'', rooms:stanze, doctors:medici, bundle, crm, tablet, lettore, addons:addons.map(a=>a.name), canoneReale, setupReale, addonMens, addonSetup, canoneListino, setupListino, totaleListino, totaleReale };

  document.getElementById('monthly-list-price').textContent = `${canoneListino.toFixed(2)} €`;
  document.getElementById('setup-list-price').textContent   = `${setupListino.toFixed(2)} €`;
  document.getElementById('setup-total').textContent       = `${totaleListino.toFixed(2)} €`;
  document.getElementById('listino-panel').classList.remove('hidden');
  document.getElementById('generate-pdf-btn').classList.remove('hidden');
  toggleModal('addon-modal', false);
}

// ———————————————————————————————
// RIEMPIMENTO CAMPI PDF
// ———————————————————————————————
function fillPDFFields(form, d) {
  try { form.getField("nome_struttura").setText(d["nome_struttura"]||""); } catch(e){console.warn("Campo non trovato: nome_struttura");}
  try { form.getField("nome_referente").setText(d["nome_referente"]||""); } catch(e){console.warn("Campo non trovato: nome_referente");}
  try { form.getField("nome_sale").setText(d["nome_sale"]||""); } catch(e){console.warn("Campo non trovato: nome_sale");}
  try { form.getField("data_preventivo").setText(d["data_preventivo"]||""); } catch(e){console.warn("Campo non trovato: data_preventivo");}
  try { form.getField("nome_struttura_2").setText(d["nome_struttura_2"]||""); } catch(e){console.warn("Campo non trovato: nome_struttura_2");}
  try { form.getField("nome_referente_2").setText(d["nome_referente_2"]||""); } catch(e){console.warn("Campo non trovato: nome_referente_2");}
  try { form.getField("telefono_sale").setText(d["telefono_sale"]||""); } catch(e){console.warn("Campo non trovato: telefono_sale");}
  try { form.getField("n_ambulatori").setText(d["n_ambulatori"]||""); } catch(e){console.warn("Campo non trovato: n_ambulatori");}
  try { form.getField("versione_gipo").setText(d["versione_gipo"]||""); } catch(e){console.warn("Campo non trovato: versione_gipo");}
  try { form.getField("canone_listino").setText(d["canone_listino"]||""); } catch(e){console.warn("Campo non trovato: canone_listino");}
  try { form.getField("n_ambulatori_2").setText(d["n_ambulatori_2"]||""); } catch(e){console.warn("Campo non trovato: n_ambulatori_2");}
  try { form.getField("canone_listino_2").setText(d["canone_listino_2"]||""); } catch(e){console.warn("Campo non trovato: canone_listino_2");}
  try { form.getField("n_gipo_smartQ").setText(d["n_gipo_smartQ"]||""); } catch(e){console.warn("Campo non trovato: n_gipo_smartQ");}
  try { form.getField("prezzo_smartQ").setText(d["prezzo_smartQ"]||""); } catch(e){console.warn("Campo non trovato: prezzo_smartQ");}
  try { form.getField("n_sedi").setText(d["n_sedi"]||""); } catch(e){console.warn("Campo non trovato: n_sedi");}
  try { form.getField("prezzo_modulo_multi_sede").setText(d["prezzo_modulo_multi_sede"]||""); } catch(e){console.warn("Campo non trovato: prezzo_modulo_multi_sede");}
  try { form.getField("n_gipo_sign").setText(d["n_gipo_sign"]||""); } catch(e){console.warn("Campo non trovato: n_gipo_sign");}
  try { form.getField("prezzo_modulo_gipo_sign").setText(d["prezzo_modulo_gipo_sign"]||""); } catch(e){console.warn("Campo non trovato: prezzo_modulo_gipo_sign");}
  try { form.getField("n_gipo_ecr").setText(d["n_gipo_ecr"]||""); } catch(e){console.warn("Campo non trovato: n_gipo_ecr");}
  try { form.getField("prezzo_modulo_gipo_ecr").setText(d["prezzo_modulo_gipo_ecr"]||""); } catch(e){console.warn("Campo non trovato: prezzo_modulo_gipo_ecr");}
  try { form.getField("n_modulo_gipo_ssn").setText(d["n_modulo_gipo_ssn"]||""); } catch(e){console.warn("Campo non trovato: n_modulo_gipo_ssn");}
  try { form.getField("prezzo_modulo_gipo_ssn").setText(d["prezzo_modulo_gipo_ssn"]||""); } catch(e){console.warn("Campo non trovato: prezzo_modulo_gipo_ssn");}
  try { form.getField("n_modulo_gipo_bi").setText(d["n_modulo_gipo_bi"]||""); } catch(e){console.warn("Campo non trovato: n_modulo_gipo_bi");}
  try { form.getField("prezzo_modulo_gipo_bi").setText(d["prezzo_modulo_gipo_bi"]||""); } catch(e){console.warn("Campo non trovato: prezzo_modulo_gipo_bi");}
  try { form.getField("prezzo_modulo_totale_mensile").setText(d["prezzo_modulo_totale_mensile"]||""); } catch(e){console.warn("Campo non trovato: prezzo_modulo_totale_mensile");}
  try { form.getField("n_ts").setText(d["n_ts"]||""); } catch(e){console.warn("Campo non trovato: n_ts");}
  try { form.getField("prezzo_ts").setText(d["prezzo_ts"]||""); } catch(e){console.warn("Campo non trovato: prezzo_ts");}
  try { form.getField("totale_ts").setText(d["totale_ts"]||""); } catch(e){console.warn("Campo non trovato: totale_ts");}
  try { form.getField("n_tablet").setText(d["n_tablet"]||""); } catch(e){console.warn("Campo non trovato: n_tablet");}
  try { form.getField("prezzo_tablet").setText(d["prezzo_tablet"]||""); } catch(e){console.warn("Campo non trovato: prezzo_tablet");}
  try { form.getField("totale_tablet").setText(d["totale_tablet"]||""); } catch(e){console.warn("Campo non trovato: totale_tablet");}
  try { form.getField("prezzo_formazione_listino").setText(d["prezzo_formazione_listino"]||""); } catch(e){console.warn("Campo non trovato: prezzo_formazione_listino");}
  try { form.getField("sconto_formazione").setText(d["sconto_formazione"]||""); } catch(e){console.warn("Campo non trovato: sconto_formazione");}
  try { form.getField("totale_formazione").setText(d["totale_formazione"]||""); } catch(e){console.warn("Campo non trovato: totale_formazione");}
  try { form.getField("setupfee_listino").setText(d["setupfee_listino"]||""); } catch(e){console.warn("Campo non trovato: setupfee_listino");}
  try { form.getField("setupfee_sconto").setText(d["setupfee_sconto"]||""); } catch(e){console.warn("Campo non trovato: setupfee_sconto");}
  try { form.getField("setupfee_totale").setText(d["setupfee_totale"]||""); } catch(e){console.warn("Campo non trovato: setupfee_totale");}
  try { form.getField("totale_una_tantum").setText(d["totale_una_tantum"]||""); } catch(e){console.warn("Campo non trovato: totale_una_tantum");}
}

// ———————————————————————————————
// GENERAZIONE PDF
// ———————————————————————————————
async function generaPDF(d) {
  try {
    const { PDFDocument } = PDFLib;

    // carica il PDF modello dal link raw GitHub
    const url       = 'https://raw.githubusercontent.com/tuo-username/repo/main/preventivo.pdf';
    const bytes     = new Uint8Array(await fetch(url).then(r=>r.arrayBuffer()));
    const pdfDoc    = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form      = pdfDoc.getForm();

    // riempi i campi
    fillPDFFields(form, d);

    // salva e scarica
    const pdfBytes = await pdfDoc.save();
    const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
    const link     = document.createElement('a');
    link.href      = URL.createObjectURL(blob);
    link.download  = `Preventivo_${d.nomeStruttura}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error(err);
    mostraErrore('Errore nella generazione del PDF');
  }
}

// ———————————————————————————————
// EVENTI INIT
// ———————————————————————————————
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('calculate-btn').addEventListener('click', calcolaPreventivo);
  document.getElementById('addon-btn').addEventListener('click', () => toggleModal('addon-modal', true));
  document.getElementById('close-addon').addEventListener('click', () => toggleModal('addon-modal', false));
  document.getElementById('generate-pdf-btn').addEventListener('click', () => toggleModal('pdf-modal', true));
  document.getElementById('annulla-pdf').addEventListener('click', () => toggleModal('pdf-modal', false));
  document.getElementById('conferma-pdf').addEventListener('click', async () => {
    const nomeS    = document.getElementById('nomeStruttura').value.trim();
    const ref      = document.getElementById('nomeReferente').value.trim();
    const tel      = document.getElementById('telefono').value.trim();
    const dataPrev = new Date().toLocaleDateString('it-IT');
    if(!nomeS||!ref||!tel){ mostraErrore('Compila tutti i campi per il PDF'); return; }
    toggleModal('pdf-modal', false);
    window._preventivo = { ...window._preventivo, nome_struttura: nomeS, nome_referente: ref, telefono_sale: tel, data_preventivo: dataPrev };
    await generaPDF(window._preventivo);
  });
});
