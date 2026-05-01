import { useRef, useState, useCallback, useEffect, useMemo, memo } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { pressScale } from '../../lib/transitions';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

const CLICK_THRESHOLD = 3;
const DEAD_ZONE = 32;
const MAX_CURSOR_RANGE = 200;
const MAX_STRETCH = 8;

// --- Helper Functions ---

function decimalsForStep(step: number): number {
  const s = step.toString();
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

function roundValue(value: number, step: number): number {
  const d = decimalsForStep(step);
  return parseFloat(value.toFixed(d));
}

function snapToDecile(value: number, min: number, max: number): number {
  const range = max - min;
  const norm = (value - min) / range;
  const decile = Math.round(norm * 10) / 10;
  const snapped = min + decile * range;
  if (Math.abs(norm - decile) < 0.03) return snapped;
  return value;
}

// --- Sub-components ---

const HashMarks = memo(({ min, max, step }: { min: number; max: number; step: number }) => {
  const discreteSteps = (max - min) / step;
  const marks = useMemo(() => {
    if (discreteSteps <= 10) {
      return Array.from({ length: Math.floor(discreteSteps) - 1 }, (_, i) => {
        const pct = ((i + 1) * step) / (max - min) * 100;
        return <div key={i} className="dialkit-slider-hashmark" style={{ left: `${pct}%` }} />;
      });
    }
    return Array.from({ length: 9 }, (_, i) => {
      const pct = (i + 1) * 10;
      return <div key={i} className="dialkit-slider-hashmark" style={{ left: `${pct}%` }} />;
    });
  }, [discreteSteps, min, max, step]);

  return <div className="dialkit-slider-hashmarks">{marks}</div>;
});

HashMarks.displayName = 'HashMarks';

// --- Custom Hooks ---

function useSliderInteraction({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const isClickRef = useRef(true);
  const animRef = useRef<any>(null);
  const measurementsRef = useRef<{ rect: DOMRect; scale: number } | null>(null);

  const percentage = ((value - min) / (max - min)) * 100;
  const fillPercent = useMotionValue(percentage);
  const rubberStretchPx = useMotionValue(0);

  // Sync motion value with prop
  useEffect(() => {
    if (!isInteracting && !animRef.current) {
      fillPercent.jump(percentage);
    }
  }, [percentage, isInteracting, fillPercent]);

  const getPositionValue = useCallback((clientX: number) => {
    if (!measurementsRef.current) return value;
    const { rect, scale } = measurementsRef.current;
    const screenX = clientX - rect.left;
    const sceneX = screenX / scale;
    const nativeWidth = wrapperRef.current?.offsetWidth || rect.width;
    const percent = Math.max(0, Math.min(1, sceneX / nativeWidth));
    return min + percent * (max - min);
  }, [min, max, value]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    isClickRef.current = true;
    setIsInteracting(true);

    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      measurementsRef.current = {
        rect,
        scale: rect.width / wrapperRef.current.offsetWidth,
      };
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerDownPos.current) return;

    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (isClickRef.current && distance > CLICK_THRESHOLD) {
      isClickRef.current = false;
      setIsDragging(true);
    }

    if (!isClickRef.current) {
      const measurements = measurementsRef.current;
      if (measurements) {
        const { rect } = measurements;
        if (e.clientX < rect.left) {
          const overflow = Math.max(0, rect.left - e.clientX - DEAD_ZONE);
          rubberStretchPx.jump(-MAX_STRETCH * Math.sqrt(Math.min(overflow / MAX_CURSOR_RANGE, 1.0)));
        } else if (e.clientX > rect.right) {
          const overflow = Math.max(0, e.clientX - rect.right - DEAD_ZONE);
          rubberStretchPx.jump(MAX_STRETCH * Math.sqrt(Math.min(overflow / MAX_CURSOR_RANGE, 1.0)));
        } else {
          rubberStretchPx.jump(0);
        }
      }

      const newValue = getPositionValue(e.clientX);
      const newPct = ((newValue - min) / (max - min)) * 100;
      
      if (animRef.current) {
        animRef.current.stop();
        animRef.current = null;
      }
      fillPercent.jump(newPct);
      onChange(roundValue(newValue, step));
    }
  }, [min, max, step, onChange, fillPercent, rubberStretchPx, getPositionValue]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!pointerDownPos.current) return;

    if (isClickRef.current) {
      const rawValue = getPositionValue(e.clientX);
      const discreteSteps = (max - min) / step;
      const snappedValue = discreteSteps <= 10
        ? Math.max(min, Math.min(max, min + Math.round((rawValue - min) / step) * step))
        : snapToDecile(rawValue, min, max);

      const newPct = ((snappedValue - min) / (max - min)) * 100;

      if (animRef.current) animRef.current.stop();
      animRef.current = animate(fillPercent, newPct, {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        mass: 0.8,
        onComplete: () => { animRef.current = null; },
      });
      onChange(roundValue(snappedValue, step));
    }

    if (rubberStretchPx.get() !== 0) {
      animate(rubberStretchPx, 0, { type: 'spring', visualDuration: 0.35, bounce: 0.15 });
    }

    setIsInteracting(false);
    setIsDragging(false);
    pointerDownPos.current = null;
  }, [min, max, step, onChange, fillPercent, rubberStretchPx, getPositionValue]);

  return {
    wrapperRef,
    isInteracting,
    isDragging,
    isHovered,
    fillPercent,
    rubberStretchPx,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
    }
  };
}

function useEditableValue({
  min,
  max,
  step,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isHovered && !showInput && !isEditable) {
      hoverTimeoutRef.current = setTimeout(() => setIsEditable(true), 800);
    } else if (!isHovered && !showInput) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setIsEditable(false);
    }
    return () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); };
  }, [isHovered, showInput, isEditable]);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showInput]);

  const submit = useCallback(() => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      onChange(roundValue(Math.max(min, Math.min(max, parsed)), step));
    }
    setShowInput(false);
    setIsHovered(false);
    setIsEditable(false);
  }, [inputValue, min, max, step, onChange]);

  return {
    showInput,
    isEditable,
    inputValue,
    inputRef,
    setInputValue,
    setShowInput,
    setIsHovered,
    inputHandlers: {
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') submit();
        else if (e.key === 'Escape') setShowInput(false);
      },
      onBlur: submit,
    }
  };
}

// --- Main Component ---

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  unit,
  className,
}: SliderProps) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const valueSpanRef = useRef<HTMLSpanElement>(null);

  const {
    wrapperRef,
    isInteracting,
    isDragging,
    isHovered,
    fillPercent,
    rubberStretchPx,
    handlers
  } = useSliderInteraction({ value, min, max, step, onChange });

  const {
    showInput,
    isEditable,
    inputValue,
    inputRef,
    setInputValue,
    setShowInput,
    setIsHovered: setIsValueHovered,
    inputHandlers
  } = useEditableValue({ min, max, step, onChange });

  const isActive = isInteracting || isHovered;
  const percentage = ((value - min) / (max - min)) * 100;

  const fillWidth = useTransform(fillPercent, (pct) => `${pct}%`);
  const handleLeft = useTransform(fillPercent, (pct) => `max(5px, calc(${pct}% - 9px))`);
  const rubberBandWidth = useTransform(rubberStretchPx, (stretch) => `calc(100% + ${Math.abs(stretch)}px)`);
  const rubberBandX = useTransform(rubberStretchPx, (stretch) => (stretch < 0 ? stretch : 0));

  const thresholds = useMemo(() => {
    const trackWidth = wrapperRef.current?.offsetWidth || 280;
    const labelWidth = labelRef.current?.offsetWidth || 0;
    const valueWidth = valueSpanRef.current?.offsetWidth || 0;
    const buffer = 8;
    return {
      left: ((10 + labelWidth + buffer) / trackWidth) * 100,
      right: ((trackWidth - 10 - valueWidth - buffer) / trackWidth) * 100
    };
  }, [isActive]); // Recalculate only when interaction state changes (measurements stable then)

  const valueDodge = percentage < thresholds.left || percentage > thresholds.right;
  const handleOpacity = !isActive ? 0 : valueDodge ? 0.1 : isDragging ? 0.9 : 0.5;

  return (
    <div ref={wrapperRef} className={`dialkit-slider-wrapper ${className || ''}`}>
      <motion.div
        className={`dialkit-slider ${isActive ? 'dialkit-slider-active' : ''}`}
        {...handlers}
        style={{ 
          width: rubberBandWidth, 
          x: rubberBandX,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <HashMarks min={min} max={max} step={step} />

        <motion.div className="dialkit-slider-fill" style={{ width: fillWidth }} />

        <motion.div
          className="dialkit-slider-handle"
          style={{ left: handleLeft, y: '-50%' }}
          animate={{
            opacity: handleOpacity,
            scaleX: isActive ? 1 : 0.25,
            scaleY: isActive && valueDodge ? 0.75 : 1,
          }}
          transition={{
            scaleX: { type: 'spring', visualDuration: 0.25, bounce: 0.15 },
            scaleY: { type: 'spring', visualDuration: 0.2, bounce: 0.1 },
            opacity: { duration: 0.15 },
          }}
        />

        <span ref={labelRef} className="dialkit-slider-label" style={{ pointerEvents: 'none' }}>
          {label}
        </span>

        {showInput ? (
          <input
            ref={inputRef}
            type="text"
            className="dialkit-slider-input"
            value={inputValue}
            {...inputHandlers}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <motion.span
            {...pressScale}
            ref={valueSpanRef}
            className={`dialkit-slider-value ${isEditable ? 'dialkit-slider-value-editable' : ''}`}
            onMouseEnter={() => setIsValueHovered(true)}
            onMouseLeave={() => setIsValueHovered(false)}
            onClick={(e) => {
              if (isEditable) {
                e.stopPropagation();
                setShowInput(true);
                setInputValue(value.toFixed(decimalsForStep(step)));
              }
            }}
            onMouseDown={(e) => isEditable && e.stopPropagation()}
            style={{ 
              cursor: isEditable ? 'grabbing' : 'default',
              y: 'calc(-50% + 0.5px)'
            }}
          >
            {value.toFixed(decimalsForStep(step))}{unit ?? ''}
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}
