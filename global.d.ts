// Global type declarations for the application

// Extend the global namespace to include the WebSocket clients
declare global {
  // Add WebSocket clients to the global namespace for use in API routes
  var websocketClients: Set<WebSocket>;
}

export {};
