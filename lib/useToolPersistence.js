"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createToolStateEnvelope, readToolState } from "./toolState.mjs";

export function useToolPersistence({
  toolKey,
  schemaVersion,
  inputs,
  restore,
  migrate,
  onEmpty,
  debounceMs = 800,
  autoDetect = false,
}) {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Loading saved inputs…");
  const ready = useRef(false);
  const changed = useRef(false);
  const timer = useRef(null);
  const lastSaved = useRef("");
  const initialInputs = useRef(inputs);
  const suppressRestoredChange = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/tool-state/${toolKey}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401) {
          setStatus("signed-out");
          setMessage("Sign in as a member to restore and save inputs.");
          return;
        }
        if (!response.ok) throw new Error("Could not load saved inputs.");
        const body = await response.json();
        const saved = readToolState(body.state, {
          toolKey,
          schemaVersion,
          migrate,
        });
        if (saved) {
          suppressRestoredChange.current = autoDetect;
          restore(saved);
          lastSaved.current = JSON.stringify(
            createToolStateEnvelope(toolKey, schemaVersion, saved),
          );
          setStatus("saved");
          setMessage("Saved inputs restored.");
        } else {
          if (onEmpty) {
            suppressRestoredChange.current = autoDetect;
            await onEmpty();
          }
          lastSaved.current = JSON.stringify(
            createToolStateEnvelope(
              toolKey,
              schemaVersion,
              initialInputs.current,
            ),
          );
          setStatus("idle");
          setMessage("Inputs save automatically after you make a change.");
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setStatus("error");
          setMessage(error.message);
        }
      } finally {
        if (!controller.signal.aborted) ready.current = true;
      }
    }
    load();
    return () => {
      controller.abort();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [autoDetect, migrate, onEmpty, restore, schemaVersion, toolKey]);

  const markChanged = useCallback(() => {
    if (!ready.current) return;
    changed.current = true;
    setStatus("dirty");
    setMessage("Unsaved changes");
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    const envelope = createToolStateEnvelope(toolKey, schemaVersion, inputs);
    const serialized = JSON.stringify(envelope);
    if (
      autoDetect &&
      suppressRestoredChange.current &&
      serialized !== lastSaved.current
    ) {
      suppressRestoredChange.current = false;
      lastSaved.current = serialized;
      return;
    }
    if (autoDetect && serialized !== lastSaved.current) changed.current = true;
    if (!changed.current) return;
    if (serialized === lastSaved.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus("saving");
      setMessage("Saving…");
      try {
        const response = await fetch(`/api/tool-state/${toolKey}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: envelope }),
        });
        if (response.status === 401) {
          setStatus("signed-out");
          setMessage("Sign in as a member to save inputs.");
          return;
        }
        if (!response.ok)
          throw new Error(
            "Save failed. Your inputs remain on this device until you leave the page.",
          );
        lastSaved.current = serialized;
        changed.current = false;
        setStatus("saved");
        setMessage("Saved");
      } catch (error) {
        setStatus("error");
        setMessage(error.message);
      }
    }, debounceMs);
    return () => clearTimeout(timer.current);
  }, [autoDetect, debounceMs, inputs, schemaVersion, toolKey]);

  return { status, message, markChanged };
}
