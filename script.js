'use strict';

const modal    = document.getElementById('bookingModal');
const btnDesk  = document.getElementById('openModalDesktop');
const btnMob   = document.getElementById('openModalMobile');
const btnClose = document.getElementById('closeModal');
const backdrop = document.getElementById('closeModalBackdrop');
const form     = document.getElementById('bookingForm');
const phoneInput = document.getElementById('fieldPhone');

function openModal() {
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  // Focus first visible input after transition
  setTimeout(() => {
    const first = modal.querySelector('input:not([type=checkbox])');
    if (first) first.focus();
  }, 50);
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  // restore scroll after the CSS visibility transition finishes (450ms)
  setTimeout(() => { document.body.style.overflow = ''; }, 450);
}

btnDesk   && btnDesk.addEventListener('click', openModal);
btnMob    && btnMob.addEventListener('click', openModal);
btnClose  && btnClose.addEventListener('click', closeModal);
backdrop  && backdrop.addEventListener('click', closeModal);

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
});

// Phone mask: +7 (XXX) XXX-XX-XX
if (phoneInput) {
  phoneInput.addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '');
    if (val.startsWith('8')) val = '7' + val.slice(1);
    if (!val.startsWith('7')) val = '7' + val;
    val = val.slice(0, 11);

    let formatted = '+7';
    if (val.length > 1) formatted += ' (' + val.slice(1, 4);
    if (val.length >= 4) formatted += ') ' + val.slice(4, 7);
    if (val.length >= 7) formatted += '-' + val.slice(7, 9);
    if (val.length >= 9) formatted += '-' + val.slice(9, 11);

    this.value = formatted;
  });

  phoneInput.addEventListener('keydown', function (e) {
    if (e.key === 'Backspace' && this.value === '+7 (') {
      this.value = '';
      e.preventDefault();
    }
  });
}

// Form submit
form && form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const nameInput    = document.getElementById('fieldName');
  const commentInput = document.getElementById('fieldComment');
  const consentInput = document.getElementById('consentCheck');
  const btn          = form.querySelector('.btn-submit');

  const name    = nameInput.value.trim();
  const phone   = phoneInput.value.trim();
  const comment = commentInput.value.trim();
  const consent = consentInput.checked;

  // Client-side validation
  if (!name)  { nameInput.focus();  return; }
  if (!phone || phone.replace(/\D/g, '').length < 11) { phoneInput.focus(); return; }
  if (!consent) { consentInput.focus(); return; }

  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = 'ОТПРАВКА…';

  try {
    const res  = await fetch('send.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, phone, comment, consent }),
    });
    const json = await res.json();

    if (json.ok) {
      btn.textContent = 'ОТПРАВЛЕНО!';
      setTimeout(() => {
        btn.textContent = orig;
        btn.disabled    = false;
        form.reset();
        closeModal();
      }, 1600);
    } else {
      const msg = json.errors ? json.errors.join('\n') : (json.error || 'Ошибка отправки');
      alert(msg);
      btn.textContent = orig;
      btn.disabled    = false;
    }
  } catch {
    alert('Не удалось отправить заявку. Проверьте соединение.');
    btn.textContent = orig;
    btn.disabled    = false;
  }
});

// Sync checkbox visual state when label is clicked
const consentCheck = document.getElementById('consentCheck');
consentCheck && consentCheck.addEventListener('change', function () {
  // The CSS handles visual state via :checked pseudo-class, nothing extra needed
});

// Cookie banner
(function () {
  const banner     = document.getElementById('cookieBanner');
  const acceptBtn  = document.getElementById('cookieAccept');
  const declineBtn = document.getElementById('cookieDecline');
  if (!banner) return;

  function hideBanner() {
    banner.classList.remove('is-visible');
    banner.setAttribute('aria-hidden', 'true');
  }

  if (!localStorage.getItem('cookiesChoice')) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        banner.classList.add('is-visible');
        banner.setAttribute('aria-hidden', 'false');
      });
    });
  }

  acceptBtn && acceptBtn.addEventListener('click', function () {
    localStorage.setItem('cookiesChoice', 'accepted');
    hideBanner();
  });

  declineBtn && declineBtn.addEventListener('click', function () {
    localStorage.setItem('cookiesChoice', 'declined');
    hideBanner();
  });
}());
