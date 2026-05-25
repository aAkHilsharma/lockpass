import { defineContentScript } from 'wxt/utils/define-content-script';
import { sendBg, type MatchSummary } from '../src/messages';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_idle',
  main() {
    let matchesPromise: Promise<MatchSummary[]> | null = null;
    let host: HTMLDivElement | null = null;
    let root: ShadowRoot | null = null;
    let activeField: HTMLInputElement | null = null;

    const isTextual = (t: string) => t === 'text' || t === 'email' || t === 'tel' || t === '';

    function scope(el: HTMLInputElement): HTMLElement | Document {
      return el.form ?? el.closest('form') ?? document;
    }

    // Recognise a username/email field by its own attributes, so email-first /
    // multi-step logins (no password field on the page yet) still trigger.
    function looksLikeUsername(el: HTMLInputElement): boolean {
      if (el.type === 'email') return true;
      const ac = (el.autocomplete || '').toLowerCase();
      if (ac === 'username' || ac === 'email') return true;
      const hay = `${el.name} ${el.id} ${el.getAttribute('aria-label') ?? ''} ${el.placeholder}`.toLowerCase();
      return /email|e-mail|user(name)?|login|account|phone/.test(hay);
    }

    function isCredentialField(el: EventTarget | null): el is HTMLInputElement {
      if (!(el instanceof HTMLInputElement)) return false;
      if (el.type === 'password') return true;
      if (!isTextual(el.type)) return false;
      return !!scope(el).querySelector('input[type=password]') || looksLikeUsername(el);
    }

    function findPair(el: HTMLInputElement) {
      const s = scope(el);
      const pw = s.querySelector<HTMLInputElement>('input[type=password]');
      const user = Array.from(s.querySelectorAll<HTMLInputElement>('input'))
        .find((i) => i !== pw && isTextual(i.type)) ?? null;
      return { user, pw };
    }

    // React-controlled inputs ignore plain `.value =`, so go through the native
    // setter and fire input/change so the page's framework registers it.
    function setNativeValue(input: HTMLInputElement, value: string) {
      const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
      if (desc?.set) desc.set.call(input, value);
      else input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function esc(s: string) {
      return s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] ?? ch));
    }

    function hide() {
      if (host) host.style.display = 'none';
    }

    function reposition() {
      if (!host || !activeField || host.style.display === 'none') return;
      const r = activeField.getBoundingClientRect();
      host.style.top = `${window.scrollY + r.bottom + 4}px`;
      host.style.left = `${window.scrollX + r.left}px`;
      host.style.minWidth = `${Math.max(r.width, 220)}px`;
    }

    function ensureHost() {
      if (host) return;
      host = document.createElement('div');
      host.style.cssText = 'position:absolute;z-index:2147483647;display:none;';
      root = host.attachShadow({ mode: 'open' });
      document.body.appendChild(host);
      document.addEventListener('mousedown', (e) => {
        if (host && host.style.display !== 'none' && !e.composedPath().includes(host) && e.target !== activeField) hide();
      });
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);
    }

    function render(items: MatchSummary[]) {
      if (!root) return;
      root.innerHTML = `
        <style>
          .lp { font-family: system-ui, sans-serif; background:#221d3a; border:1px solid #3a3552;
                border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,.45); }
          .lp-h { font-size:11px; color:#8d86ab; padding:8px 12px; border-bottom:1px solid #3a3552; }
          .lp-row { display:flex; align-items:center; gap:10px; padding:10px 12px; cursor:pointer; }
          .lp-row:hover { background:#2c2748; }
          .lp-t { color:#fff; font-size:13px; font-weight:600; }
          .lp-u { color:#8d86ab; font-size:12px; }
          .lp-ic { width:22px; height:22px; border-radius:6px; background:#b9acff; color:#1a1730;
                   display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; }
        </style>
        <div class="lp">
          <div class="lp-h">Log in as…</div>
          ${items.map((it) => `
            <div class="lp-row" data-id="${esc(it.id)}">
              <div class="lp-ic">${esc((it.title[0] ?? '?').toUpperCase())}</div>
              <div><div class="lp-t">${esc(it.title)}</div><div class="lp-u">${esc(it.username ?? '')}</div></div>
            </div>`).join('')}
        </div>`;
      root.querySelectorAll<HTMLElement>('.lp-row').forEach((row) => {
        row.addEventListener('mousedown', (e) => e.preventDefault()); // keep field focused
        row.addEventListener('click', () => choose(row.dataset.id ?? ''));
      });
    }

    async function choose(id: string) {
      const field = activeField;
      hide();
      if (!id || !field) return;
      const res = await sendBg({ type: 'fillCredential', id });
      if (!res.ok || !res.credential) return;
      const { user, pw } = findPair(field);
      if (user && res.credential.username) setNativeValue(user, res.credential.username);
      if (pw && res.credential.password) setNativeValue(pw, res.credential.password);
    }

    // Fetch once per page, deduped. Kicked off on load (see below) so the
    // SW cold-start + unlock + vault load overlap with the user reading the
    // page, instead of blocking the first focus.
    function loadMatches(): Promise<MatchSummary[]> {
      if (!matchesPromise) {
        matchesPromise = sendBg({ type: 'getMatches', url: location.href })
          .then((res) => (res.ok && res.matches ? res.matches : []))
          .catch(() => []);
      }
      return matchesPromise;
    }

    async function onFocus(field: HTMLInputElement) {
      const items = await loadMatches();
      if (!items.length || document.activeElement !== field) return;
      ensureHost();
      activeField = field;
      render(items);
      host!.style.display = 'block';
      reposition();
    }

    document.addEventListener('focusin', (e) => {
      if (isCredentialField(e.target)) void onFocus(e.target);
      else hide();
    });

    function hasLoginField(): boolean {
      if (document.querySelector('input[type=password], input[type=email]')) return true;
      return Array.from(document.querySelectorAll<HTMLInputElement>('input'))
        .some((i) => isTextual(i.type) && looksLikeUsername(i));
    }

    // On load: preload matches if this looks like a login page, and surface the
    // dropdown if a credential field is already focused (autofocus on load).
    if (hasLoginField()) {
      void loadMatches();
      const active = document.activeElement;
      if (isCredentialField(active)) void onFocus(active);
    }
  },
});
