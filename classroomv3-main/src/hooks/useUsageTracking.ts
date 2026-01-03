import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// Get or create persistent client ID
function getClientId(): string {
  const key = 'huaroa_client_id'
  let clientId = localStorage.getItem(key)
  if (!clientId) {
    clientId = 'c-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36)
    localStorage.setItem(key, clientId)
  }
  return clientId
}

// Usage tracking hook for classroom/studio pages
export function useUsageTracking() {
  const location = useLocation()
  const usageIdRef = useRef<string | null>(null)
  const clientIdRef = useRef<string>(getClientId())

  useEffect(() => {
    const clientId = clientIdRef.current
    const page = '/studio' + location.pathname
    const section = location.pathname === '/' ? 'studio-home' : location.pathname.slice(1)

    // Start usage tracking
    const startUsage = async () => {
      try {
        const res = await fetch('/api/usage/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            page,
            section,
            timestamp: new Date().toISOString()
          })
        })
        const data = await res.json()
        if (data.success && data.usageId) {
          usageIdRef.current = data.usageId
          console.log('[Studio] Usage started:', data.usageId)
        }
      } catch (e) {
        console.warn('[Studio] Failed to start usage tracking', e)
      }
    }

    // End usage tracking
    const endUsage = async () => {
      if (!usageIdRef.current) return
      try {
        await fetch('/api/usage/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usageId: usageIdRef.current,
            clientId,
            page,
            section,
            timestamp: new Date().toISOString()
          })
        })
        console.log('[Studio] Usage ended:', usageIdRef.current)
        usageIdRef.current = null
      } catch (e) {
        console.warn('[Studio] Failed to end usage tracking', e)
      }
    }

    startUsage()

    // End on unmount or page change
    return () => {
      endUsage()
    }
  }, [location.pathname])

  // Also end on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (usageIdRef.current) {
        // Use sendBeacon for reliable delivery on page close
        const data = JSON.stringify({
          usageId: usageIdRef.current,
          clientId: clientIdRef.current,
          page: '/studio' + location.pathname,
          timestamp: new Date().toISOString()
        })
        navigator.sendBeacon('/api/usage/end', new Blob([data], { type: 'application/json' }))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [location.pathname])

  return { clientId: clientIdRef.current }
}

// Socket connection for heartbeat (similar to socket-client.js)
export function useSocketHeartbeat() {
  const clientIdRef = useRef<string>(getClientId())

  useEffect(() => {
    // Dynamic import socket.io-client if available
    const setupSocket = async () => {
      try {
        // @ts-ignore - socket.io loaded from CDN in production
        if (typeof window !== 'undefined' && (window as any).io) {
          const socket = (window as any).io()
          const clientId = clientIdRef.current

          // Send heartbeat every 10 seconds
          const interval = setInterval(() => {
            socket.emit('heartbeat', clientId)
          }, 10000)

          // Initial heartbeat
          socket.emit('heartbeat', clientId)

          return () => {
            clearInterval(interval)
            socket.disconnect()
          }
        }
      } catch (e) {
        console.warn('[Studio] Socket connection failed', e)
      }
    }

    setupSocket()
  }, [])

  return { clientId: clientIdRef.current }
}
