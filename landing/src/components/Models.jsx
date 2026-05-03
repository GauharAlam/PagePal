import React, { useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'
import { MODELS } from '../utils/constants'

function ModelCard({ model, isActive, onClick, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.button
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-5 border transition-all duration-300 ${
        isActive
          ? `${model.bg} ${model.border} shadow-lg`
          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${model.bg} border ${model.border} flex items-center justify-center text-lg font-bold ${model.textColor}`}>
            {model.icon}
          </div>
          <div>
            <div className="font-semibold text-zinc-100 text-sm">{model.name}</div>
            <div className="text-xs text-zinc-500">{model.provider}</div>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${model.badgeColor}`}>
          {model.badge}
        </span>
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-2 border-t border-white/5">
              <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                <span className="text-zinc-300 font-medium">Best for: </span>
                {model.usedFor}
              </p>
              <div className={`mt-3 inline-block px-2 py-1 rounded-lg text-[10px] font-semibold ${model.badgeColor} uppercase tracking-wide`}>
                {model.tag}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function RoutingDiagram({ activeModel }) {
  const model = MODELS.find((m) => m.name === activeModel) || MODELS[0]

  return (
    <div className="gradient-border-sm rounded-2xl p-6 h-full flex flex-col justify-between">
      <div>
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
          Smart Routing Engine
        </div>

        {/* Input node */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800/60 border border-white/5">
            <span className="text-lg">🌐</span>
            <div>
              <div className="text-xs font-medium text-zinc-200">Page Content</div>
              <div className="text-[10px] text-zinc-500">Analyzed &amp; classified</div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-4 bg-zinc-700" />
              <div className="text-[10px] text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-700 bg-zinc-900">
                PagePal Router
              </div>
              <div className="w-px h-4 bg-zinc-700" />
            </div>
          </div>

          {/* Active model output */}
          <motion.div
            key={model.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${model.bg} border ${model.border}`}
          >
            <span className={`text-xl font-bold ${model.textColor}`}>{model.icon}</span>
            <div>
              <div className={`text-sm font-semibold ${model.textColor}`}>{model.name}</div>
              <div className="text-[10px] text-zinc-500">{model.tag}</div>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </motion.div>
        </div>
      </div>

      {/* All model logos at bottom */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="text-[10px] text-zinc-600 mb-3 uppercase tracking-wider">Available Models</div>
        <div className="flex gap-2">
          {MODELS.map((m) => (
            <div
              key={m.name}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all duration-300 ${
                m.name === model.name
                  ? `${m.bg} ${m.border}`
                  : 'bg-white/[0.02] border-white/5'
              }`}
            >
              <span className={`text-base font-bold ${m.name === model.name ? m.textColor : 'text-zinc-600'}`}>
                {m.icon}
              </span>
              <span className={`text-[9px] font-medium ${m.name === model.name ? 'text-zinc-300' : 'text-zinc-600'}`}>
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Models() {
  const [activeModel, setActiveModel] = useState('Gemini')
  const headRef = useRef(null)
  const headInView = useInView(headRef, { once: true, margin: '-60px' })

  return (
    <section id="models" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute left-1/4 top-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-cyan-500/20 text-sm text-cyan-400 font-medium mb-4">
            ⚡ AI Models
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            The right AI for{' '}
            <span className="text-gradient">every task</span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            PagePal automatically selects the best model based on content type, length, and complexity — so you always get the highest quality at the lowest cost.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Left: Model cards */}
          <div className="flex flex-col gap-3">
            {MODELS.map((model, i) => (
              <ModelCard
                key={model.name}
                model={model}
                isActive={activeModel === model.name}
                onClick={() => setActiveModel(model.name)}
                index={i}
              />
            ))}
          </div>

          {/* Right: Routing diagram */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:sticky lg:top-24"
          >
            <RoutingDiagram activeModel={activeModel} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
