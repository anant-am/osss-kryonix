import React, { useState } from 'react';
import { Plus, Mic, ArrowUp, Sparkles, Terminal } from 'lucide-react';

export interface RadiantPromptInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  suggestions?: string[];
}

export function RadiantPromptInput({
  placeholder = 'Ask CRISP Kernel Copilot or simulate workload...',
  value: propValue,
  onChange: propOnChange,
  onSubmit,
  className = '',
  disabled = false,
  suggestions = [
    'Why does Stock Linux (B0) stall on mutex_lock?',
    'Simulate 16 threads under 90% memory.high overage',
    'Explain Invariant P2 (Credit Conservation)',
    'Run Workload B (Synthetic Convoy) live',
  ],
}: RadiantPromptInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const isControlled = propValue !== undefined;
  const value = isControlled ? propValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    propOnChange?.(e.target.value);
  };

  const handleSubmit = (overrideVal?: string) => {
    const valToSubmit = overrideVal ?? value;
    if (valToSubmit && !disabled) {
      onSubmit?.(valToSubmit);
      if (!isControlled) setInternalValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`relative w-full max-w-3xl mx-auto space-y-2.5 ${className}`}>
      {/* Dynamic kinetic gradient border styles */}
      <style>{`
        @property --rotation {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }
        
        @keyframes rotate-gradient {
          to {
            --rotation: 360deg;
          }
        }

        .radiant-input-wrapper {
          --border-size: 2px;
          --gradient: conic-gradient(
            from var(--rotation) 
            at 50% 50% in oklab, 
            #00f0ff 20%, 
            #ffb347 40%, 
            #ff4500 60%, 
            #10b981 80%, 
            #00f0ff 100%
          );
          animation: rotate-gradient 4.5s infinite linear;
        }

        .radiant-input-wrapper::before {
          content: '';
          position: absolute;
          inset: calc(var(--border-size) * -1);
          border-radius: inherit;
          background: var(--gradient);
          z-index: -1;
          filter: blur(10px);
          opacity: 0.55;
        }

        .radiant-input-border {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: var(--border-size);
          background: var(--gradient);
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>

      <div className="radiant-input-wrapper relative rounded-2xl bg-dark-900/95 backdrop-blur-xl group transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]">
        {/* Animated Gradient Border */}
        <div className="radiant-input-border rounded-2xl" />

        {/* Inner Content */}
        <div className="relative z-10 flex items-center gap-2 p-1.5 pl-3.5 pr-2 h-13 md:h-14">
          {/* Prefix Icon */}
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-crisp-cyan/10 border border-crisp-cyan/30 text-crisp-cyan shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-400 text-xs md:text-sm font-light tracking-wide h-full w-full min-w-0"
          />

          {/* Right Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Terminal syntax"
              title="Linux 6.6 Kernel Syntax"
            >
              <Terminal className="w-4 h-4" />
            </button>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!value || disabled}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                value
                  ? 'bg-gradient-to-r from-crisp-cyan to-crisp-blue text-white hover:scale-105 active:scale-95 shadow-md shadow-crisp-cyan/25'
                  : 'bg-dark-800 text-slate-500 cursor-not-allowed opacity-50'
              }`}
              aria-label="Execute prompt"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Suggested prompts chips */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-1">Suggested:</span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (!isControlled) setInternalValue(s);
                propOnChange?.(s);
                handleSubmit(s);
              }}
              className="text-[11px] font-mono text-slate-400 hover:text-crisp-cyan bg-dark-900/80 hover:bg-dark-800 border border-white/5 hover:border-crisp-cyan/30 px-2.5 py-1 rounded-full transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default RadiantPromptInput;
