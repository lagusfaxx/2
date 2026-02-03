import { EventEmitter } from "node:events";

export type RealtimeEvent = {
  type: string;
  payload: Record<string, any>;
  targets?: string[];
};

const emitter = new EventEmitter();
const connections = new Map<string, Set<NodeJS.WritableStream>>();

export function registerRealtimeClient(userId: string, stream: NodeJS.WritableStream) {
  const existing = connections.get(userId) ?? new Set();
  existing.add(stream);
  connections.set(userId, existing);

  const onDisconnect = () => {
    const set = connections.get(userId);
    if (!set) return;
    set.delete(stream);
    if (!set.size) connections.delete(userId);
  };

  stream.on("close", onDisconnect);
  stream.on("finish", onDisconnect);
  stream.on("error", onDisconnect);

  return onDisconnect;
}

export function emitRealtimeEvent(event: RealtimeEvent) {
  const targets = event.targets && event.targets.length ? event.targets : null;
  if (targets) {
    targets.forEach((target) => {
      const set = connections.get(target);
      if (!set) return;
      for (const stream of set) {
        stream.write(`event: ${event.type}\n`);
        stream.write(`data: ${JSON.stringify(event.payload)}\n\n`);
      }
    });
  } else {
    for (const set of connections.values()) {
      for (const stream of set) {
        stream.write(`event: ${event.type}\n`);
        stream.write(`data: ${JSON.stringify(event.payload)}\n\n`);
      }
    }
  }
  emitter.emit("event", event);
}

export function getActiveConnections(userId: string) {
  return connections.get(userId)?.size || 0;
}

export function onRealtimeEvent(listener: (event: RealtimeEvent) => void) {
  emitter.on("event", listener);
  return () => emitter.off("event", listener);
}
