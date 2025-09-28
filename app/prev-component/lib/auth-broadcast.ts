type AuthBroadcastType = 'token-refreshed' | 'logged-out'
export type AuthBroadcastMessage = { type: AuthBroadcastType; t?: number }

let channelRef: BroadcastChannel | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null
  if (channelRef) return channelRef
  if ('BroadcastChannel' in window) {
    try {
      channelRef = new BroadcastChannel('auth-refresh')
    } catch {}
  }
  return channelRef
}

export function broadcastAuth(type: AuthBroadcastType) {
  const ch = getChannel()
  const msg: AuthBroadcastMessage = { type, t: Date.now() }
  if (ch) {
    try {
      ch.postMessage(msg)
      return
    } catch {}
  }
  try {
    localStorage.setItem('auth:changed', JSON.stringify(msg))
    // storage 이벤트는 스스로에게는 발생하지 않으므로, 현재 탭도 즉시 처리하려는 경우
    // 구독자 컴포넌트가 있으면 그쪽에서 처리됩니다.
  } catch {}
}

export function subscribeAuth(handler: (msg: AuthBroadcastMessage) => void) {
  const ch = getChannel()
  const onMessage = (ev: MessageEvent) => {
    const msg = (ev as any)?.data as AuthBroadcastMessage
    if (!msg || !msg.type) return
    if (msg.type === 'token-refreshed' || msg.type === 'logged-out') handler(msg)
  }
  const onStorage = (ev: StorageEvent) => {
    if (ev.key !== 'auth:changed' || !ev.newValue) return
    try {
      const msg = JSON.parse(ev.newValue) as AuthBroadcastMessage
      if (!msg || !msg.type) return
      if (msg.type === 'token-refreshed' || msg.type === 'logged-out') handler(msg)
    } catch {}
  }
  try { ch?.addEventListener('message', onMessage as any) } catch {}
  if (typeof window !== 'undefined') {
    try { window.addEventListener('storage', onStorage as any) } catch {}
  }

  return () => {
    try { ch?.removeEventListener('message', onMessage as any) } catch {}
    if (typeof window !== 'undefined') {
      try { window.removeEventListener('storage', onStorage as any) } catch {}
    }
  }
}
