export const buildDemoCss = (): string => `
:root {
  color-scheme: light;
  --bg: #f7f8fa;
  --panel: #ffffff;
  --text: #0f172a;
  --muted: #52606d;
  --border: #e5e7eb;
  --accent: #2563eb;
  --radius: 12px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--accent);
}

button {
  font: inherit;
}

.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 20px 48px;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.hero h1 {
  margin: 0;
  font-size: 28px;
}

.hero .sub {
  margin: 6px 0 0;
  color: var(--muted);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  background: #e0ecff;
  color: #1d4ed8;
  border-radius: 18px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 16px 0;
}

.tab {
  border: 1px solid var(--border);
  background: #f3f4f6;
  color: var(--muted);
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 700;
}

.tab.is-active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  box-shadow: 0 12px 30px rgba(37, 99, 235, 0.25);
}

.panel {
  display: none;
  border: 1px solid var(--border);
  background: var(--panel);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.06);
}

.panel.is-active {
  display: block;
}

.panel h2 {
  margin: 4px 0 10px;
  font-size: 20px;
}

.panel p {
  margin: 0 0 10px;
  color: var(--muted);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.icon-card {
  background: linear-gradient(180deg, #ffffff, #f8fafc);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  text-align: center;
  transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
}

.icon-card:hover {
  transform: translateY(-3px);
  border-color: var(--accent);
  box-shadow: 0 12px 34px rgba(37, 99, 235, 0.15);
}

.icon-card .preview {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #eef2ff;
  color: #111827;
  font-size: 24px;
  transition: background 0.2s ease;
}

.icon-card:hover .preview {
  background: #dbeafe;
}

.icon-card .preview svg {
  width: 28px;
  height: 28px;
}

.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.1em;
}

.symbol-icon {
  width: 1em;
  height: 1em;
}

.icon-card .name {
  font-weight: 700;
  font-size: 14px;
}

.icon-card .code {
  font-family: "SFMono-Regular", Consolas, ui-monospace, monospace;
  font-size: 12px;
  color: var(--muted);
  text-align: center;
}

.code-block {
  margin: 12px 0;
  background: #0b1220;
  color: #e5e7eb;
  padding: 12px 14px;
  border-radius: 10px;
  font-family: "SFMono-Regular", Consolas, ui-monospace, monospace;
  font-size: 13px;
  overflow-x: auto;
}

.code-block code {
  white-space: pre;
  display: block;
}

.callout {
  padding: 10px 12px;
  background: #f1f5f9;
  border: 1px solid var(--border);
  border-radius: 10px;
  margin: 10px 0;
  color: var(--muted);
}

.usage-steps {
  display: grid;
  gap: 8px;
  margin: 12px 0 8px;
  padding: 0;
  list-style: none;
}

.usage-steps li {
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.usage-steps li:last-child {
  border-bottom: 0;
}

.flex {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.small {
  font-size: 12px;
  color: var(--muted);
}
`;
