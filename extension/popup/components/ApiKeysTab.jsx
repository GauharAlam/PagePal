import { useState, useEffect } from 'react';
import { supabase, isDemoMode, demoSession } from '../lib/supabase';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { apiRequest } from '../lib/api';

const PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', model: 'Free & Paid Models', placeholder: 'sk-or-v1-...', help: 'openrouter.ai/keys' },
  { id: 'gemini', name: 'Google Gemini', model: 'Gemini 2.0 Flash', placeholder: 'AIza...', help: 'aistudio.google.com/app/apikey' },
  { id: 'deepseek', name: 'DeepSeek', model: 'DeepSeek R1 / V3', placeholder: 'sk-...', help: 'platform.deepseek.com → API Keys' },
  { id: 'anthropic', name: 'Anthropic', model: 'Claude 3.5 Sonnet', placeholder: 'sk-ant-...', help: 'console.anthropic.com → API Keys' },
  { id: 'openai', name: 'OpenAI', model: 'GPT-4o / o1', placeholder: 'sk-proj-...', help: 'platform.openai.com → API Keys' },
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
      const data = await apiRequest('/api/keys', { method: 'GET' }, token);
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
      const data = await apiRequest(
        '/api/keys',
        {
          method: 'POST',
          body: JSON.stringify({ provider, api_key: val.trim() }),
        },
        token
      );
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
      await apiRequest(`/api/keys/${provider}`, { method: 'DELETE' }, token);
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
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">BYOK (Bring Your Own Key)</div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          PagePal AI automatically provides access to <span className="font-semibold text-emerald-500">Free OpenRouter models</span>. You can also connect your own OpenRouter, Gemini, DeepSeek, or Anthropic keys for custom limits.
        </p>
        <div className="mt-2.5 flex gap-2">
          <span className="border border-border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 text-[10px] rounded">Free Tier: Active</span>
          <span className="border border-border bg-card px-2 py-0.5 text-[10px] rounded text-muted-foreground">BYOK: Encrypted & Private</span>
        </div>
      </Card>

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
                      <span className="text-xs font-bold">{p.name}</span>
                      <span className="border border-border bg-muted px-1.5 py-0.5 text-[10px] rounded font-medium">{p.model}</span>
                      {hasKey && <span className="border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500 rounded">Saved</span>}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{p.help}</p>
                    {hasKey && <p className="mt-1 font-mono text-xs text-emerald-500">{masked}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={`key-${p.id}`} className="text-[11px] font-semibold text-muted-foreground">
                    {p.name} API key
                  </label>
                  <div className="flex gap-2">
                    <input
                      id={`key-${p.id}`}
                      type="password"
                      placeholder={hasKey ? '•••••••• (Saved - enter new to replace)' : p.placeholder}
                      value={inputs[p.id] || ''}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      onBlur={() => {
                        const err = inputs[p.id] ? validate(p.id, inputs[p.id]) : '';
                        setErrors((prev) => ({ ...prev, [p.id]: err }));
                      }}
                      className="flex h-8 w-full rounded-lg border border-input bg-background px-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      aria-invalid={!!errors[p.id]}
                    />
                    <Button size="sm" onClick={() => save(p.id)} disabled={saving === p.id || !inputs[p.id]?.trim()} className="rounded-lg h-8 text-xs font-bold">
                      {saving === p.id ? <span className="h-3 w-3 animate-spin border border-current border-t-transparent rounded-full" aria-hidden /> : hasKey ? 'Update' : 'Save'}
                    </Button>
                    {hasKey && (
                      <Button variant="destructive" size="sm" onClick={() => remove(p.id)} disabled={saving === p.id} className="rounded-lg h-8 text-xs font-bold">
                        Remove
                      </Button>
                    )}
                  </div>
                  {errors[p.id] && <p className="text-[10px] font-medium text-destructive">{errors[p.id]}</p>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {msg && <div className="rounded-xl border border-border bg-card px-3 py-2 text-center text-xs font-bold" role="status">{msg}</div>}
    </div>
  );
}
