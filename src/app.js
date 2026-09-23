import { createProvider, ProviderKind, validateRequest } from './provider.js';
import { runtimeConfig } from './runtime-config.js';

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
const providerMode = document.querySelector('#provider-mode');
const providerNote = document.querySelector('#provider-note');
const remoteConsentRow = document.querySelector('#remote-consent-row');
const remoteConsent = document.querySelector('#remote-consent');
const providerChip = document.querySelector('#provider-chip');
const providerLabel = document.querySelector('#provider-label');
const runtimeIndicator = document.querySelector('#runtime-indicator');
const networkIndicator = document.querySelector('#network-indicator');
let lastResult = null;

providerMode.querySelector('option[value="nebius-token-factory"]').disabled = !runtimeConfig.remoteProviderEnabled;

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
  const generatedAt = plan.generatedAt && Number.isFinite(Date.parse(plan.generatedAt))
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(plan.generatedAt))
    : null;
  const findingNote = plan.networkIntent
    ? '<p class="result-disclaimer">Model-generated hypothesis; check it against the supplied evidence.</p>'
    : '';
  document.querySelectorAll('.path-list li').forEach((item) => item.classList.add('complete'));
  resultHeading.textContent = 'Review plan ready';
  resultBody.className = 'result-body';
  resultBody.innerHTML = `
    <div class="result-meta"><span>${escapeHtml(plan.provider)}</span>${plan.model ? `<span>model: ${escapeHtml(plan.model)}</span>` : ''}${generatedAt ? `<span>time: ${escapeHtml(generatedAt)}</span>` : ''}<span>${escapeHtml(plan.traceId)}</span><span>network intent: ${plan.networkIntent}</span><span>write intent: ${plan.writeIntent}</span>${plan.tokenUsage ? `<span>tokens: ${plan.tokenUsage.total}</span>` : ''}</div>
    <div class="result-grid">
      <section><h4>Working hypothesis</h4><p>${escapeHtml(plan.finding)}</p>${findingNote}</section>
      <section><h4>Visible citations</h4><ul>${plan.citations.map((citation) => `<li>${escapeHtml(citation)}</li>`).join('')}</ul></section>
      <section><h4>Proposed checks</h4><ol>${plan.proposedChecks.map((check) => `<li>${escapeHtml(check)}</li>`).join('')}</ol></section>
      <section class="decision"><h4>Human gate</h4><p>${escapeHtml(plan.humanDecision)}</p><span>${plan.networkIntent ? 'The model request was sent; no changes or other actions were made.' : 'No network request, changes, or other actions were made.'}</span></section>
    </div>`;
  runState.textContent = 'Review-ready';
  runState.classList.add('ready');
  copyButton.disabled = false;
}

function resetPath() {
  document.querySelectorAll('.path-list li').forEach((item) => item.classList.remove('complete'));
}

function clearPlan() {
  resetPath();
  runState.textContent = 'Ready';
  runState.classList.remove('ready');
  lastResult = null;
  copyButton.disabled = true;
  resultHeading.textContent = 'No plan has run yet';
  resultBody.className = 'result-body empty-state';
  resultBody.innerHTML = '<p>Load a safe sample or add sanitized evidence, then build a review plan.</p>';
}

function invalidatePlanForChangedInput() {
  if (!lastResult) return;
  clearPlan();
  formNote.classList.remove('error');
  formNote.textContent = 'Inputs changed. Build a new review plan for the current fields.';
  networkIndicator.textContent = 'No request for current inputs';
}

function setPlanBusy(busy) {
  [summary, boundary, evidence, providerMode].forEach((control) => { control.disabled = busy; });
  remoteConsent.disabled = busy || providerMode.value !== ProviderKind.NEBIUS_TOKEN_FACTORY;
  document.querySelectorAll('.scenario').forEach((button) => { button.disabled = busy; });
  planButton.disabled = busy;
}

function readablePlan(plan) {
  const providerLine = plan.networkIntent
    ? `Provider: ${plan.provider} / ${plan.model}. A model request was sent; no write or execution occurred.`
    : 'Provider: local deterministic mock. No remote model request, write, or execution occurred.';
  return [
    `TracePilot review plan (${plan.traceId})`,
    providerLine,
    `Finding: ${plan.finding}`,
    `Citations: ${plan.citations.join('; ')}`,
    `Checks: ${plan.proposedChecks.join(' ')}`,
    `Human gate: ${plan.humanDecision}`
  ].join('\n');
}

function updateProviderMode() {
  const remoteSelected = providerMode.value === ProviderKind.NEBIUS_TOKEN_FACTORY;
  remoteConsentRow.hidden = !remoteSelected;
  remoteConsent.disabled = !remoteSelected;
  remoteConsent.required = remoteSelected;
  providerNote.textContent = remoteSelected
    ? `Sends these three fields to Nebius Token Factory through this local server using ${runtimeConfig.model}. The app does not save the request. Provider terms and usage charges may apply.`
    : runtimeConfig.remoteProviderEnabled
      ? 'Offline by default. The optional Nebius path is available only after selecting it and confirming the data boundary.'
      : 'Offline deterministic sample. Nebius mode is available only from the local Node server after a server-side API key is configured.';
  providerChip.textContent = remoteSelected ? 'OPT-IN' : 'ACTIVE';
  providerLabel.textContent = remoteSelected ? 'NEBIUS TOKEN FACTORY' : 'LOCAL-MOCK/0.1';
  runtimeIndicator.textContent = runtimeConfig.remoteProviderEnabled
    ? `Offline default · ${runtimeConfig.model} available by opt-in`
    : 'Offline default · remote provider not configured';
  clearPlan();
  formNote.classList.remove('error');
  formNote.textContent = remoteSelected
    ? 'Review the data notice and confirm before sending anything to the model.'
    : 'Runs stay in this browser. The result is deterministic mock output.';
  networkIndicator.textContent = 'No remote request sent';
}

[summary, boundary, evidence].forEach((field) => field.addEventListener('input', invalidatePlanForChangedInput));

document.querySelectorAll('.scenario').forEach((button) => {
  button.addEventListener('click', () => {
    const scenario = button.dataset.scenario;
    setFormValues(scenarios[scenario]);
    document.querySelectorAll('.scenario').forEach((item) => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    clearPlan();
    formNote.textContent = 'Safe sample loaded. Runs stay in this browser.';
    networkIndicator.textContent = 'No request for this sample';
  });
});

providerMode.addEventListener('change', updateProviderMode);
updateProviderMode();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const request = { summary: summary.value.trim(), boundary: boundary.value.trim(), evidence: evidence.value.trim() };
  const remoteSelected = providerMode.value === ProviderKind.NEBIUS_TOKEN_FACTORY;
  const validation = validateRequest(request);
  if (!validation.valid) {
    formNote.textContent = validation.message;
    formNote.classList.add('error');
    return;
  }
  if (remoteSelected && !remoteConsent.checked) {
    formNote.textContent = 'Confirm the data boundary before sending a remote request.';
    formNote.classList.add('error');
    remoteConsent.focus();
    return;
  }
  formNote.classList.remove('error');
  setPlanBusy(true);
  planButton.textContent = 'Building review plan…';
  runState.textContent = 'Planning';
  networkIndicator.textContent = remoteSelected ? 'Sending one model request…' : 'Local mock · no remote request';
  resetPath();
  try {
    const provider = remoteSelected
      ? createProvider(ProviderKind.NEBIUS_TOKEN_FACTORY, { enabled: runtimeConfig.remoteProviderEnabled })
      : createProvider(ProviderKind.LOCAL_MOCK);
    lastResult = await provider.createPlan(request);
    renderPlan(lastResult);
    formNote.textContent = lastResult.networkIntent
      ? `Model review plan returned. No write or execution occurred.${Number.isInteger(lastResult.requestsRemaining) ? ` ${lastResult.requestsRemaining} local request${lastResult.requestsRemaining === 1 ? '' : 's'} remaining.` : ''}`
      : 'Local review package built. No network or write action occurred.';
    networkIndicator.textContent = lastResult.networkIntent ? 'Nebius request completed · no write' : 'Local mock · no remote request';
  } catch (error) {
    formNote.textContent = error.message;
    formNote.classList.add('error');
    runState.textContent = 'Needs input';
    networkIndicator.textContent = remoteSelected ? 'Remote request failed' : 'Local mock · no remote request';
  } finally {
    if (remoteSelected) remoteConsent.checked = false;
    setPlanBusy(false);
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
