/**
 * Centralized event system for BEP data updates
 * Ensures all components stay in sync with a single source of truth
 */

export type BEPDataEventType = 'bep:data-updated' | 'bep:validation-updated' | 'bep:progress-updated'

export interface BEPDataEvent {
  type: BEPDataEventType
  projectId: string
  timestamp: string
  data?: Record<string, unknown>
}

class BEPDataEventBus {
  private listeners: Map<BEPDataEventType, Set<(event: BEPDataEvent) => void>> = new Map()

  /**
   * Subscribe to BEP data events
   */
  subscribe(eventType: BEPDataEventType, callback: (event: BEPDataEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    
    this.listeners.get(eventType)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback)
    }
  }

  /**
   * Emit a BEP data event
   */
  emit(eventType: BEPDataEventType, projectId: string, data?: Record<string, unknown>): void {
    const event: BEPDataEvent = {
      type: eventType,
      projectId,
      timestamp: new Date().toISOString(),
      data
    }

    console.log(`[BEP-EVENT] ${eventType}`, event)
    
    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error(`Error in BEP event callback for ${eventType}:`, error)
        }
      })
    }
  }

  /**
   * Clear all listeners (for cleanup)
   */
  clear(): void {
    this.listeners.clear()
  }
}

// Global event bus instance
export const bepDataEvents = new BEPDataEventBus()

/**
 * Hook for components to subscribe to BEP data updates
 */
export function useBEPDataEvents(
  eventType: BEPDataEventType, 
  callback: (event: BEPDataEvent) => void,
  projectId?: string
): void {
  React.useEffect(() => {
    const filteredCallback = (event: BEPDataEvent) => {
      // Only trigger if projectId matches (if specified)
      if (!projectId || event.projectId === projectId) {
        callback(event)
      }
    }

    const unsubscribe = bepDataEvents.subscribe(eventType, filteredCallback)
    return unsubscribe
  }, [eventType, callback, projectId])
}

// React import for useEffect
import React from 'react'