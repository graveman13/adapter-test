// Injected once; replaces the original's twin.macro/emotion styling with
// plain CSS and per-theme classes (uwk-light / uwk-dark / uwk-jupiter).
let injected = false

export function injectStyles(): void {
  if (injected || typeof document === 'undefined') return
  injected = true
  const style = document.createElement('style')
  style.setAttribute('data-unified-wallet-kit', '')
  style.textContent = CSS_TEXT
  document.head.appendChild(style)
}

const CSS_TEXT = `
.uwk { font-family: 'Segoe UI', system-ui, sans-serif; box-sizing: border-box; }
.uwk *, .uwk *::before, .uwk *::after { box-sizing: border-box; }

/* ---------- button ---------- */
.uwk-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px; border-radius: 8px; border: none;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  transition: opacity .15s ease;
}
.uwk-btn:hover { opacity: .85; }
.uwk-light .uwk-btn, .uwk-btn.uwk-light { background: #2a2e3d; color: #fff; }
.uwk-dark .uwk-btn, .uwk-btn.uwk-dark { background: #31333b; color: #fff; }
.uwk-jupiter .uwk-btn, .uwk-btn.uwk-jupiter {
  background: linear-gradient(96deg, #00bef0, #c7f284); color: #1a1d1f;
}

/* ---------- current user badge ---------- */
.uwk-badge {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 8px 14px; border-radius: 999px; border: none; cursor: pointer;
  font-size: 0.8rem; font-weight: 600;
}
.uwk-badge img { border-radius: 50%; }
.uwk-light .uwk-badge, .uwk-badge.uwk-light { background: #f1f3f5; color: #1a1d1f; }
.uwk-dark .uwk-badge, .uwk-badge.uwk-dark { background: #31333b; color: #fff; }
.uwk-jupiter .uwk-badge, .uwk-badge.uwk-jupiter { background: rgba(199, 242, 132, .15); color: #c7f284; }

/* ---------- modal ---------- */
.uwk-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, .55); backdrop-filter: blur(2px);
}
.uwk-modal {
  width: 100%; max-width: 420px; max-height: 90vh; overflow-y: auto;
  border-radius: 16px; padding: 0; position: relative;
  animation: uwk-pop .15s ease;
}
@keyframes uwk-pop { from { transform: scale(.97); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.uwk-modal.uwk-light { background: #ffffff; color: #1a1d1f; }
.uwk-modal.uwk-dark { background: #1b1b1e; color: #e6e6e6; }
.uwk-modal.uwk-jupiter { background: #1c2936; color: #e6e6e6; }

.uwk-modal-header { padding: 20px 20px 12px; position: relative; }
.uwk-modal-header h2 { margin: 0; font-size: 1.05rem; font-weight: 700; }
.uwk-modal-header p { margin: 6px 0 0; font-size: .8rem; opacity: .6; }
.uwk-close {
  position: absolute; top: 14px; right: 14px;
  border: none; background: transparent; color: inherit;
  font-size: 1.1rem; cursor: pointer; opacity: .6; line-height: 1;
}
.uwk-close:hover { opacity: 1; }

.uwk-modal-body { padding: 8px 20px 20px; }
.uwk-section-title { font-size: .7rem; text-transform: uppercase; letter-spacing: .04em; opacity: .5; margin: 14px 0 6px; }

.uwk-wallet-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.uwk-wallet-item {
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 10px 12px; border-radius: 10px; border: 1px solid transparent;
  background: transparent; color: inherit; cursor: pointer; text-align: left;
  font-size: .9rem; font-weight: 500;
}
.uwk-modal.uwk-light .uwk-wallet-item { border-color: #eceff1; }
.uwk-modal.uwk-light .uwk-wallet-item:hover { background: #f5f7f9; }
.uwk-modal.uwk-dark .uwk-wallet-item { border-color: #2a2a2e; }
.uwk-modal.uwk-dark .uwk-wallet-item:hover { background: #26262a; }
.uwk-modal.uwk-jupiter .uwk-wallet-item { border-color: #2b3d4f; }
.uwk-modal.uwk-jupiter .uwk-wallet-item:hover { background: #24364a; }
.uwk-wallet-item img { width: 28px; height: 28px; border-radius: 6px; object-fit: contain; }
.uwk-wallet-item .uwk-detected { margin-left: auto; font-size: .7rem; opacity: .55; }
.uwk-wallet-item .uwk-attachment { margin-left: 6px; }

.uwk-collapse-toggle, .uwk-link-button {
  display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%;
  margin-top: 10px; padding: 8px; border: none; background: transparent;
  color: inherit; opacity: .65; font-size: .8rem; cursor: pointer;
}
.uwk-collapse-toggle:hover, .uwk-link-button:hover { opacity: 1; }
.uwk-footer-links { margin-top: 14px; display: flex; flex-direction: column; gap: 4px; }
.uwk-footer-links a { color: inherit; opacity: .6; font-size: .78rem; text-decoration: underline; }
.uwk-footer-links a:hover { opacity: 1; }

/* ---------- onboarding / not installed screens ---------- */
.uwk-screen { padding: 20px; text-align: center; }
.uwk-screen img.uwk-big-icon { width: 56px; height: 56px; border-radius: 12px; margin-bottom: 10px; }
.uwk-screen h3 { margin: 4px 0 8px; font-size: 1rem; }
.uwk-screen p { font-size: .8rem; opacity: .65; margin: 4px 0; }
.uwk-screen .uwk-hint { text-align: left; margin: 14px 0; }
.uwk-screen .uwk-hint strong { display: block; font-size: .8rem; margin-bottom: 2px; }
.uwk-primary-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 11px; margin-top: 8px;
  border-radius: 10px; border: none; cursor: pointer; font-weight: 600; font-size: .85rem;
  background: #00bef0; color: #10181f;
}
.uwk-secondary-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 100%; padding: 10px; margin-top: 8px;
  border-radius: 10px; border: 1px solid currentColor; background: transparent;
  color: inherit; opacity: .7; cursor: pointer; font-size: .82rem;
}
.uwk-secondary-btn:hover { opacity: 1; }
`
