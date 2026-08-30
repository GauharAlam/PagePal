import React from 'react';
import { ShieldCheck, Lock, EyeOff, Server, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <section id="privacy" className="scroll-mt-16 border-t-2 border-black bg-white py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#FDE047] px-3 py-1 text-xs font-bold shadow-hard-sm">
            <ShieldCheck size={14} /> Privacy & Data Transparency
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">PagePal AI Privacy Policy</h2>
          <p className="mt-3 text-sm text-zinc-600 font-medium">
            Effective Date: August 30, 2026 • Last Updated: August 30, 2026
          </p>
        </div>

        <div className="mt-10 space-y-6 text-xs sm:text-sm text-zinc-700 leading-relaxed">
          <div className="rounded-2xl border-2 border-black bg-[#FFFDf5] p-6 shadow-hard-sm">
            <h3 className="flex items-center gap-2 font-bold text-base text-black">
              <EyeOff size={18} className="text-amber-600" /> 1. Zero Background Tracking
            </h3>
            <p className="mt-2">
              PagePal AI never tracks your browsing history, clicks, or keystrokes in the background. Page context (text/transcript) is extracted <strong>only</strong> when you explicitly interact with the extension and click the <em>Summarize</em>, <em>Chat</em>, or <em>Quiz</em> buttons.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-black bg-[#FFFDf5] p-6 shadow-hard-sm">
            <h3 className="flex items-center gap-2 font-bold text-base text-black">
              <Lock size={18} className="text-emerald-600" /> 2. API Keys & BYOK Security
            </h3>
            <p className="mt-2">
              When using Bring-Your-Own-Key (BYOK), your personal API keys (Anthropic, OpenAI, Google) are encrypted at rest using AES-256-GCM encryption. They are strictly used to forward your prompts directly to the respective AI provider on your behalf.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-black bg-[#FFFDf5] p-6 shadow-hard-sm">
            <h3 className="flex items-center gap-2 font-bold text-base text-black">
              <Server size={18} className="text-blue-600" /> 3. Third-Party AI Processors
            </h3>
            <p className="mt-2">
              Requests are routed through our secure proxy server to Anthropic (Claude) or OpenRouter to generate summaries. No customer text is retained for model training by PagePal AI.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-black bg-[#FFFDf5] p-6 shadow-hard-sm">
            <h3 className="flex items-center gap-2 font-bold text-base text-black">
              <FileText size={18} className="text-purple-600" /> 4. Data Deletion & Rights
            </h3>
            <p className="mt-2">
              You can delete your saved summaries and chat history anytime from your account or by clearing your extension cache. To request full account deletion, contact support at privacy@pagepal.ai.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
