:root {
  --font: 'Inter', sans-serif;
  --bg: #f7fafc;
  --text: #1f2937;
  --muted: #6b7280;
  --primary: #009ca6;
  --primary-dark: #007d89;
  --promo: #fef3c7;
  --danger: #e11d48;
  --border: #e5e7eb;
  --radius: 10px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  padding: 24px;
}

/* === Layout principale === */
.layout-container {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto 40px auto;
}

.presentation {
  flex: 0 0 50%;
  max-width: 50%;
}

.form-box {
  flex: 0 0 50%;
  max-width: 50%;
  background: white;
  padding: 24px;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

/* === Responsive mobile === */
@media (max-width: 768px) {
  .layout-container {
    flex-direction: column;
  }
  .presentation,
  .form-box {
    max-width: 100%;
    flex: 0 0 100%;
  }
}

/* === Presentazione === */
.logo {
  width: 160px;
  margin-bottom: 20px;
}

.presentation h1 {
  font-size: 26px;
  color: var(--primary);
  font-weight: 700;
  margin-bottom: 10px;
}

.lead {
  font-size: 15px;
  color: var(--muted);
  margin-bottom: 20px;
}

.features {
  list-style: none;
  margin-bottom: 20px;
}

.features li {
  font-size: 15px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  display: inline-block;
  background: var(--promo);
  color: #92400e;
  padding: 6px 12px;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 14px;
}

/* === Form preventivo === */
.form-box h2 {
  font-size: 18px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

label {
  font-size: 14px;
  margin-bottom: 6px;
  display: block;
}

input,
select {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: #f9fafb;
}

input:focus,
select:focus {
  border-color: var(--primary);
  outline: none;
}

.checkbox {
  display: flex;
  align-items: center;
}

.checkbox input {
  margin-right: 8px;
  width: 16px;
  height: 16px;
}

/* === Pulsanti === */
.btn-primary,
.btn-outline {
  display: block;
  width: 100%;
  padding: 12px;
  font-weight: 600;
  font-size: 16px;
  text-align: center;
  text-decoration: none;
  border-radius: var(--radius);
  margin-top: 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-outline {
  background: white;
  border: 2px solid var(--primary);
  color: var(--primary);
}

.btn-outline:hover {
  background: var(--primary);
  color: white;
}

.full {
  width: 100%;
}

/* === Pannelli === */
.card {
  background: white;
  border-radius: var(--radius);
  padding: 32px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  max-width: 700px;
  margin: 0 auto 30px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
}

.crossed {
  text-decoration: line-through;
  color: var(--muted);
  font-size: 14px;
  margin-left: 10px;
}

.promo-price {
  color: var(--primary-dark);
  font-size: 18px;
  font-weight: bold;
}

.bonus {
  color: var(--primary);
  font-weight: 600;
}

.timer {
  color: var(--danger);
  font-weight: 600;
}

.hidden {
  display: none !important;
}

/* === Barra di caricamento === */
.progress-container {
  width: 100%;
  height: 14px;
  background-color: var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin: 20px 0;
}

.progress-bar {
  height: 100%;
  width: 0%;
  background-color: var(--primary);
  transition: width 0.2s linear;
}

.verifica-msg {
  font-size: 16px;
  text-align: center;
  color: var(--muted);
  margin-top: 10px;
}

.loader-icon {
  margin-right: 6px;
}

/* === Popup Add-On & PDF === */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-content {
  background: #fff;
  padding: 30px;
  border-radius: var(--radius);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.modal-content h3 {
  font-size: 20px;
  margin-bottom: 16px;
  color: var(--primary-dark);
}

.modal-content label {
  display: block;
  margin-bottom: 10px;
  font-size: 15px;
  cursor: pointer;
  line-height: 1.4;
}

.modal-content input[type="checkbox"],
.modal-content input[type="text"] {
  margin-right: 8px;
  padding: 6px;
  font-size: 14px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.modal-content input[type="text"] {
  width: 100%;
  margin-bottom: 12px;
}
