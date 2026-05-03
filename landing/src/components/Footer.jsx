import React from 'react'
import { motion } from 'framer-motion'
import { Github, Twitter, Zap } from 'lucide-react'
import { CHROME_STORE_URL } from '../utils/constants'

const LINKS = {
  Product: [
    { label: 'Features',    href: '#features' },
    { label: 'AI Models',   href: '#models' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Add to Chrome', href: CHROME_STORE_URL, external: true },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'Changelog',     href: '#' },
    { label: 'Blog',          href: '#' },
    { label: 'Support',       href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy',   href: '#' },
  ],
}

function handleNavClick(e, href) {
  if (href.startsWith('#')) {
    e.preventDefault()
    if (href === '#') return
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }
}

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 overflow-hidden">
      {/* Top gradient line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="flex items-center gap-2 w-fit group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-shadow">
                🧠
              </div>
              <span className="font-bold text-base tracking-tight">
                Page<span className="text-gradient-warm">Pal</span>
              </span>
            </a>
            <p className="text-sm text-zinc-500 leading-relaxed pr-4">
              The smartest way to consume content on the web. Powered by Gemini, GPT-4, DeepSeek, and Grok.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2 mt-1">
              {[
                { icon: <Github size={16} />, href: '#', label: 'GitHub' },
                { icon: <Twitter size={16} />, href: '#', label: 'Twitter' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg glass hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-all"
                >
                  {s.icon}
                </a>
              ))}
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 hover:text-brand-300 text-xs font-medium transition-all ml-1"
              >
                <Zap size={11} className="fill-current" />
                Install
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title} className="flex flex-col gap-3">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {title}
              </div>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <span>
            &copy; {new Date().getFullYear()} PagePal AI. All rights reserved.
          </span>
          <span className="flex items-center gap-1">
            Built with
            <span className="text-rose-500 mx-0.5">♥</span>
            using React, Vite &amp; Tailwind CSS
          </span>
        </div>
      </div>
    </footer>
  )
}
