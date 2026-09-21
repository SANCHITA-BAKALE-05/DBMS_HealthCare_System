// ============================================================
// AuthContext.jsx
// Provides authentication state to the entire React app.
// Stores the JWT token and user info in localStorage so the
// user stays logged in after a page refresh.
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user,  setUser]  = useState(null)   // { user_id, username, role, profile, ... }
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true) // true while reading localStorage

  // On first load, restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('hc_token')
    const savedUser  = localStorage.getItem('hc_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (tokenValue, userData) => {
    localStorage.setItem('hc_token', tokenValue)
    localStorage.setItem('hc_user',  JSON.stringify(userData))
    setToken(tokenValue)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('hc_token')
    localStorage.removeItem('hc_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — components call useAuth() to access auth state
export const useAuth = () => useContext(AuthContext)
