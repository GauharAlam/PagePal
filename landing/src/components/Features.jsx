import React from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { FEATURES } from '../utils/constants'

function FeatureCard({ icon, title, description, color, border, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`card-hover group relative rounded-2xl p-6 bg-gradient-to-br ${color} border ${border} overflow-hidden`}
    >
      {/* Subtle inner glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/[0.02] rounded-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-100 mb-1.5">{title}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function Features() {
  const headRef = useRef(null)
  const headInView = useInView(headRef, { once: true, margin: '-60px' })

  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 top-1/2 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute right-0 top-1/3 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl" />
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-brand-500/20 text-sm text-brand-400 font-medium mb-4">
            ✦ Features
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Everything you need to{' '}
            <span className="text-gradient">read smarter</span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            PagePal packs a full AI reading assistant into your browser — no tab-switching, no copy-pasting, no waiting.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} {...feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
