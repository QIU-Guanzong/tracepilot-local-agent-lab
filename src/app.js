import { createProvider, ProviderKind, validateRequest } from './provider.js';

const scenarios = {
  schema: {
    summary: 'Order event rejected after a field rename',
    boundary: 'checkout event consumer',
    evidence: 'The staging fixture accepts customer_id. The latest producer sample emits buyer_id and the consumer returns a validation error.'
  },
  permissions: {
    summary: 'Support role cannot view the requested case',
    boundary: 'case detail authorization path',
    evidence: 'A support-role fixture receives a 403 after the policy rollout. The documented support path should allow read-only case access.'
  },
  latency: {
    summary: 'Release candidate exceeds the p95 budget',
    boundary: 'search response benchmark',
    evidence: 'The fixed benchmark reports p95 920ms against an agreed 600ms budget after the latest ranking change.'
  }
};

const form = document.querySelector('#incident-form');
const summary = document.querySelector('#summary');
const boundary = document.querySelector('#boundary');
const evidence = document.querySelector('#evidence');
const resultHeading = document.querySelector('#result-heading');
const resultBody = document.querySelector('#result-body');
const runState = document.querySelector('#run-state');
const copyButton = document.querySelector('#copy-button');
const planButton = document.querySelector('#plan-button');
const formNote = document.querySelector('#form-note');
const provider = createProvider(ProviderKind.LOCAL_MOCK);
let lastResult = null;

function setFormValues(next) {
  summary.value = next.summary;
  boundary.value = next.boundary;
  evidence.value = next.evidence;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderPlan(plan) {
  document.querySelectorAll('.path-list li').forEach((item) => item.classList.add('complete'));
  resultHeading.textContent = 'Review plan ready';
  resultBody.className = 'result-body';
  resultBody.innerHTML = `
    <div class="result-meta"><span>${escapeHtml(plan.provider)}</span><span>${escapeHtml(plan.traceId)}</span><span>write intent: false</span></div>
    <div class="result-grid">
      <section><h4>Working finding</h4><p>${escapeHtml(plan.finding)}</p></section>
      <section><h4>Visible citations</h4><ul>${plan.citations.map((citation) => `<li>${escapeHtml(citation)}</li>`).join('')}</ul></section>
      <section><h4>Proposed checks</h4><ol>${plan.proposedChecks.map((check) => `<li>${escapeHtml(check)}</li>`).join('')}</ol></section>
      <section class="decision"><h4>Human gate</h4><p>${escapeHtml(plan.humanDecision)}</p><span>Nothing has been changed or sent.</span></section>
    </div>`;
  runState.textContent = 'Review-ready';
  runState.classList.add('ready');
  copyButton.disabled = false;
}

function resetPath() {
  document.querySelectorAll('.path-list li').forEach((item) => item.classList.remove('complete'));
}

function readablePlan(plan) {
  return [
    `TracePilot local review plan (${plan.traceId})`,
    `Finding: ${plan.finding}`,
    `Citations: ${plan.citations.join('; ')}`,
    `Checks: ${plan.proposedChecks.join(' ')}`,
    `Human gate: ${plan.humanDecision}`,
    'Local deterministic mock. No cloud calls, writes, or execution.'
  ].join('\n');
}

document.querySelectorAll('.scenario').forEach((button) => {
  button.addEventListener('click', () => {
    const scenario = button.dataset.scenario;
    setFormValues(scenarios[scenario]);
    document.querySelectorAll('.scenario').forEach((item) => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    resetPath();
    runState.textContent = 'Ready';
    runState.classList.remove('ready');
    formNote.textContent = 'Safe sample loaded. Runs stay in this browser.';
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const request = { summary: summary.value.trim(), boundary: boundary.value.trim(), evidence: evidence.value.trim() };
  const validation = validateRequest(request);
  if (!validation.valid) {
    formNote.textContent = validation.message;
    formNote.classList.add('error');
    return;
  }
  formNote.classList.remove('error');
  planButton.disabled = true;
  planButton.textContent = 'Building locally…';
  runState.textContent = 'Planning';
  resetPath();
  try {
    lastResult = await provider.createPlan(request);
    renderPlan(lastResult);
    formNote.textContent = 'Local review package built. No network or write action occurred.';
  } catch (error) {
    formNote.textContent = error.message;
    formNote.classList.add('error');
    runState.textContent = 'Needs input';
  } finally {
    planButton.disabled = false;
    planButton.innerHTML = '<span aria-hidden="true">↗</span> Build review plan';
  }
});

copyButton.addEventListener('click', async () => {
  if (!lastResult) return;
  try {
    await navigator.clipboard.writeText(readablePlan(lastResult));
    copyButton.textContent = 'Copied';
    window.setTimeout(() => { copyButton.textContent = 'Copy summary'; }, 1200);
  } catch {
    copyButton.textContent = 'Copy unavailable';
  }
});

setFormValues(scenarios.schema);
