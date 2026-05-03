import React from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Star } from "lucide-react";
import { CHROME_STORE_URL } from "../utils/constants";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background glows */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="dot-grid absolute inset-0 opacity-50 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
        {/* ── Left: Copy ── */}
        <div className="flex flex-col items-start gap-6">
          {/* Badge */}
          <motion.div {...fadeUp(0.1)}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-brand-500/30 text-sm text-brand-300 font-medium w-fit">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-slow" />
              AI-Powered Chrome Extension
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.2)}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight"
          >
            Summarize <span className="text-gradient">Anything.</span>
            <br />
            <span className="text-zinc-300">Instantly.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            {...fadeUp(0.3)}
            className="text-lg text-zinc-400 leading-relaxed max-w-lg"
          >
            PagePal is a smart Chrome extension that uses{" "}
            <span className="text-zinc-200 font-medium">
              Gemini, GPT-4, DeepSeek &amp; Grok
            </span>{" "}
            to summarize any webpage, YouTube video, or article in seconds —
            with zero effort.
          </motion.p>

          {/* CTA Row */}
          <motion.div
            {...fadeUp(0.4)}
            className="flex flex-wrap items-center gap-3 mt-2"
          >
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-white font-semibold text-base transition-all duration-200 shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5"
            >
              <Zap size={16} className="fill-white" />
              Add to Chrome — Free
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector("#how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl glass hover:bg-white/10 text-zinc-200 font-semibold text-base transition-all duration-200"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div {...fadeUp(0.5)} className="flex items-center gap-3 mt-1">
            <div className="flex -space-x-2">
              {[
                "bg-violet-500",
                "bg-pink-500",
                "bg-cyan-500",
                "bg-amber-500",
                "bg-emerald-500",
              ].map((c, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full ${c} border-2 border-zinc-950 flex items-center justify-center text-[10px] font-bold text-white`}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className="fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <span className="text-sm text-zinc-400">
                <span className="text-zinc-200 font-semibold">10,000+</span>{" "}
                users love PagePal
              </span>
            </div>
          </motion.div>
        </div>

        {/* ── Right: Extension UI Mockup ── */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex justify-center lg:justify-end"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-500/20 via-purple-500/10 to-cyan-500/20 blur-2xl scale-110 pointer-events-none" />

          <div className="relative w-full max-w-sm animate-float">
            <div className="gradient-border rounded-2xl overflow-hidden shadow-2xl glow-brand">
              {/* Panel header */}
              <div className="px-4 py-3 bg-zinc-900/90 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🧠</span>
                  <span className="text-sm font-semibold text-zinc-200">
                    PagePal AI
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                </div>
              </div>

              {/* Panel body */}
              <div className="p-4 bg-zinc-900/80 space-y-4">
                {/* Page pill */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/60 border border-white/5">
                  <span className="text-sm">🌐</span>
                  <span className="text-xs text-zinc-400 truncate">
                    techcrunch.com/ai-news-2024
                  </span>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium shrink-0">
                    Article
                  </span>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Summarize", icon: "⚡", active: true },
                    { label: "Key Points", icon: "🎯", active: false },
                    { label: "Explain", icon: "💡", active: false },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        btn.active
                          ? "bg-brand-500/20 border border-brand-500/40 text-brand-300"
                          : "bg-zinc-800/50 border border-white/5 text-zinc-500"
                      }`}
                    >
                      <span>{btn.icon}</span>
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* AI model badge */}
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 text-sm font-bold">✦</span>
                    <span className="text-xs text-blue-300 font-medium">
                      Using Gemini Flash
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    auto-selected
                  </span>
                </div>

                {/* Summary result */}
                <div className="rounded-xl bg-zinc-800/50 border border-white/5 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                      Summary
                    </span>
                  </div>
                  {[
                    { w: "w-full" },
                    { w: "w-11/12" },
                    { w: "w-4/5" },
                    { w: "w-3/4" },
                  ].map((line, i) => (
                    <div
                      key={i}
                      className={`${line.w} h-2 rounded-full bg-zinc-700`}
                    />
                  ))}
                  <div className="pt-2 space-y-2">
                    {[
                      { dot: "bg-brand-400", w: "w-5/6" },
                      { dot: "bg-cyan-400", w: "w-4/5" },
                      { dot: "bg-purple-400", w: "w-11/12" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span
                          className={`w-1 h-1 rounded-full ${item.dot} shrink-0`}
                        />
                        <div
                          className={`${item.w} h-2 rounded-full bg-zinc-700`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer stats */}
                <div className="flex items-center justify-between text-[10px] text-zinc-600">
                  <span>2.1s response</span>
                  <span>~320 tokens</span>
                  <span className="text-emerald-500">Saved to history</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-zinc-600 tracking-widest uppercase">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-zinc-700 flex items-start justify-center pt-1.5"
        >
          <span className="w-1 h-2 rounded-full bg-zinc-500" />
        </motion.div>
      </motion.div>
    </section>
  );
}
