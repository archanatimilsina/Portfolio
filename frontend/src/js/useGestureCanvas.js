import { useEffect, useRef, useCallback } from "react";

const TAP_WINDOW_MS   = 800; // max gap between the three taps
const TAP_REQUIRED    = 3;   // triple-tap opens/closes the drawing canvas
const STROKE_PAUSE_MS = 800; // pause after the last stroke before recognising
const MIN_POINTS      = 5;   // ignore stray dots / accidental clicks

// Triple-taps that begin on real controls must keep their normal meaning
// (typing, clicking a button, following a link, interacting with a dialog).
const IGNORE_TAP_TARGETS =
  'input, textarea, select, button, a, label, [contenteditable="true"], ' +
  '[role="textbox"], [role="button"], [role="link"], [role="dialog"]';

/**
 * Global gesture drawing canvas.
 *
 * @param {object}   options
 * @param {Function} options.onGesture    called with the recognised strokes
 * @param {Function} options.onActivate   called when the canvas opens
 * @param {Function} options.onDeactivate called when the canvas closes
 * @param {boolean}  options.enabled      when false, triple-tap is ignored
 */
export function useGestureCanvas({
  onGesture,
  onActivate,
  onDeactivate,
  enabled = true,
} = {}) {
  const canvasRef        = useRef(null);
  const activeRef        = useRef(false);
  const enabledRef       = useRef(enabled);
  const tapTimesRef      = useRef([]);
  const strokesRef       = useRef([]);
  const currentStrokeRef = useRef(null);
  const pauseTimerRef    = useRef(null);

  // Keep the latest callbacks/flags reachable from stable event listeners
  // so we never have to re-bind document-level handlers.
  const onGestureRef    = useRef(onGesture);
  const onActivateRef   = useRef(onActivate);
  const onDeactivateRef = useRef(onDeactivate);
  useEffect(() => { onGestureRef.current = onGesture; }, [onGesture]);
  useEffect(() => { onActivateRef.current = onActivate; }, [onActivate]);
  useEffect(() => { onDeactivateRef.current = onDeactivate; }, [onDeactivate]);

  const deactivateCanvas = useCallback(() => {
    const wasActive = activeRef.current;
    activeRef.current = false;
    clearTimeout(pauseTimerRef.current);
    tapTimesRef.current      = [];
    strokesRef.current       = [];
    currentStrokeRef.current = null;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.display = "none";
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    }
    if (wasActive) onDeactivateRef.current?.();
  }, []);

  const activateCanvas = useCallback(() => {
    if (activeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    activeRef.current        = true;
    strokesRef.current       = [];
    currentStrokeRef.current = null;

    canvas.style.display = "block";
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    onActivateRef.current?.();
  }, []);

  // Triple-tap acts as a toggle: give (+) the canvas, or take (-) it away.
  const toggleCanvas = useCallback(() => {
    if (activeRef.current) deactivateCanvas();
    else activateCanvas();
  }, [activateCanvas, deactivateCanvas]);

  // Turning Gesture Nav off must immediately cancel any open canvas.
  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) deactivateCanvas();
  }, [enabled, deactivateCanvas]);

  const getPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const handleTap = useCallback((e) => {
    if (!enabledRef.current) return;                    // only when active
    if (e.button !== undefined && e.button !== 0) return; // primary button/touch only
    if (e.target?.closest?.(IGNORE_TAP_TARGETS)) return;  // don't hijack controls

    const now = Date.now();
    tapTimesRef.current.push(now);
    tapTimesRef.current = tapTimesRef.current.filter((t) => now - t <= TAP_WINDOW_MS);

    if (tapTimesRef.current.length >= TAP_REQUIRED) {
      tapTimesRef.current = [];
      toggleCanvas();
    }
  }, [toggleCanvas]);

  const onPointerDown = useCallback((e) => {
    if (!activeRef.current) return;
    clearTimeout(pauseTimerRef.current);
    currentStrokeRef.current = [getPoint(e)];
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!activeRef.current || !currentStrokeRef.current) return;
    currentStrokeRef.current.push(getPoint(e));
  }, []);

  const onPointerUp = useCallback(() => {
    if (!activeRef.current || !currentStrokeRef.current) return;
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;

    if (stroke.length >= MIN_POINTS) strokesRef.current.push(stroke);

    clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      const gesture = strokesRef.current;
      deactivateCanvas();
      if (gesture.length > 0) onGestureRef.current?.(gesture);
    }, STROKE_PAUSE_MS);
  }, [deactivateCanvas]);

  const onKeyDown = useCallback((e) => {
    if (e.key === "Escape" && activeRef.current) {
      deactivateCanvas();
    }
  }, [deactivateCanvas]);

  // Keep the canvas matched to the viewport while it is open.
  const onResize = useCallback(() => {
    if (!activeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    document.addEventListener("pointerdown", handleTap);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    const canvas = canvasRef.current;
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    return () => {
      document.removeEventListener("pointerdown", handleTap);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      clearTimeout(pauseTimerRef.current);
    };
  }, [handleTap, onKeyDown, onPointerDown, onPointerMove, onPointerUp, onResize]);

  return canvasRef;
}
