'use client';
import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

let socketInstance: Socket | null = null;

/**
 * Hook for real-time collaboration updates via Socket.IO
 * Connects once and subscribes to collaboration events
 * 
 * Usage in component:
 * const { socket, isConnected } = useSocket();
 * useEffect(() => {
 *   if (!socket) return;
 *   socket.on('collaboration:updated', (data) => {
 *     // handle update
 *   });
 * }, [socket]);
 */
export function useSocket() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Reuse existing connection or create new one
        if (!socketInstance) {
            const token = localStorage.getItem('porchest_token');
            socketInstance = io(SOCKET_URL, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 10,
                auth: {
                    token: token || '',
                },
                transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
            });

            socketInstance.on('connect', () => {
                console.log('[Socket] Connected to server');
            });

            socketInstance.on('disconnect', () => {
                console.log('[Socket] Disconnected from server');
            });

            socketInstance.on('error', (error) => {
                console.error('[Socket] Error:', error);
            });
        }

        return () => {
            // Don't disconnect on unmount - keep connection alive for multiple components
        };
    }, []);

    const isConnected = socketInstance?.connected ?? false;

    return {
        socket: socketInstance,
        isConnected,
    };
}

/**
 * Hook for listening to collaboration request updates
 * Automatically handles subscription and cleanup
 */
export function useCollaborationUpdates(callback: (data: any) => void) {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        // Subscribe to real-time updates
        socket.on('collaboration:received', callback);
        socket.on('collaboration:responded', callback);
        socket.on('collaboration:updated', callback);

        return () => {
            socket.off('collaboration:received', callback);
            socket.off('collaboration:responded', callback);
            socket.off('collaboration:updated', callback);
        };
    }, [socket, callback]);
}

/**
 * Emit collaboration action and listen for response
 */
export function emitCollaborationAction(action: string, data: any) {
    if (!socketInstance) {
        console.warn('[Socket] Socket not connected, falling back to HTTP');
        return Promise.reject(new Error('Socket not connected'));
    }

    return new Promise((resolve, reject) => {
        socketInstance?.emit(action, data, (response: any) => {
            if (response?.error) {
                reject(new Error(response.error));
            } else {
                resolve(response);
            }
        });
    });
}
