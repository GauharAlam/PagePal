import React from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { STEPS } from '../utils/constants'

function StepCard({ number, title, description, icon, index, isLast }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <div ref={ref} className="relative flex flex-col items-center text-center">
      {/* Connector line */}
      {!isLast && (
        <div className="hidden lg:block absolute top-10 left-[calc(50%+3rem)] right-[calc(-50%+3rem)] h-px">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.6, delay: index * 0.15 + 0.3, ease: 'easeInOut' }}
            style={{ transformOrigin: 'left' }}
            className="h-full bg-gradient-to-r from-brand-500/40 to-transparent"
          />
          <div className="absolute inset-0 border-t border-dashed border-white/5" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-4 w-full"
      >
        {/* Number + icon bubble */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl glass border border-white/10 flex items-center justify-center text-3xl shadow-xl shadow-black/20 group-hover:border-brand-500/30 transition-colors">
            {icon}
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-500 border-2 border-zinc-950 flex items-center justify-center">
            <span className="text-[9px] font-extrabold text-white">{number}</span>
          </div>
        </div>

        {/* Text */}
        <div className="px-2">
          <h3 className="text-base font-semibold text-zinc-100 mb-2">{title}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
        </div>
      </motion.div>
    </div>
  )
}

export default function HowItWorks() {
  const headRef = useRef(null)
  const headInView = useInView(headRef, { once: true, margin: '-60px' })

  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-emerald-500/20 text-sm text-emerald-400 font-medium mb-4">
            🚀 How It Works
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Up and running in{' '}
            <span className="text-gradient">60 seconds</span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            No accounts. No API keys (unless you want your own). Just install and go.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {STEPS.map((step, i) => (
            <StepCard
              key={step.number}
              {...step}
              index={i}
              isLast={i === STEPS.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
