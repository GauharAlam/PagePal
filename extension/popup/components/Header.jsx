import { useState } from 'react';

export default function Header({ user, theme, onThemeToggle, onLoginClick, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-dark-500/50 relative">
      {/* Logo & Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-sm glow-purple animate-float">
          🧠
        </div>
        <div>
          <h1 className="text-sm font-bold gradient-text tracking-tight">PagePal AI</h1>
          <p className="text-[10px] text-gray-500 -mt-0.5">AI Co-pilot</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className="w-8 h-8 rounded-lg bg-dark-700 border border-dark-500 flex items-center justify-center text-sm hover:bg-dark-600 transition-all btn-hover-lift"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* User Button */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white hover:opacity-90 transition-all btn-hover-lift overflow-hidden"
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                user.email?.[0]?.toUpperCase() || 'U'
              )}
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-10 w-48 glass rounded-xl shadow-xl z-50 py-1 animate-fade-in">
                <div className="px-3 py-2 border-b border-dark-500/50">
                  <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                  <p className="text-[10px] text-purple-400 mt-0.5">Free Plan</p>
                </div>
                <button
                  onClick={() => { setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-dark-600 transition-colors"
                >
                  ⚡ Upgrade to Pro
                </button>
                <button
                  onClick={() => { setShowMenu(false); onLogout(); }}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-dark-600 transition-colors"
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 transition-all btn-hover-lift glow-purple"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Close menu on click outside */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </header>
  );
}
