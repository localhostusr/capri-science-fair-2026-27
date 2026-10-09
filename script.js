// ===== Configuration =====
const CONFIG = {
    // UPDATE THIS: Your Google Apps Script Web App URL after deploying
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwRAR60DTotOBdDuemXk3xDd8nd05sr6XYBIvPyojZQS0gYKQaMPZeiz0P3s0vS0y4/exec',

    // Final Approval and sign-up close are both Thu Nov 12 (Kris, 2026-10-05)
    DEADLINE: new Date('2026-11-12T23:55:00'),

    // Backend is live only once the 2026-27 Apps Script URL is set above.
    // Until then the form is replaced by a "sign-ups opening soon" notice.
    BACKEND_LIVE: true
};

// ===== Visit Tracking =====
(function pingVisit() {
    if (!CONFIG.APPS_SCRIPT_URL) return;
    let sid = localStorage.getItem('csf-sid');
    if (!sid) {
        sid = 'sid-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('csf-sid', sid);
    }
    fetch(CONFIG.APPS_SCRIPT_URL + '?action=visit&sid=' + encodeURIComponent(sid) + '&page=signup', { mode: 'no-cors' });
})();

// ===== Language Toggle =====
let currentLang = 'en';

function setLang(lang) {
    currentLang = lang;

    // Update toggle buttons
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
    document.getElementById('btn-es').classList.toggle('active', lang === 'es');

    // Update all elements with data-en / data-es attributes
    document.querySelectorAll('[data-en]').forEach(el => {
        el.innerHTML = el.getAttribute('data-' + lang) || el.getAttribute('data-en');
    });

    // Update placeholders
    document.querySelectorAll('[data-en-placeholder]').forEach(el => {
        el.placeholder = el.getAttribute('data-' + lang + '-placeholder') || el.getAttribute('data-en-placeholder');
    });

    // Update select options
    document.querySelectorAll('option[data-en]').forEach(el => {
        el.textContent = el.getAttribute('data-' + lang) || el.getAttribute('data-en');
    });

    // Update html lang attribute
    document.documentElement.lang = lang;

    // Update deadline date display
    updateDeadlineDisplay();

    // Re-label the test-tube meter and countdown in the new language
    updateTubeMeter();
    if (document.getElementById('countdown')) updateCountdown();
}

// ===== Test-Tube Progress Meter (display only — never blocks submit) =====
const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FLASK_RISE_PX = 80; // how far the big flask's liquid climbs at 100%

// Short name for a required field, taken from its label (consent checkbox gets a short name)
function fieldName(el, isEs) {
    if (el.type === 'checkbox') return isEs ? 'casilla de privacidad' : 'privacy checkbox';
    const label = el.id && document.querySelector('label[for="' + el.id + '"]');
    return label ? label.textContent.replace('*', '').trim() : (isEs ? 'un campo' : 'a field');
}

// Tapping the meter jumps to the next field that still needs attention
function jumpToNextField() {
    const meter = document.getElementById('tube-meter');
    const el = meter && meter._nextField;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 160;  // clear the sticky bar
    window.scrollTo({ top: top, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
    if (typeof el.reportValidity === 'function') el.reportValidity();  // shows the browser's own hint, e.g. "include an @"
}

function updateTubeMeter() {
    const form = document.getElementById('signup-form');
    const meter = document.getElementById('tube-meter');
    if (!form || !meter) return;

    // Count required fields that are visible and valid (reads validity only, never values)
    const required = Array.from(form.querySelectorAll('[required]')).filter(el => el.offsetParent !== null || el.type === 'checkbox');
    const done = required.filter(el => el.checkValidity()).length;
    const pct = required.length ? Math.round((done / required.length) * 100) : 0;
    const firstMissing = required.find(el => !el.checkValidity());
    meter._nextField = firstMissing || null;

    const liquid = document.getElementById('tube-liquid');
    if (liquid) liquid.style.width = pct + '%';

    const flask = document.getElementById('flask-liquid');
    if (flask) flask.style.transform = 'translateY(' + (-FLASK_RISE_PX * pct / 100) + 'px)';

    const label = document.getElementById('tube-label');
    const isEs = currentLang === 'es';
    if (label) {
        // Long label on wide screens; on phones CSS hides the .tube-long parts so the tube gets the room
        const parts = pct === 100
            ? [[isEs ? '¡Listo' : 'Ready', ''], [isEs ? ' para despegar' : ' to launch', 'tube-long'], ['! 🚀', '']]
            : [[isEs ? 'Experimento ' : 'Experiment ', 'tube-long'], [pct + '%', ''], [isEs ? ' completo' : ' complete', 'tube-long']];
        // Once started, name the next field that still needs attention (e.g. "· next: Email")
        if (pct > 0 && pct < 100 && firstMissing) {
            parts.push(['\u00a0· ' + (isEs ? 'sigue: ' : 'next: ') + fieldName(firstMissing, isEs), 'tube-next']);
        }
        label.replaceChildren(...parts.map(([text, cls]) => {
            const s = document.createElement('span');
            if (cls) s.className = cls;
            s.textContent = text;
            return s;
        }));
    }

    meter.setAttribute('aria-valuenow', String(pct));
    meter.classList.toggle('tube-active', pct > 0 && pct < 100);
    meter.classList.toggle('tube-full', pct === 100);
}

// ===== Hero particles: 3x the floaters, each at its own speed (1 = lazy drift, 10 = quick) =====
const EXTRA_PARTICLES = 54;          // 27 in the HTML + 54 here = 81 total (desktop)
const EXTRA_PARTICLES_PHONE = 18;    // 27 + 18 = 45 on small screens, where the header is much smaller
const SPEED_SLOWEST_S = 30;          // speed 1 → one loop every 30s
const SPEED_FASTEST_S = 4;           // speed 10 → one loop every 4s

function particleDuration(speed) {
    return SPEED_SLOWEST_S - (speed - 1) * (SPEED_SLOWEST_S - SPEED_FASTEST_S) / 9;
}

function addHeroParticles() {
    const box = document.querySelector('.science-particles');
    if (!box || REDUCED_MOTION) return;
    const shapes = ['atom', 'atom', 'molecule', 'hexagon'];
    const paths = ['floatA', 'floatB', 'floatC', 'floatD', 'floatD'];
    const rand = (a, b) => a + Math.random() * (b - a);

    const extra = window.innerWidth < 600 ? EXTRA_PARTICLES_PHONE : EXTRA_PARTICLES;
    for (let i = 0; i < extra; i++) {
        const p = document.createElement('div');
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        p.className = 'particle ' + shape;
        if (shape !== 'hexagon') {
            const size = Math.round(rand(3, 13));
            p.style.width = size + 'px';
            p.style.height = size + 'px';
        }
        p.style.top = rand(2, 92) + '%';
        p.style.left = rand(1, 97) + '%';
        box.appendChild(p);
    }

    // Give every floater (original + new) its own speed from 1 to 10, starting mid-path
    box.querySelectorAll('.particle').forEach(p => {
        const speed = 1 + Math.floor(Math.random() * 10);
        const dur = particleDuration(speed);
        const path = paths[Math.floor(Math.random() * paths.length)];
        p.style.animation = path + ' ' + dur.toFixed(1) + 's ease-in-out ' + (-rand(0, dur)).toFixed(1) + 's infinite' + (Math.random() < 0.5 ? ' reverse' : '');
    });
}

// ===== Countdown to the Fair (not a deadline — just excitement) =====
function updateDeadlineDisplay() {
    // No hard deadline to display — banner is now a static reminder
}

function updateCountdown() {
    const fairDate = new Date('2026-11-19T17:00:00'); // Fair starts at 5 PM
    const now = new Date();
    const diff = fairDate - now;
    const countdownEl = document.getElementById('countdown');

    // Close the sign-up form once the deadline passes
    if (now > CONFIG.DEADLINE) {
        const form = document.getElementById('signup-form');
        const banner = document.getElementById('deadline-banner');
        const header = document.getElementById('form-header');
        const closed = document.getElementById('form-closed');
        // Only hide if success card isn't already showing (don't yank a just-submitted confirmation)
        const success = document.getElementById('success-message');
        const successVisible = success && success.style.display !== 'none' && success.offsetParent !== null;
        if (!successVisible) {
            if (form) form.style.display = 'none';
            if (banner) banner.style.display = 'none';
            if (header) header.style.display = 'none';
            if (closed) closed.style.display = 'block';
        }
    }

    if (!countdownEl) return;

    if (diff <= 0) {
        countdownEl.textContent = currentLang === 'es' ? '¡La Feria de Ciencias es HOY!' : 'The Science Fair is TODAY!';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (currentLang === 'es') {
        countdownEl.textContent = `🚀 T-menos ${days} día${days !== 1 ? 's' : ''} y ${hours} hora${hours !== 1 ? 's' : ''} para la Feria de Ciencias`;
    } else {
        countdownEl.textContent = `🚀 T-minus ${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''} until the Science Fair`;
    }

    // Rocket climbs from site launch to fair night
    const launch = new Date('2026-09-30T00:00:00');
    const pct = Math.min(100, Math.max(0, (now - launch) / (fairDate - launch) * 100));
    const rocket = document.getElementById('rocket');
    const trail = document.getElementById('rocket-trail');
    if (rocket) rocket.style.left = pct + '%';
    if (trail) trail.style.width = pct + '%';
}

// ===== Mystery question ticker (hero): types a curious question, holds, erases, next =====
const HERO_QUESTIONS = [
    ['Why does a curveball curve?', '¿Por qué se curva una bola curva?'],
    ['Can a Lego bridge hold a backpack?', '¿Puede un puente de Lego sostener una mochila?'],
    ['Do plants grow faster with music?', '¿Crecen más rápido las plantas con música?'],
    ['Which paper airplane flies the farthest?', '¿Qué avión de papel vuela más lejos?'],
    ['Why do roller coasters make your stomach drop?', '¿Por qué las montañas rusas te dan cosquillas en la panza?'],
    ['Does a cold basketball bounce lower?', '¿Rebota menos un balón de básquetbol frío?'],
    ['What makes popcorn pop?', '¿Qué hace que las palomitas exploten?'],
    ['Can you hear sound underwater?', '¿Se puede escuchar el sonido bajo el agua?'],
    ['Why do cookies spread in the oven?', '¿Por qué las galletas se extienden en el horno?'],
    ['Which sunscreen blocks the most sun?', '¿Qué protector solar bloquea más sol?'],
];
const HQ_TYPE_MS = 45;
const HQ_HOLD_MS = 2600;

function startQuestionTicker() {
    const el = document.getElementById('hq-text');
    if (!el) return;
    let i = Math.floor(Math.random() * HERO_QUESTIONS.length);
    const text = () => HERO_QUESTIONS[i][currentLang === 'es' ? 1 : 0];

    if (REDUCED_MOTION) {
        // No typing animation: just swap the question every few seconds
        el.textContent = text();
        setInterval(() => { i = (i + 1) % HERO_QUESTIONS.length; el.textContent = text(); }, 6000);
        return;
    }

    const typeNext = () => {
        const q = text();
        let n = 0;
        const typer = setInterval(() => {
            el.textContent = q.slice(0, ++n);
            if (n >= q.length) {
                clearInterval(typer);
                setTimeout(() => {
                    const eraser = setInterval(() => {
                        el.textContent = el.textContent.slice(0, -1);
                        if (!el.textContent) {
                            clearInterval(eraser);
                            i = (i + 1) % HERO_QUESTIONS.length;
                            setTimeout(typeNext, 350);
                        }
                    }, 18);
                }, HQ_HOLD_MS);
            }
        }, HQ_TYPE_MS);
    };
    setTimeout(typeNext, 1800); // after the hero entrance animation
}

// ===== Catch-an-atom easter egg: tap atoms in the header; catch 5 to unlock a fun fact =====
const ATOMS_TO_UNLOCK = 5;
const CATCH_RADIUS_PX = 28;  // generous so small atoms are tappable on phones
const FUN_FACTS = [
    ['A teaspoon of a neutron star would weigh about 6 billion tons!', '¡Una cucharadita de una estrella de neutrones pesaría unos 6 mil millones de toneladas!'],
    ['Octopuses have three hearts and blue blood.', 'Los pulpos tienen tres corazones y sangre azul.'],
    ['Honey never spoils. Archaeologists found 3,000-year-old honey that was still good!', 'La miel nunca se echa a perder. ¡Encontraron miel de 3,000 años que todavía estaba buena!'],
    ['Lightning is about five times hotter than the surface of the Sun.', 'Un rayo es unas cinco veces más caliente que la superficie del Sol.'],
    ['Your body has about as many bacteria cells as human cells.', 'Tu cuerpo tiene casi tantas células de bacterias como células humanas.'],
    ['A day on Venus is longer than a year on Venus.', 'Un día en Venus dura más que un año en Venus.'],
    ['Bananas are slightly radioactive (but totally safe to eat).', 'Los plátanos son un poquito radiactivos (pero son totalmente seguros para comer).'],
    ['Stingrays can sense the electricity in other animals’ muscles.', 'Las mantarrayas pueden sentir la electricidad en los músculos de otros animales.'],
];
let atomsCaught = 0;
let toastTimer = null;

function showAtomToast(msg, big) {
    const t = document.getElementById('atom-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.toggle('atom-toast-big', !!big);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), big ? 7000 : 1400);
}

function popSpark(x, y) {
    const layer = document.createElement('div');
    layer.className = 'atom-pop';
    layer.style.left = x + 'px';
    layer.style.top = y + 'px';
    for (let k = 0; k < 10; k++) {
        const s = document.createElement('span');
        const a = (k / 10) * Math.PI * 2;
        s.style.setProperty('--tx', (Math.cos(a) * 28) + 'px');
        s.style.setProperty('--ty', (Math.sin(a) * 28) + 'px');
        layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 700);
}

function setupAtomCatch() {
    const hero = document.querySelector('.hero');
    if (!hero || REDUCED_MOTION) return;
    hero.addEventListener('pointerdown', e => {
        if (e.target.closest('a, button')) return;  // never steal clicks from logos or links
        let best = null, bestD = CATCH_RADIUS_PX;
        hero.querySelectorAll('.science-particles .particle.atom:not(.caught)').forEach(p => {
            const r = p.getBoundingClientRect();
            const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
            if (d < bestD) { bestD = d; best = p; }
        });
        if (!best) return;
        popSpark(e.clientX, e.clientY);
        best.classList.add('caught');
        setTimeout(() => {  // the atom drifts back in somewhere new
            best.style.top = (5 + Math.random() * 85) + '%';
            best.style.left = (2 + Math.random() * 94) + '%';
            best.classList.remove('caught');
        }, 4000);
        atomsCaught++;
        const isEs = currentLang === 'es';
        if (atomsCaught % ATOMS_TO_UNLOCK === 0) {
            const f = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)][isEs ? 1 : 0];
            showAtomToast((isEs ? '🧪 ¡Laboratorio desbloqueado! ' : '🧪 Lab unlocked! ') + f, true);
        } else {
            const n = atomsCaught % ATOMS_TO_UNLOCK;
            showAtomToast('⚛️ ' + n + '/' + ATOMS_TO_UNLOCK + (isEs ? ' átomos atrapados' : ' atoms caught'));
        }
    });
}

// ===== Group Project Toggle =====
let groupMemberCount = 0;

function toggleGroupFields() {
    const isGroup = document.querySelector('input[name="isGroup"]:checked').value === 'yes';
    const groupFields = document.getElementById('group-fields');
    groupFields.style.display = isGroup ? 'block' : 'none';
    // Auto-add first member row if none exist
    if (isGroup && groupMemberCount === 0) {
        addGroupMember();
    }
}

const MAX_GROUP_MEMBERS = 2; // lead + 2 = groups of up to three

function addGroupMember() {
    if (document.querySelectorAll('.group-member-row').length >= MAX_GROUP_MEMBERS) return;
    groupMemberCount++;
    const list = document.getElementById('group-members-list');
    const n = groupMemberCount;
    const isEs = currentLang === 'es';

    const member = document.createElement('div');
    member.className = 'group-member-row';
    member.id = 'group-member-' + n;
    member.innerHTML = `
        <div class="group-member-header">
            <strong>${isEs ? 'Miembro' : 'Member'} ${n}</strong>
            <button type="button" class="remove-member-btn" onclick="removeGroupMember(${n})">&times;</button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>${isEs ? 'Nombre del Estudiante' : 'Student Name'}</label>
                <input type="text" name="gm${n}_studentName" placeholder="${isEs ? 'Nombre y Apellido' : 'First and Last Name'}">
            </div>
            <div class="form-group">
                <label>${isEs ? 'Grado' : 'Grade'}</label>
                <select name="gm${n}_grade">
                    <option value="">${isEs ? 'Grado' : 'Grade'}</option>
                    <option value="K">K</option>
                    <option value="1">1</option><option value="2">2</option>
                    <option value="3">3</option><option value="4">4</option>
                    <option value="5">5</option><option value="6">6</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>${isEs ? 'Nombre del Padre/Tutor' : 'Parent/Guardian Name'}</label>
                <input type="text" name="gm${n}_parentName" placeholder="${isEs ? 'Nombre y Apellido' : 'First and Last Name'}">
            </div>
            <div class="form-group">
                <label>${isEs ? 'Correo Electrónico' : 'Email'}</label>
                <input type="email" name="gm${n}_parentEmail" placeholder="email@example.com">
            </div>
        </div>
        <div class="form-group">
            <label>${isEs ? 'Teléfono' : 'Phone'}</label>
            <input type="tel" name="gm${n}_parentPhone" placeholder="(555) 555-5555">
        </div>
    `;
    list.appendChild(member);
    updateAddMemberBtn();
}

function removeGroupMember(n) {
    const el = document.getElementById('group-member-' + n);
    if (el) el.remove();
    updateAddMemberBtn();
}

function updateAddMemberBtn() {
    const btn = document.getElementById('add-member-btn');
    if (btn) btn.style.display = document.querySelectorAll('.group-member-row').length >= MAX_GROUP_MEMBERS ? 'none' : '';
}

function collectGroupMembers() {
    const rows = document.querySelectorAll('.group-member-row');
    const members = [];
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input, select');
        const member = {};
        inputs.forEach(input => {
            const name = input.name.replace(/^gm\d+_/, '');
            member[name] = input.value.trim();
        });
        if (member.studentName) {
            members.push(member);
        }
    });
    return JSON.stringify(members);
}

// ===== Safety Materials Toggle =====
function toggleSafetyFields() {
    const hasSafety = document.querySelector('input[name="hasSafety"]:checked').value === 'yes';
    const safetyFields = document.getElementById('safety-fields');
    safetyFields.style.display = hasSafety ? 'block' : 'none';
}

// ===== Form Validation =====
function validateForm(form) {
    let isValid = true;

    // Clear previous errors
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.error-text').forEach(el => el.remove());

    // Required text/select fields
    const required = form.querySelectorAll('input[required]:not([type="checkbox"]), textarea[required], select[required]');
    required.forEach(field => {
        if (!field.value.trim()) {
            markError(field, currentLang === 'es' ? 'Este campo es obligatorio' : 'This field is required');
            isValid = false;
        }
    });

    // Consent checkbox
    const consent = form.querySelector('#consent');
    if (consent && !consent.checked) {
        markError(consent, currentLang === 'es' ? 'Debe aceptar para continuar' : 'You must agree to continue');
        isValid = false;
    }

    // Email validation
    const email = form.querySelector('#parent-email');
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        markError(email, currentLang === 'es' ? 'Ingrese un correo electrónico válido' : 'Please enter a valid email address');
        isValid = false;
    }

    // Phone validation (optional but if provided, should be reasonable)
    const phone = form.querySelector('#parent-phone');
    if (phone.value && phone.value.replace(/\D/g, '').length < 10) {
        markError(phone, currentLang === 'es' ? 'Ingrese un número de teléfono válido' : 'Please enter a valid phone number');
        isValid = false;
    }

    return isValid;
}

function markError(field, message) {
    field.classList.add('error');
    const errorEl = document.createElement('div');
    errorEl.className = 'error-text';
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    field.parentNode.appendChild(errorEl);

    // Clear error on input
    field.addEventListener('input', function handler() {
        field.classList.remove('error');
        const err = field.parentNode.querySelector('.error-text');
        if (err) err.remove();
        field.removeEventListener('input', handler);
    }, { once: true });
}

// ===== Form Submission =====
document.getElementById('signup-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!validateForm(this)) {
        // Scroll to first error
        const firstError = this.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = currentLang === 'es' ? 'Enviando...' : 'Submitting...';

    // Collect form data
    const formData = {
        studentName: document.getElementById('student-name').value.trim(),
        grade: document.getElementById('grade').value,
        teacher: document.getElementById('teacher').value.trim(),
        isGroup: document.querySelector('input[name="isGroup"]:checked').value,
        groupMembers: collectGroupMembers(),
        projectTitle: document.getElementById('project-title').value.trim(),
        projectDescription: document.getElementById('project-description').value.trim(),
        category: document.getElementById('category').value,
        hasSafetyConsiderations: document.querySelector('input[name="hasSafety"]:checked').value,
        safetyDetails: (document.getElementById('safety-details').value || '').trim(),
        parentName: document.getElementById('parent-name').value.trim(),
        parentEmail: document.getElementById('parent-email').value.trim(),
        parentPhone: document.getElementById('parent-phone').value.trim(),
        needBoard: document.querySelector('input[name="needBoard"]:checked').value,
        needPower: document.querySelector('input[name="needPower"]:checked').value,
        specialNeeds: document.getElementById('special-needs').value.trim(),
        language: currentLang,
        timestamp: new Date().toISOString()
    };

    if (CONFIG.BACKEND_LIVE) {
        try {
            const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            eruptThen(showSuccess, formData);
        } catch (error) {
            console.error('Submission error:', error);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            alert(currentLang === 'es'
                ? 'Hubo un error. Por favor intente de nuevo.'
                : 'Something went wrong. Please try again.');
        }
    } else {
        // Demo mode — simulate submission
        console.log('DEMO MODE — Form data:', formData);
        setTimeout(() => showSuccess(formData), 1000);
    }
});

// ===== Volcano Eruption on Submit =====
// Baking-soda volcano of molecules from the submit button, then the success card.
// The callback ALWAYS runs exactly once, even if the effect fails or is skipped.
function eruptThen(callback, data) {
    let done = false;
    const finish = function() {
        if (done) return;
        done = true;
        callback(data);
    };

    if (REDUCED_MOTION) { finish(); return; }

    try {
        const btn = document.getElementById('submit-btn');
        const rect = btn.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top;

        const layer = document.createElement('div');
        layer.className = 'volcano-layer';
        layer.setAttribute('aria-hidden', 'true');

        const lava = document.createElement('div');
        lava.className = 'volcano-lava';
        lava.style.left = originX + 'px';
        lava.style.top = (originY - 80) + 'px';
        layer.appendChild(lava);

        const colors = ['#e8611a', '#9cc5d4', '#ffffff', '#e8611a', '#9cc5d4'];
        for (let i = 0; i < 40; i++) {
            const bit = document.createElement('div');
            const color = colors[i % colors.length];
            const size = 5 + Math.random() * 9;
            // Mostly upward, fanning out like an eruption
            const angle = (-90 + (Math.random() * 110 - 55)) * (Math.PI / 180);
            const distance = 120 + Math.random() * 260;
            bit.className = 'volcano-bit' + (i % 3 === 0 ? ' molecule' : '');
            bit.style.cssText = 'left:' + originX + 'px;top:' + originY + 'px;width:' + size + 'px;height:' + size + 'px;' +
                'background:' + color + ';color:' + color + ';' +
                (color === '#ffffff' ? 'box-shadow:0 0 0 1px rgba(0,0,0,0.15);' : '') +
                '--tx:' + (Math.cos(angle) * distance) + 'px;--ty:' + (Math.sin(angle) * distance) + 'px;' +
                '--rot:' + Math.round(Math.random() * 360) + 'deg;animation-delay:' + (Math.random() * 0.15) + 's;';
            layer.appendChild(bit);
        }

        document.body.appendChild(layer);
        setTimeout(function() { layer.remove(); }, 1400);
        setTimeout(finish, 900);
    } catch (e) {
        finish();
    }
    // Safety net: never leave a family without their confirmation
    setTimeout(finish, 2000);
}

function showSuccess(data) {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('deadline-banner').style.display = 'none';
    document.getElementById('form-header').style.display = 'none';

    // Populate the printable confirmation card with the user's info
    if (data) {
        populateConfirmation(data);
        // Wire up the calendar download
        var calBtn = document.getElementById('add-to-calendar-btn');
        if (calBtn) {
            calBtn.addEventListener('click', function(e) {
                e.preventDefault();
                downloadCalendar(data);
            });
        }
    }

    document.getElementById('success-message').style.display = 'block';
    document.getElementById('success-message').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function populateConfirmation(d) {
    var dl = document.getElementById('conf-details');
    if (!dl) return;
    var isEs = currentLang === 'es';
    var L = isEs ? {
        student: 'Estudiante', grade: 'Grado', teacher: 'Maestro/a',
        project: 'Proyecto', group: 'Proyecto en grupo', members: 'Miembros del grupo',
        parent: 'Padre/Tutor', email: 'Correo', phone: 'Teléfono',
        board: 'Necesita tablero', power: 'Necesita electricidad',
        yes: 'Sí', no: 'No'
    } : {
        student: 'Student', grade: 'Grade', teacher: 'Teacher',
        project: 'Project', group: 'Group Project', members: 'Group Members',
        parent: 'Parent/Guardian', email: 'Email', phone: 'Phone',
        board: 'Needs Board', power: 'Needs Power',
        yes: 'Yes', no: 'No'
    };

    function row(label, value) {
        if (!value) return '';
        return '<dt>' + label + '</dt><dd>' + escapeHtml(value) + '</dd>';
    }

    var groupMembersHtml = '';
    if (d.isGroup === 'yes' && d.groupMembers) {
        try {
            var members = JSON.parse(d.groupMembers);
            if (members && members.length) {
                groupMembersHtml = members.map(function(m) {
                    return escapeHtml(m.studentName) + (m.grade ? ' (' + L.grade + ' ' + escapeHtml(m.grade) + ')' : '');
                }).join('<br>');
            }
        } catch (e) {}
    }

    dl.innerHTML =
        row(L.student, d.studentName) +
        row(L.grade, d.grade) +
        row(L.teacher, d.teacher) +
        row(L.project, d.projectTitle) +
        row(L.group, d.isGroup === 'yes' ? L.yes : L.no) +
        (groupMembersHtml ? '<dt>' + L.members + '</dt><dd>' + groupMembersHtml + '</dd>' : '') +
        row(L.parent, d.parentName) +
        row(L.email, d.parentEmail) +
        row(L.phone, d.parentPhone) +
        row(L.board, d.needBoard === 'yes' ? L.yes : L.no) +
        row(L.power, d.needPower === 'yes' ? L.yes : L.no);
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, function(c) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
}

function downloadCalendar(d) {
    // Generate .ics file with sign-up details in description
    var pad = function(n) { return n < 10 ? '0' + n : n; };
    // Event: November 19, 2026, 3:00 PM set-up through 7:30 PM teardown, Pacific
    // Use UTC timestamps for portability — PT is UTC-8 in November (standard time)
    var dtStart = '20261119T230000Z'; // Nov 19, 3:00 PM PT = Nov 19, 23:00 UTC
    var dtEnd = '20261120T033000Z';   // Nov 19, 7:30 PM PT = Nov 20, 03:30 UTC
    var now = new Date();
    var dtStamp = now.getUTCFullYear() +
                  pad(now.getUTCMonth()+1) + pad(now.getUTCDate()) + 'T' +
                  pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()) + 'Z';

    var groupMembersText = '';
    if (d.isGroup === 'yes' && d.groupMembers) {
        try {
            var members = JSON.parse(d.groupMembers);
            if (members && members.length) {
                groupMembersText = '\\nGroup Members:\\n' + members.map(function(m) {
                    return '- ' + m.studentName + (m.grade ? ' (Grade ' + m.grade + ')' : '');
                }).join('\\n');
            }
        } catch (e) {}
    }

    var description =
        'Capri Science Fair 2026-27 — "Science in Life!"\\n\\n' +
        'YOUR SIGN-UP:\\n' +
        'Student: ' + (d.studentName || '') + '\\n' +
        'Grade: ' + (d.grade || '') + '\\n' +
        'Teacher: ' + (d.teacher || '') + '\\n' +
        'Project: ' + (d.projectTitle || '') + '\\n' +
        'Group Project: ' + (d.isGroup === 'yes' ? 'Yes' : 'No') +
        groupMembersText + '\\n\\n' +
        'WHAT TO BRING:\\n' +
        '- Your completed science project\\n' +
        '- Tri-fold display board (limited supply in the front office)\\n\\n' +
        "WHAT'S NEXT:\\n" +
        '- Thu Oct 22: First Approval of your project idea\\n' +
        '- Thu Nov 12: Final Approval\\n' +
        '- Thu Nov 19, 5-7 PM: Science Fair in the MPR, with SD Lab Rats\\n\\n' +
        'SCHEDULE:\\n' +
        '3:00-5:00 PM — Project set-up in the MPR\\n' +
        '5:00-7:00 PM — Science Fair (SD Lab Rats demos out front)\\n' +
        '6:30-7:00 PM — SD Lab Rats show in the MPR\\n' +
        '7:00-7:30 PM — Teardown\\n\\n' +
        'Quick Start Guide: https://localhostusr.github.io/capri-science-fair-2026-27/guide.html\\n\\n' +
        'Questions? Kris Thomson, krisdthomson@gmail.com';

    var ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Capri Science Fair 2026-27//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:capri-science-fair-2026-27-' + (d.parentEmail || 'guest').replace(/[^a-z0-9]/gi, '') + '@capripta.org',
        'DTSTAMP:' + dtStamp,
        'DTSTART:' + dtStart,
        'DTEND:' + dtEnd,
        'SUMMARY:Capri Science Fair 2026-27',
        'DESCRIPTION:' + description,
        'LOCATION:Capri Elementary MPR\\, 941 Capri Rd\\, Encinitas\\, CA 92024',
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Capri Science Fair tomorrow!',
        'TRIGGER:-P1D',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'capri-science-fair-2026-27.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== Duplicate Check (by email) =====
// This is enforced server-side in the Apps Script.
// Client-side we store in sessionStorage to prevent accidental double-submits.
function checkLocalDuplicate(email) {
    const submitted = JSON.parse(sessionStorage.getItem('scienceFairSubmissions') || '[]');
    return submitted.includes(email.toLowerCase());
}

function markLocalSubmission(email) {
    const submitted = JSON.parse(sessionStorage.getItem('scienceFairSubmissions') || '[]');
    submitted.push(email.toLowerCase());
    sessionStorage.setItem('scienceFairSubmissions', JSON.stringify(submitted));
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', function() {
    updateDeadlineDisplay();
    updateCountdown();
    setInterval(updateCountdown, 60000); // Update every minute

    // Backend not wired yet: show "opening soon" instead of a form that can't save
    if (!CONFIG.BACKEND_LIVE) {
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('deadline-banner').style.display = 'none';
        document.getElementById('form-coming-soon').style.display = '';
    }

    // Hero floaters, mystery questions, catch-an-atom
    addHeroParticles();
    startQuestionTicker();
    setupAtomCatch();

    // Test-tube progress meter
    var signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('input', updateTubeMeter);
        var meterEl = document.getElementById('tube-meter');
        if (meterEl) meterEl.addEventListener('click', jumpToNextField);
        signupForm.addEventListener('change', updateTubeMeter);
        updateTubeMeter();
    }

    // Group project toggle
    document.querySelectorAll('.group-toggle').forEach(function(radio) {
        radio.addEventListener('change', toggleGroupFields);
    });

    // Safety materials toggle
    document.querySelectorAll('.safety-toggle').forEach(function(radio) {
        radio.addEventListener('change', toggleSafetyFields);
    });

    // Add group member button
    var addBtn = document.getElementById('add-member-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addGroupMember();
        });
    }

    // Lightning strike on consent checkbox
    var consentBox = document.getElementById('consent');
    if (consentBox) {
        consentBox.addEventListener('change', function() {
            if (!this.checked || REDUCED_MOTION) return;
            var bolt = document.getElementById('lightning-full');
            if (!bolt) return;

            var rect = consentBox.getBoundingClientRect();
            var targetX = rect.left + rect.width / 2;
            var targetY = rect.top + rect.height / 2;

            // Generate a procedural lightning bolt path
            var canvas = bolt.querySelector('.lightning-canvas');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.className = 'lightning-canvas';
                canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
                bolt.appendChild(canvas);
            }
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            var ctx = canvas.getContext('2d');

            // Generate bolt segments procedurally
            function generateBolt(x1, y1, x2, y2, depth) {
                var segments = [];
                var dx = x2 - x1;
                var dy = y2 - y1;
                var len = Math.sqrt(dx*dx + dy*dy);
                if (len < 10 || depth > 5) {
                    segments.push({x1:x1, y1:y1, x2:x2, y2:y2, depth:depth});
                    return segments;
                }
                // Midpoint with random offset perpendicular to the line
                var mx = (x1+x2)/2 + (Math.random()-0.5) * len * 0.25;
                var my = (y1+y2)/2 + (Math.random()-0.5) * len * 0.08;
                var left = generateBolt(x1, y1, mx, my, depth);
                var right = generateBolt(mx, my, x2, y2, depth);
                segments = segments.concat(left, right);
                // Random branch
                if (depth < 3 && Math.random() < 0.3) {
                    var bx = mx + (Math.random()-0.5) * len * 0.5;
                    var by = my + len * (0.15 + Math.random()*0.2);
                    var branch = generateBolt(mx, my, bx, by, depth+2);
                    segments = segments.concat(branch);
                }
                return segments;
            }

            // Start from top center-ish, slight random offset, land on checkbox
            var startX = targetX + (Math.random()-0.3) * 100;
            var segments = generateBolt(startX, 0, targetX, targetY, 0);

            // Draw the bolt with multiple passes for glow effect
            function drawBolt(opacity) {
                // Outer glow
                ctx.strokeStyle = 'rgba(200,200,100,' + (0.15 * opacity) + ')';
                ctx.lineWidth = 12;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                segments.forEach(function(s) {
                    if (s.depth < 3) { ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); }
                });
                ctx.stroke();
                // Mid glow — neon yellow
                ctx.strokeStyle = 'rgba(255,255,80,' + (0.5 * opacity) + ')';
                ctx.lineWidth = 5;
                ctx.beginPath();
                segments.forEach(function(s) {
                    ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2);
                });
                ctx.stroke();
                // Hot core — bright white-yellow
                ctx.strokeStyle = 'rgba(255,255,220,' + (0.9 * opacity) + ')';
                ctx.lineWidth = 2;
                ctx.beginPath();
                segments.forEach(function(s) {
                    if (s.depth < 4) { ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); }
                });
                ctx.stroke();
            }

            // Animate the strike with flicker
            var frame = 0;
            var totalFrames = 30;
            function animateBolt() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (frame < totalFrames) {
                    var progress = frame / totalFrames;
                    var opacity;
                    if (progress < 0.1) opacity = 1;
                    else if (progress < 0.15) opacity = 0.2;
                    else if (progress < 0.25) opacity = 0.9;
                    else if (progress < 0.3) opacity = 0.15;
                    else if (progress < 0.4) opacity = 0.7;
                    else opacity = Math.max(0, 1 - (progress - 0.4) / 0.6);

                    // Dark background flash
                    if (progress < 0.2) {
                        ctx.fillStyle = 'rgba(0,0,0,' + (0.3 * (1-progress*5)) + ')';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }

                    drawBolt(opacity);

                    // Impact glow at checkbox
                    if (progress < 0.5) {
                        var glowSize = 40 + progress * 80;
                        var glowOpacity = 0.8 * (1 - progress * 2);
                        var grad = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, glowSize);
                        grad.addColorStop(0, 'rgba(255,255,180,' + glowOpacity + ')');
                        grad.addColorStop(0.3, 'rgba(255,255,80,' + (glowOpacity*0.5) + ')');
                        grad.addColorStop(1, 'rgba(255,255,80,0)');
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(targetX, targetY, glowSize, 0, Math.PI*2);
                        ctx.fill();
                    }

                    frame++;
                    requestAnimationFrame(animateBolt);
                }
            }

            // Smoke canvas — appended to body, not inside lightning-full (which fades out)
            var smokeCanvas = document.querySelector('.smoke-canvas');
            if (!smokeCanvas) {
                smokeCanvas = document.createElement('canvas');
                smokeCanvas.className = 'smoke-canvas';
                smokeCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10000;';
                document.body.appendChild(smokeCanvas);
            }
            smokeCanvas.width = window.innerWidth;
            smokeCanvas.height = window.innerHeight;
            var sctx = smokeCanvas.getContext('2d');

            // Smoke particles — large, dramatic, billowing
            var smokeParticles = [];
            for (var si = 0; si < 25; si++) {
                smokeParticles.push({
                    x: targetX + (Math.random() - 0.5) * 20,
                    y: targetY,
                    vx: (Math.random() - 0.5) * 1.0,
                    vy: -(0.5 + Math.random() * 1.0),
                    size: 10 + Math.random() * 20,
                    growRate: 0.5 + Math.random() * 0.6,
                    maxOpacity: 0.35 + Math.random() * 0.2,
                    age: 0,
                    life: 120 + Math.random() * 80
                });
            }

            function animateSmoke() {
                sctx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
                var allDone = true;
                smokeParticles.forEach(function(p) {
                    p.age++;
                    if (p.age > p.life) return;
                    allDone = false;
                    var progress = p.age / p.life;

                    var opacity;
                    if (progress < 0.1) {
                        opacity = p.maxOpacity * (progress / 0.1);
                    } else if (progress < 0.3) {
                        opacity = p.maxOpacity;
                    } else {
                        opacity = p.maxOpacity * (1 - (progress - 0.3) / 0.7);
                    }

                    // Gentle drift and wobble
                    p.x += p.vx + Math.sin(p.age * 0.05) * 0.3;
                    p.y += p.vy;
                    p.vy *= 0.998;
                    p.vx *= 0.999;
                    p.size += p.growRate;
                    p.growRate *= 0.995;

                    sctx.save();
                    sctx.globalAlpha = opacity;
                    // Multiple overlapping circles for soft billowy look
                    for (var layer = 0; layer < 3; layer++) {
                        var lx = p.x + (Math.random() - 0.5) * p.size * 0.3;
                        var ly = p.y + (Math.random() - 0.5) * p.size * 0.2;
                        var ls = p.size * (0.6 + layer * 0.25);
                        var grad = sctx.createRadialGradient(lx, ly, 0, lx, ly, ls);
                        grad.addColorStop(0, 'rgba(70,70,70,0.3)');
                        grad.addColorStop(0.3, 'rgba(90,90,90,0.15)');
                        grad.addColorStop(0.6, 'rgba(110,110,110,0.06)');
                        grad.addColorStop(1, 'rgba(130,130,130,0)');
                        sctx.fillStyle = grad;
                        sctx.beginPath();
                        sctx.arc(lx, ly, ls, 0, Math.PI * 2);
                        sctx.fill();
                    }
                    sctx.restore();
                });
                if (!allDone) {
                    requestAnimationFrame(animateSmoke);
                } else {
                    sctx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
                }
            }

            bolt.classList.remove('struck');
            void bolt.offsetWidth;
            bolt.classList.add('struck');
            animateBolt();
            // Start smoke after the initial bolt flash
            setTimeout(function() { animateSmoke(); }, 500);
            setTimeout(function() {
                bolt.classList.remove('struck');
                if (canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }, 5000);
        });
    }

    // Auto-detect language from browser
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('es')) {
        setLang('es');
    }
});
