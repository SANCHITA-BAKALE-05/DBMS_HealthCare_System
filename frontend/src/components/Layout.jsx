// Shared layout wrapper: sidebar + main content area

import React from 'react'
import Sidebar from './Sidebar'

const Layout = ({ children }) => (
  <div className="layout">
    <Sidebar />
    <main className="main-content">{children}</main>
  </div>
)

export default Layout
