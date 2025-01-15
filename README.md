# Nuxt Reactive WebSocket Demo

A real-time cursor tracking demo built with Nuxt showcasing the ability to use WebSockets to reactively update multiple states across different browsers/devices.

### Features
- Basic user session management
- Connection status indicators
- Real-time cursor position tracking
- Toast notifications for user connections/disconnections

### Tech Stack
- Nuxt
- [`@sandros94/lab`](https://github.com/sandros94/lab) for WebSocket handling (using [`crossws`](https://github.com/unjs/crossws) under the hood)
- VueUse for mouse tracking and window size utilities

### Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev
```

### How it Works
1. Each client gets a unique ID and sends cursor positions to the server
2. Server broadcasts cursor positions to all connected clients
3. Clients render cursor positions relative to their viewport

### Dependencies

Built ontop of my own [`@sandros94/lab`](https://github.com/sandros94/lab) Nuxt module for WebSocket functionality (`useWS` composable and `useWebSocketHandler` utility).
