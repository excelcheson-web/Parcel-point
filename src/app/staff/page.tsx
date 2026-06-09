'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function StaffLoginPage() {
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate login process
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    // Redirect to admin dashboard (for now)
    window.location.href = '/admin'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 staff-gradient">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Login Panel */}
      <div className="staff-glass-panel w-full max-w-md p-8 sm:p-12 relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/30">
              <Image
                src="/parcel-point-logo.png"
                alt="Parcel Point Logo"
                fill
                className="object-cover"
                sizes="80px"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wider mb-1">
            Parcel Point STAFF
          </h1>
          <p className="text-white/60 text-sm tracking-wide">
            Secure Employee Portal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Employee ID Field */}
          <div>
            <label htmlFor="employeeId" className="block text-white/80 text-sm font-medium mb-2 ml-1">
              Employee ID
            </label>
            <input
              id="employeeId"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Enter your employee ID"
              className="staff-input w-full px-5 py-4 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              required
              autoComplete="username"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-white/80 text-sm font-medium mb-2 ml-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="staff-input w-full px-5 py-4 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="staff-login-btn w-full py-4 px-6 rounded-xl text-white font-semibold text-lg tracking-wide transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Authenticating...
              </span>
            ) : (
              'LOGIN'
            )}
          </button>
        </form>

        {/* Secondary Links */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <Link 
            href="#" 
            className="text-white/60 hover:text-white transition-colors duration-300 hover:underline underline-offset-4"
          >
            Forgot Password?
          </Link>
          <Link 
            href="#" 
            className="text-white/60 hover:text-white transition-colors duration-300 hover:underline underline-offset-4"
          >
            Contact Security
          </Link>
        </div>

        {/* Security Badge */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>256-bit SSL Encryption | Secure Access Only</span>
          </div>
        </div>
      </div>

      {/* Back to Home Link */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <Link 
          href="/" 
          className="text-white/50 hover:text-white text-sm transition-colors duration-300 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to Parcel Point
        </Link>
      </div>
    </div>
  )
}
