import { useState, useEffect } from 'react';
import { supabase, isDemoMode, demoSession } from '../lib/supabase';
import { Button } from './ui/button';
import { Card } from './ui/card';

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', model: 'Claude Sonnet 4', placeholder: 'sk-ant-...', help: 'console.anthropic.com → API Keys' },
  { id: 'openai', name: 'OpenAI', model: 'GPT-4o / o1', placeholder: 'sk-proj-...', help: 'platform.openai.com → API Keys' },
  { id: 'gemini', name: 'Google Gemini', model: 'Gemini Flash', placeholder: 'AIza...', help: 'aistudio.google.com/app/apikey' },
  { id: 'deepseek', name: 'DeepSeek', model: 'DeepSeek Chat', placeholder: 'sk-...', help: 'platform.deepseek.com → API Keys' },
  { id: 'grok', name: 'xAI Grok', model: 'Grok 2', placeholder: 'xai-...', help: 'console.x.ai → API Keys' },
];

export default function ApiKeysTab() {
  const [keys, setKeys] = useState({});
  const [inputs, setInputs] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(null);
  const [msg, setMsg] = useState('');

  async function getToken() {
    if (isDemoMode) return demoSession.access_token;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  async function load() {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/keys`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const map = {};
      data.keys?.forEach((k) => (map[k.provider] = k.masked));
      setKeys(map);
    } catch {}
  }

  useEffect(() => { load(); }, []);

  function validate(provider, value) {
    if (!value.trim()) return 'Key is required';
    if (value.trim().length < 8) return 'Key looks too short';
    return '';
  }

  async function save(provider) {
    const val = inputs[provider] || '';
    const err = validate(provider, val);
    if (err) { setErrors((p) => ({ ...p, [provider]: err })); return; }
    setErrors((p) => ({ ...p, [provider]: '' }));
    setSaving(provider);
    setMsg('');
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ provider, api_key: val.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setInputs((prev) => ({ ...prev, [provider]: '' }));
      setMsg(`Saved ${provider}${data.demo ? ' (demo)' : ''}`);
      load();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(null);
      setTimeout(() => setMsg(''), 3000);
    }
  }

  async function remove(provider) {
    if (!confirm(`Remove ${provider} key? This cannot be undone.`)) return;
    setSaving(provider);
    try {
      const token = await getToken();
      await fetch(`${import.meta.env.VITE_PROXY_URL}/api/keys/${provider}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      load();
      setMsg(`Removed ${provider}`);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(null);
      setTimeout(() => setMsg(''), 2000);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      <Card className="p-4">
        <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Bring your own key</div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          <span className="font-medium text-foreground">Pro $9/mo</span> includes keys. Or add your own — pay provider directly, switch anytime. Keys never shared.
        </p>
        <div className="mt-3 flex gap-2">
          <span className="border border-border bg-muted px-2 py-1 text-xs">Pro: managed</span>
          <span className="border border-border bg-background px-2 py-1 text-xs">BYOK: your quota</span>
        </div>
      </Card>

      {isDemoMode && (
        <Card className="border-warning bg-warning/10 p-3">
          <p className="text-xs leading-5 text-warning">Demo mode: keys stored in memory. Try <span className="font-mono font-medium">sk-ant-demo1234</span>.</p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {PROVIDERS.map((p) => {
          const masked = keys[p.id];
          const hasKey = !!masked;
          return (
            <Card key={p.id} className="p-3">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{p.name}</span>
                      <span className="border border-border bg-muted px-1.5 py-0.5 text-xs">{p.model}</span>
                      {hasKey && <span className="border border-success bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success">Saved</span>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.help}</p>
                    {hasKey && <p className="mt-1 font-mono text-xs text-success">{masked}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={`key-${p.id}`} className="text-xs font-medium">
                    {p.name} API key
                  </label>
                  <div className="flex gap-2">
                    <input
                      id={`key-${p.id}`}
                      type="password"
                      placeholder={hasKey ? '•••••••• Update' : p.placeholder}
                      value={inputs[p.id] || ''}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      onBlur={() => {
                        const err = inputs[p.id] ? validate(p.id, inputs[p.id]) : '';
                        setErrors((prev) => ({ ...prev, [p.id]: err }));
                      }}
                      className="flex h-9 w-full border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      aria-invalid={!!errors[p.id]}
                    />
                    <Button size="sm" onClick={() => save(p.id)} disabled={saving === p.id || !inputs[p.id]?.trim()}>
                      {saving === p.id ? <span className="h-3 w-3 animate-spin border border-current border-t-transparent" aria-hidden /> : hasKey ? 'Update' : 'Save'}
                    </Button>
                    {hasKey && (
                      <Button variant="destructive" size="sm" onClick={() => remove(p.id)} disabled={saving === p.id}>
                        Remove
                      </Button>
                    )}
                  </div>
                  {errors[p.id] && <p className="text-xs text-destructive">{errors[p.id]}</p>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {msg && <div className="border border-border bg-card px-3 py-2 text-center text-xs" role="status">{msg}</div>}

      <Card className="p-3">
        <p className="text-xs font-medium">How it works</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Pro: we provide and rotate keys. BYOK: router prefers your key for that provider, else falls back to Pro. Change anytime.</p>
      </Card>
    </div>
  );
}
