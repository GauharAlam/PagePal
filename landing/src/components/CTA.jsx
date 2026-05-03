import React from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Zap, ArrowRight, Chrome } from 'lucide-react'
import { CHROME_STORE_URL } from '../utils/constants'

export default function CTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute left-1/3 top-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute right-1/3 bottom-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="gradient-border rounded-3xl overflow-hidden glow-brand"
        >
          {/* Top strip gradient */}
          <div className="h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-cyan-400" />

          <div className="px-8 py-16 sm:px-16 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-4xl shadow-2xl shadow-brand-500/40"
            >
              🧠
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
            >
              Start reading smarter{' '}
              <span className="text-gradient">today.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg text-zinc-400 max-w-xl mx-auto mb-10"
            >
              Join 10,000+ users who save hours every week by letting PagePal do the reading for them. Free to install. No credit card required.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-lg transition-all duration-200 shadow-2xl shadow-brand-500/40 hover:shadow-brand-500/60 hover:-translate-y-0.5"
              >
                <Zap size={20} className="fill-white" />
                Add to Chrome — It's Free
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </a>

              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Chrome size={16} className="text-zinc-600" />
                Available for Chrome &amp; Chromium browsers
              </div>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.48 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-zinc-600"
            >
              {[
                { icon: '🔒', label: 'No account required' },
                { icon: '✨', label: 'Free tier included' },
                { icon: '⚡', label: '< 3s summaries' },
                { icon: '🌐', label: 'Works on any page' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
