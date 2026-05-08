import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap } from 'lucide-react'
import { UserButton, SignInButton, useUser, useClerk } from '@clerk/react'
import { CHROME_STORE_URL } from '../utils/constants'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Models',   href: '#models' },
  { label: 'How It Works', href: '#how-it-works' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isSignedIn, user } = useUser()
  const { openSignIn } = useClerk()
  const autoSignInTriggered = useRef(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-open sign-in modal when extension sends user to /?sign_in=true
  useEffect(() => {
    if (autoSignInTriggered.current) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('sign_in') === 'true' && !isSignedIn) {
      autoSignInTriggered.current = true
      // Small delay to ensure Clerk is fully loaded
      setTimeout(() => {
        openSignIn({ fallbackRedirectUrl: '/' })
      }, 500)
    }
  }, [isSignedIn, openSignIn])

  const handleNavClick = (e, href) => {
    e.preventDefault()
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'glass border-b border-white/10 shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
                🧠
              </div>
              <span className="font-bold text-lg tracking-tight">
                Page<span className="text-gradient-warm">Pal</span>
              </span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-white/5 transition-all duration-200"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* CTA & Auth */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5"
              >
                <Zap size={14} className="fill-white" />
                Add to Chrome
              </a>
              {/* User Auth */}
              {isSignedIn ? (
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: 'w-10 h-10 rounded-full border border-white/10 hover:border-brand-500/50 transition-all',
                      userButtonPopoverCard: 'shadow-xl shadow-black/50 border border-white/10',
                    },
                  }}
                  afterSignOutUrl="/"
                />
              ) : (
                <SignInButton
                  mode="modal"
                  fallbackRedirectUrl="/"
                >
                  <button className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-200">
                    Sign In
                  </button>
                </SignInButton>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-all"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 inset-x-0 z-40 glass border-b border-white/10 px-4 py-4 md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                >
                  {link.label}
                </a>
              ))}
              {isSignedIn && (
                <div className="px-4 py-3 text-sm text-zinc-400">
                  Signed in as <span className="text-white font-medium">{user?.firstName || user?.emailAddresses?.[0]?.emailAddress}</span>
                </div>
              )}
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold transition-all"
              >
                <Zap size={14} className="fill-white" />
                Add to Chrome — Free
              </a>
              {!isSignedIn && (
                <SignInButton mode="modal" fallbackRedirectUrl="/">
                  <button className="mt-2 w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all">
                    Sign In
                  </button>
                </SignInButton>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
