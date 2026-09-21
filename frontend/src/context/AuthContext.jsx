// ============================================================
// AuthContext.jsx
//
// PURPOSE:
//   This file manages the authentication STATE for the entire
//   React application using the Context API.
//
// WHAT IS REACT CONTEXT?
//   Context is React's way of sharing data across many components
//   without passing props down manually at every level.
//   Any component in the app can call useAuth() to get the
//   current user and login/logout functions — no prop drilling.
//
// WHAT DOES IT STORE?
//   user  — the logged-in user object (username, role, profile, etc.)
//           or null if no one is logged in
//   token — the JWT string received from the backend on login
//
// PERSISTENCE (staying logged in after page refresh):
//   When the user logs in, the JWT token and user object are
//   saved to localStorage under the keys:
//     'hc_token' — the JWT string
//     'hc_user'  — the user object as JSON
//
//   When the app loads, the useEffect reads localStorage and
//   restores the session automatically, so the user doesn't
//   have to log in again after refreshing the page.
//
//   When the user logs out (or the token expires), both keys
//   are removed from localStorage.
//
// USAGE IN ANY COMPONENT:
//   import { useAuth } from '../context/AuthContext'
//   const { user, login, logout } = useAuth()
//
//   user.role  → 'PATIENT', 'DOCTOR', or 'ADMIN'
//   user.username → the logged-in username
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react'

// Create the context object — components use this via useAuth()
const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  // user holds: { user_id, username, role, profile, ... }
  // null means no one is logged in
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(null)
  // loading is true while we check localStorage on first page load.
  // This prevents a flash where the app briefly shows the login page
  // before realising the user is already logged in.
  const [loading, setLoading] = useState(true)

  // ── On first app load: restore session from localStorage ──
  // This useEffect runs once when the component mounts.
  // [] as the dependency array means "run once, never again".
  useEffect(() => {
    const savedToken = localStorage.getItem('hc_token')
    const savedUser  = localStorage.getItem('hc_user')
    if (savedToken && savedUser) {
      // Restore the previously saved session
      setToken(savedToken)
      setUser(JSON.parse(savedUser)) // JSON.parse converts the string back to an object
    }
    setLoading(false) // done checking — let the app render
  }, [])

  // ── login: called after a successful POST /api/auth/login ──
  // Saves the token and user to both state and localStorage
  const login = (tokenValue, userData) => {
    localStorage.setItem('hc_token', tokenValue)
    localStorage.setItem('hc_user',  JSON.stringify(userData)) // JSON.stringify converts object to string
    setToken(tokenValue)
    setUser(userData)
  }

  // ── logout: clears everything ──────────────────────────────
  // Called when the user clicks Logout or when the token expires
  const logout = () => {
    localStorage.removeItem('hc_token')
    localStorage.removeItem('hc_user')
    setToken(null)
    setUser(null)
  }

  return (
    // AuthContext.Provider wraps the entire app (see main.jsx / App.jsx)
    // Any component inside it can call useAuth() to access these values
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Custom hook: useAuth ──────────────────────────────────────
// Components import this instead of importing AuthContext directly.
// Usage:  const { user, logout } = useAuth()
export const useAuth = () => useContext(AuthContext)
