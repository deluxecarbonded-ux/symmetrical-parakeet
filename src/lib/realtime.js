import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "./supabase";

/**
 * Realtime is deliberately table-allowlisted. RLS remains the authority for
 * row visibility; secret-bearing application tables are not part of this
 * layer and can never be passed to the subscription API.
 */
export const REALTIME_ALLOWED_TABLES = Object.freeze([
  "profiles",
  "single_player_profiles",
  "multiplayer_profiles",
  "single_player_progress",
  "single_player_wallets",
  "multiplayer_wallets",
  "single_player_inventory",
  "multiplayer_inventory",
  "user_achievements",
  "achievement_definitions",
  "shop_items",
  "shop_purchases",
  "translation_catalogs",
  "game_events",
  "wallet_transactions",
  "leaderboard_revision",
  "multiplayer_rooms",
  "multiplayer_players",
  "multiplayer_rounds",
]);

const ALLOWED_TABLES = new Set(REALTIME_ALLOWED_TABLES);
const CHANGE_EVENTS = new Set(["INSERT", "UPDATE", "DELETE"]);
const PROFILE_FILTER_COLUMNS = new Map([
  ["profiles", "id"],
  ["single_player_profiles", "profile_id"],
  ["multiplayer_profiles", "profile_id"],
  ["single_player_progress", "profile_id"],
  ["single_player_wallets", "profile_id"],
  ["multiplayer_wallets", "profile_id"],
  ["single_player_inventory", "profile_id"],
  ["multiplayer_inventory", "profile_id"],
  ["user_achievements", "profile_id"],
  ["game_events", "profile_id"],
  ["wallet_transactions", "profile_id"],
  ["shop_purchases", "profile_id"],
]);

let subscriptionSequence = 0;

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function clampDelay(value, fallback, maximum = 60_000) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(0, Math.trunc(number)));
}

function safeUserId(value) {
  const userId = String(value || "");
  return /^[a-zA-Z0-9_-]{1,128}$/.test(userId) ? userId : null;
}

function sessionFrom(value) {
  if (!value) return null;
  if (value.session?.user) return value.session;
  if (value.user) return value;
  if (value.id) return { user: value };
  return null;
}

function normalizeTables(value) {
  const values =
    typeof value === "string"
      ? [value]
      : value instanceof Set
        ? [...value]
        : Array.isArray(value)
          ? value
          : [];

  if (!values.length) {
    throw new TypeError("At least one Realtime table is required.");
  }

  const tables = [];
  const seen = new Set();
  values.forEach((candidate) => {
    if (typeof candidate !== "string" || !ALLOWED_TABLES.has(candidate)) {
      throw new TypeError(`Realtime table is not allowed: ${String(candidate)}`);
    }
    if (!seen.has(candidate)) {
      seen.add(candidate);
      tables.push(candidate);
    }
  });
  return tables;
}

function normalizeEvents(value) {
  if (value === undefined || value === null) return null;
  const values =
    typeof value === "string" ? [value] : Array.isArray(value) ? value : [];
  if (!values.length) {
    throw new TypeError("Realtime events must contain INSERT, UPDATE, or DELETE.");
  }
  const events = new Set();
  values.forEach((candidate) => {
    const event = String(candidate || "").toUpperCase();
    if (!CHANGE_EVENTS.has(event)) {
      throw new TypeError(`Unsupported Realtime event: ${String(candidate)}`);
    }
    events.add(event);
  });
  return events;
}

function normalizeWhere(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Realtime where must be a plain object.");
  }
  const where = {};
  Object.keys(value).forEach((key) => {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(key)) {
      throw new TypeError(`Invalid Realtime filter column: ${key}`);
    }
    const candidate = value[key];
    if (
      candidate === null ||
      typeof candidate === "string" ||
      typeof candidate === "number" ||
      typeof candidate === "boolean"
    ) {
      where[key] = candidate;
      return;
    }
    throw new TypeError(`Invalid Realtime filter value for ${key}.`);
  });
  return Object.keys(where).length ? where : null;
}

function stableRecordKey(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  return JSON.stringify(
    Object.keys(value)
      .sort()
      .map((key) => [key, value[key]]),
  );
}

function eventTypeFrom(value) {
  const event = String(
    value?.eventType ?? value?.event_type ?? "UPDATE",
  ).toUpperCase();
  return CHANGE_EVENTS.has(event) ? event : "UPDATE";
}

function sensitiveField(key) {
  const normalized = String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    normalized.startsWith("answer") ||
    normalized.includes("submittedcode") ||
    normalized.includes("password") ||
    normalized.includes("passphrase") ||
    normalized.includes("secret") ||
    normalized.includes("credential") ||
    normalized.includes("authorization") ||
    normalized.includes("accesstoken") ||
    normalized.includes("refreshtoken") ||
    normalized.includes("apikey") ||
    normalized.includes("sessiontoken") ||
    normalized.includes("cookie")
  );
}

/** Convert untrusted Realtime data into bounded, plain JSON-like values. */
function sanitizeValue(value, depth = 0, seen = new WeakSet()) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.slice(0, 16_384);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return value.toString();
  if (typeof value !== "object") return null;
  if (value instanceof Date) return value.toISOString();
  if (depth >= 5) return "[TRUNCATED]";
  if (seen.has(value)) return "[CIRCULAR]";

  seen.add(value);
  let sanitized;
  if (Array.isArray(value)) {
    sanitized = value
      .slice(0, 200)
      .map((item) => sanitizeValue(item, depth + 1, seen));
  } else {
    sanitized = {};
    Object.keys(value)
      .slice(0, 200)
      .forEach((key) => {
        if (
          key === "__proto__" ||
          key === "prototype" ||
          key === "constructor" ||
          key.length > 100
        ) {
          return;
        }
        sanitized[key] = sensitiveField(key)
          ? "[REDACTED]"
          : sanitizeValue(value[key], depth + 1, seen);
      });
  }
  seen.delete(value);
  return sanitized;
}

function normalizeChange(table, payload, source = "realtime") {
  const value = payload && typeof payload === "object" ? payload : {};
  const rawNew = hasOwn(value, "new")
    ? value.new
    : hasOwn(value, "newRecord")
      ? value.newRecord
      : hasOwn(value, "record")
        ? value.record
        : null;
  const rawOld = hasOwn(value, "old")
    ? value.old
    : hasOwn(value, "oldRecord")
      ? value.oldRecord
      : null;
  const commitTimestamp = String(
    value.commitTimestamp ?? value.commit_timestamp ?? "",
  ).slice(0, 128);

  return {
    eventType: eventTypeFrom(value),
    table,
    schema: "public",
    commitTimestamp: commitTimestamp || null,
    new: sanitizeValue(rawNew),
    old: sanitizeValue(rawOld),
    source: source === "local" ? "local" : "realtime",
    receivedAt: new Date().toISOString(),
  };
}

function recordMatches(record, events, where) {
  if (events && !events.has(record.eventType)) return false;
  if (!where) return true;

  const candidate = record.new || record.old;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return false;
  }
  return Object.entries(where).every(
    ([key, expected]) =>
      hasOwn(candidate, key) &&
      (candidate[key] === expected ||
        (candidate[key] !== null &&
          expected !== null &&
          String(candidate[key]) === String(expected))),
  );
}

function invokeSafely(callback) {
  try {
    const result = callback();
    if (result && typeof result.then === "function") {
      Promise.resolve(result).catch(() => {});
    }
  } catch {
    // A consumer callback must not interfere with the shared channel or peers.
  }
}

function schedule(callback) {
  if (typeof globalThis.setTimeout === "function") {
    const timer = globalThis.setTimeout(() => invokeSafely(callback), 0);
    if (timer && typeof timer.unref === "function") timer.unref();
    return;
  }
  if (typeof globalThis.queueMicrotask === "function") {
    globalThis.queueMicrotask(() => invokeSafely(callback));
    return;
  }
  Promise.resolve().then(() => invokeSafely(callback));
}

function statusSnapshot(status, userId = null, connectedAt = null) {
  return Object.freeze({
    status,
    userId,
    connectedAt,
    changedAt: new Date().toISOString(),
  });
}

export class RealtimeManager {
  constructor(client = supabase) {
    this.client = client || null;
    this.listeners = new Map(
      REALTIME_ALLOWED_TABLES.map((table) => [table, new Set()]),
    );
    this.statusListeners = new Set();
    this.snapshot = statusSnapshot(this.client ? "idle" : "unavailable");
    this.channel = null;
    this.userId = null;
    this.boundTables = new Set();
    this.channelGeneration = 0;
    this.authGeneration = 0;
    this.authCleanup = null;
    this.manualStarts = 0;
    this.emitTableChange = this.emitTableChange.bind(this);
  }

  getStatus() {
    return this.snapshot;
  }

  get connected() {
    return this.snapshot.status === "live";
  }

  subscribeStatus(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("Realtime status callback must be a function.");
    }
    const listener = { callback, active: true };
    this.statusListeners.add(listener);
    schedule(() => {
      if (listener.active) callback(this.snapshot);
    });
    return () => {
      if (!listener.active) return;
      listener.active = false;
      this.statusListeners.delete(listener);
    };
  }

  getRequestedTables() {
    const tables = new Set();
    this.listeners.forEach((listeners, table) => {
      if (listeners.size) tables.add(table);
    });
    if (this.manualStarts > 0) {
      REALTIME_ALLOWED_TABLES.forEach((table) => tables.add(table));
    }
    return [...tables];
  }

  subscribe(tables, callback, options = {}) {
    if (typeof callback !== "function") {
      throw new TypeError("Realtime change callback must be a function.");
    }
    const normalizedTables = normalizeTables(tables);
    const events = normalizeEvents(options.events);
    const where = normalizeWhere(options.where);
    const listener = {
      id: ++subscriptionSequence,
      callback,
      tables: new Set(normalizedTables),
      events,
      where,
      active: true,
    };

    normalizedTables.forEach((table) => {
      this.listeners.get(table).add(listener);
    });
    this.ensureAuthTracking();
    if (this.channel && this.userId) {
      const requested = this.getRequestedTables();
      if (requested.some((table) => !this.boundTables.has(table))) {
        this.reconnectForBindings();
      }
    }
    return () => this.unsubscribe(listener);
  }

  reconnectForBindings() {
    const userId = this.userId;
    if (!userId || !this.channel) return;
    const oldChannel = this.channel;
    this.channel = null;
    this.channelGeneration += 1;
    this.removeChannel(oldChannel);
    this.connect(userId);
  }

  unsubscribe(listener) {
    if (!listener?.active) return;
    listener.active = false;
    listener.tables.forEach((table) => {
      this.listeners.get(table)?.delete(listener);
    });
    listener.tables.clear();
    if (this.channel && this.userId) {
      const requested = new Set(this.getRequestedTables());
      if ([...this.boundTables].some((table) => !requested.has(table))) {
        this.reconnectForBindings();
      }
    }
    this.releaseIfUnused();
  }

  /** Retain a process-lifetime connection, for example from an App provider. */
  start(session) {
    this.manualStarts += 1;
    this.ensureAuthTracking();
    if (arguments.length) this.applySession(session);

    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.manualStarts = Math.max(0, this.manualStarts - 1);
      this.releaseIfUnused();
    };
  }

  stop() {
    this.manualStarts = 0;
    this.releaseIfUnused();
  }

  disconnect() {
    this.disconnectChannel("idle");
  }

  /** Emit a local, sanitized invalidation without waiting for the server echo. */
  emitTableChange(table, payload = {}) {
    const normalizedTable = normalizeTables(table)[0];
    const change = normalizeChange(normalizedTable, payload, "local");
    this.publish(change);
    return change;
  }

  ensureAuthTracking() {
    if (!this.client?.auth || this.authCleanup) return;
    const generation = ++this.authGeneration;
    try {
      const authListener = this.client.auth.onAuthStateChange(
        (event, session) => {
          if (!this.shouldRemainConnected()) return;
          if (event === "SIGNED_OUT" || !session?.user) {
            this.applySession(null);
            return;
          }
          this.applySession(session);
        },
      );
      const subscription = authListener?.subscription || authListener;
      this.authCleanup = () => {
        if (typeof subscription?.unsubscribe === "function") {
          subscription.unsubscribe();
        } else if (typeof authListener?.unsubscribe === "function") {
          authListener.unsubscribe();
        }
      };
    } catch {
      this.authCleanup = null;
      this.setStatus("unavailable");
      return;
    }

    if (typeof this.client.auth.getSession !== "function") return;
    Promise.resolve(this.client.auth.getSession())
      .then((result) => {
        if (
          generation !== this.authGeneration ||
          !this.shouldRemainConnected()
        ) {
          return;
        }
        if (result?.error) {
          if (!this.channel) this.setStatus("idle");
          return;
        }
        this.applySession(result?.data?.session || null);
      })
      .catch(() => {
        if (generation === this.authGeneration && !this.channel) {
          this.setStatus("idle");
        }
      });
  }

  applySession(value) {
    const session = sessionFrom(value);
    const userId = safeUserId(session?.user?.id);
    if (!userId) {
      this.disconnectChannel("idle");
      return;
    }
    this.connect(userId);
  }

  connect(userIdValue) {
    const userId = safeUserId(userIdValue);
    if (!userId || !this.client || !this.shouldRemainConnected()) return;
    if (this.userId === userId && this.channel) return;

    this.disconnectChannel("connecting");
    this.userId = userId;
    this.setStatus("connecting", userId);
    const generation = ++this.channelGeneration;
    let channel = null;

    try {
      channel = this.client.channel(`exotic-app-realtime:${userId}`);
      const tablesToBind = this.getRequestedTables();
      this.boundTables = new Set(tablesToBind);
      tablesToBind.forEach((table) => {
        const filterColumn = PROFILE_FILTER_COLUMNS.get(table);
        const binding = {
          event: "*",
          schema: "public",
          table,
        };
        if (filterColumn) binding.filter = `${filterColumn}=eq.${userId}`;
        channel.on(
          "postgres_changes",
          binding,
          (payload) => {
            if (
              generation !== this.channelGeneration ||
              this.channel !== channel
            ) {
              return;
            }
            this.publish(
              normalizeChange(table, payload),
              () =>
                generation === this.channelGeneration &&
                this.channel === channel,
            );
          },
        );
      });

      this.channel = channel;
      channel.subscribe((status) => {
        if (
          generation !== this.channelGeneration ||
          this.channel !== channel
        ) {
          return;
        }
        if (status === "SUBSCRIBED") {
          this.setStatus("live", userId);
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          this.setStatus("reconnecting", userId);
        } else {
          this.setStatus("connecting", userId);
        }
      });
    } catch {
      if (this.channel === channel) this.channel = null;
      if (channel) this.removeChannel(channel);
      if (this.userId === userId) this.setStatus("reconnecting", userId);
    }
  }

  disconnectChannel(nextStatus = "idle") {
    const channel = this.channel;
    this.channel = null;
    this.userId = null;
    this.boundTables.clear();
    this.channelGeneration += 1;
    if (channel) this.removeChannel(channel);
    this.setStatus(
      nextStatus,
      null,
      nextStatus === "idle" || nextStatus === "unavailable" ? null : undefined,
    );
  }

  removeChannel(channel) {
    try {
      const result = this.client?.removeChannel?.(channel);
      if (result && typeof result.catch === "function") result.catch(() => {});
    } catch {
      // Removing an already-closed channel is harmless.
    }
  }

  setStatus(status, userId = this.userId, connectedAt) {
    const nextUserId = status === "idle" || status === "unavailable" ? null : userId;
    const previous = this.snapshot;
    if (previous.status === status && previous.userId === nextUserId) return;
    this.snapshot = statusSnapshot(
      status,
      nextUserId,
      connectedAt === undefined
        ? status === "live"
          ? previous.connectedAt || new Date().toISOString()
          : null
        : connectedAt,
    );
    this.statusListeners.forEach((listener) => {
      if (!listener.active) return;
      schedule(() => {
        if (listener.active) listener.callback(this.snapshot);
      });
    });
  }

  publish(change, guard = null) {
    if (guard && !guard()) return;
    const tables = change.tables || [change.table];
    tables.forEach((table) => {
      this.listeners.get(table)?.forEach((listener) => {
        if (
          !listener.active ||
          !recordMatches(change, listener.events, listener.where)
        ) {
          return;
        }
        schedule(() => {
          if (listener.active && (!guard || guard())) {
            listener.callback(change);
          }
        });
      });
    });
  }

  hasSubscribers() {
    return [...this.listeners.values()].some((listeners) => listeners.size > 0);
  }

  shouldRemainConnected() {
    return this.hasSubscribers() || this.manualStarts > 0;
  }

  releaseIfUnused() {
    if (this.shouldRemainConnected()) return;
    this.disconnectChannel(this.client ? "idle" : "unavailable");
    if (!this.authCleanup) return;
    this.authGeneration += 1;
    const cleanup = this.authCleanup;
    this.authCleanup = null;
    try {
      cleanup();
    } catch {
      // Auth listener cleanup is best effort.
    }
  }
}

export const realtimeManager = new RealtimeManager();

export function isRealtimeTableAllowed(table) {
  return ALLOWED_TABLES.has(table);
}

function parseHookArguments(tablesOrOptions, callback, options) {
  if (
    tablesOrOptions &&
    typeof tablesOrOptions === "object" &&
    !Array.isArray(tablesOrOptions) &&
    !(tablesOrOptions instanceof Set)
  ) {
    const config = tablesOrOptions;
    return {
      tables: config.tables ?? config.table,
      callback:
        callback ??
        config.onChange ??
        config.onRefresh ??
        config.callback ??
        config.refresh,
      options: { ...config, ...(options || {}) },
    };
  }
  return {
    tables: tablesOrOptions,
    callback,
    options: options || {},
  };
}

function useManagerStatus(manager) {
  const [snapshot, setSnapshot] = useState(() => manager.getStatus());
  useEffect(() => manager.subscribeStatus(setSnapshot), [manager]);
  return useMemo(
    () => ({
      status: snapshot.status,
      connected: snapshot.status === "live",
      reconnecting: snapshot.status === "reconnecting",
      userId: snapshot.userId,
      connectedAt: snapshot.connectedAt,
      changedAt: snapshot.changedAt,
    }),
    [snapshot],
  );
}

/** Subscribe to one or more allowlisted tables and receive sanitized changes. */
export function useRealtimeSubscription(tablesOrOptions, callback, options) {
  const parsed = parseHookArguments(tablesOrOptions, callback, options);
  const tables = normalizeTables(parsed.tables);
  const manager = parsed.options.manager || realtimeManager;
  const events = normalizeEvents(parsed.options.events);
  const where = normalizeWhere(parsed.options.where);
  const tableKey = tables.join("|");
  const eventKey = events ? [...events].sort().join("|") : "*";
  const whereKey = stableRecordKey(where);
  const enabled = parsed.options.enabled !== false;
  const callbackRef = useRef(parsed.callback);
  callbackRef.current = parsed.callback;
  const [lastChange, setLastChange] = useState(null);
  const connection = useManagerStatus(manager);

  useEffect(() => {
    if (!enabled) return undefined;
    setLastChange(null);
    return manager.subscribe(
      tables,
      (change) => {
        setLastChange(change);
        return callbackRef.current?.(change);
      },
      { events, where },
    );
  }, [enabled, eventKey, manager, tableKey, whereKey]);

  return useMemo(
    () => ({
      ...connection,
      lastChange,
      emitTableChange: manager.emitTableChange,
    }),
    [connection, lastChange, manager],
  );
}

/** Debounced invalidation for hydrating app state after any matching change. */
export function useRealtimeInvalidation(tablesOrOptions, onRefresh, options) {
  const parsed = parseHookArguments(tablesOrOptions, onRefresh, options);
  const tables = normalizeTables(parsed.tables);
  const manager = parsed.options.manager || realtimeManager;
  const events = normalizeEvents(parsed.options.events);
  const where = normalizeWhere(parsed.options.where);
  const tableKey = tables.join("|");
  const eventKey = events ? [...events].sort().join("|") : "*";
  const whereKey = stableRecordKey(where);
  const enabled = parsed.options.enabled !== false;
  const debounceMs = clampDelay(parsed.options.debounceMs, 100);
  const refreshRef = useRef(parsed.callback);
  refreshRef.current = parsed.callback;
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const [lastChange, setLastChange] = useState(null);
  const [changeCount, setChangeCount] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const connection = useManagerStatus(manager);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) globalThis.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (timerRef.current !== null) globalThis.clearTimeout(timerRef.current);
    timerRef.current = globalThis.setTimeout(() => {
      timerRef.current = null;
      if (!mountedRef.current) return;
      setRefreshCount((count) => count + 1);
      invokeSafely(() => refreshRef.current?.());
    }, debounceMs);
  }, [debounceMs]);

  const invalidate = useCallback(() => {
    scheduleRefresh();
  }, [scheduleRefresh]);

  useEffect(() => {
    if (!enabled) return undefined;
    setLastChange(null);
    return manager.subscribe(
      tables,
      (change) => {
        if (!mountedRef.current) return;
        setLastChange(change);
        setChangeCount((count) => count + 1);
        scheduleRefresh();
      },
      { events, where },
    );
  }, [
    enabled,
    eventKey,
    manager,
    scheduleRefresh,
    tableKey,
    whereKey,
  ]);

  return useMemo(
    () => ({
      ...connection,
      invalidate,
      lastChange,
      changeCount,
      refreshCount,
      emitTableChange: manager.emitTableChange,
    }),
    [
      changeCount,
      connection,
      invalidate,
      lastChange,
      manager,
      refreshCount,
    ],
  );
}

/** Single-table convenience wrapper around useRealtimeSubscription. */
export function useRealtimeTable(table, onChange, options) {
  return useRealtimeSubscription(table, onChange, options);
}

export function useRealtimeStatus(manager = realtimeManager) {
  return useManagerStatus(manager);
}

/** Optional App-level lifetime owner; hooks otherwise connect on demand. */
export function startRealtime(session) {
  if (arguments.length) return realtimeManager.start(session);
  return realtimeManager.start();
}

export function stopRealtime(release) {
  if (typeof release === "function") {
    release();
    return;
  }
  realtimeManager.stop();
}

export function emitRealtimeTableChange(table, payload) {
  return realtimeManager.emitTableChange(table, payload);
}
