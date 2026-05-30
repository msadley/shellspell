type SSEListener = (data: any) => void;
type SSEDeletedListener = () => void;

interface SSEConnection {
  es: EventSource;
  refCount: number;
  onUpdateListeners: Set<SSEListener>;
  onDeletedListeners: Set<SSEDeletedListener>;
}

class SSEManager {
  private connections: Record<string, SSEConnection> = {};

  public subscribe(
    code: string,
    onUpdate: SSEListener,
    onDeleted: SSEDeletedListener
  ) {
    if (!this.connections[code]) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
      const isAdminRoute = typeof window !== "undefined" && window.location.pathname.startsWith('/admin');
      const token = typeof window !== "undefined"
        ? (isAdminRoute ? localStorage.getItem("admin_token") : localStorage.getItem("player_token"))
        : null;
      const url = token
        ? `${apiBaseUrl}/sessions/${code}/stream?token=${encodeURIComponent(token)}`
        : `${apiBaseUrl}/sessions/${code}/stream`;
      const es = new EventSource(url);
      
      const connection: SSEConnection = {
        es,
        refCount: 1,
        onUpdateListeners: new Set([onUpdate]),
        onDeletedListeners: new Set([onDeleted]),
      };

      es.addEventListener("session-update", (event) => {
        try {
          const data = JSON.parse(event.data);
          connection.onUpdateListeners.forEach((listener) => listener(data));
        } catch (err) {
          console.error("Failed to parse SSE event data", err);
        }
      });

      es.addEventListener("session-deleted", () => {
        connection.onDeletedListeners.forEach((listener) => listener());
        es.close();
        delete this.connections[code];
      });

      es.onerror = (err) => {
        console.error("EventSource error:", err);
      };

      this.connections[code] = connection;
    } else {
      const connection = this.connections[code];
      connection.refCount += 1;
      connection.onUpdateListeners.add(onUpdate);
      connection.onDeletedListeners.add(onDeleted);
    }

    return () => {
      const connection = this.connections[code];
      if (connection) {
        connection.refCount -= 1;
        connection.onUpdateListeners.delete(onUpdate);
        connection.onDeletedListeners.delete(onDeleted);

        if (connection.refCount === 0) {
          connection.es.close();
          delete this.connections[code];
        }
      }
    };
  }
}

export const sseManager = new SSEManager();
