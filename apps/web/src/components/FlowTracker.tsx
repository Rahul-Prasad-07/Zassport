'use client';

import React, { useState } from 'react';

export interface FlowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'locked';
  icon: string;
}

interface FlowTrackerProps {
  steps: FlowStep[];
}

export function FlowTracker({ steps }: FlowTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedCount / steps.length) * 100;

  return (
    <div className="w-full">
      {/* Compact Header with Toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 group"
            title={isExpanded ? 'Hide progress' : 'Show progress'}
          >
            <svg
              className={`w-4 h-4 text-slate-400 group-hover:text-white transition-all duration-200 ${
                isExpanded ? 'rotate-0' : '-rotate-90'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">
              Progress
            </span>
          </button>
          <span className="text-xs font-semibold text-white">{completedCount}/{steps.length}</span>
          <div className="flex-1 w-24 h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-slate-500">{Math.round(progressPercentage)}%</span>
      </div>

      {/* Expandable Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Compact Steps - Desktop Horizontal */}
        <div className="hidden md:flex items-center justify-between gap-2 pt-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step Item */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Small Icon */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 transition-all duration-300 ${
                    step.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : step.status === 'current'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : step.status === 'pending'
                      ? 'bg-white/5 text-slate-400 border border-white/10'
                      : 'bg-white/5 text-slate-600 border border-white/5 opacity-50'
                  }`}
                >
                  {step.status === 'completed' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs">{step.icon}</span>
                  )}
                </div>

                {/* Step Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium truncate ${
                      step.status === 'completed'
                        ? 'text-emerald-400'
                        : step.status === 'current'
                        ? 'text-blue-400'
                        : step.status === 'pending'
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Connector Line (except last item) */}
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-white/10 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Compact Steps - Mobile Vertical */}
        <div className="md:hidden space-y-2 pt-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                step.status === 'current' ? 'bg-blue-500/5' : ''
              }`}
            >
              {/* Small Icon */}
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0 transition-all duration-300 ${
                  step.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : step.status === 'current'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : step.status === 'pending'
                    ? 'bg-white/5 text-slate-400 border border-white/10'
                    : 'bg-white/5 text-slate-600 border border-white/5 opacity-50'
                }`}
              >
                {step.status === 'completed' ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-[10px]">{step.icon}</span>
                )}
              </div>

              {/* Step Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-xs font-medium ${
                      step.status === 'completed'
                        ? 'text-emerald-400'
                        : step.status === 'current'
                        ? 'text-blue-400'
                        : step.status === 'pending'
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.status === 'completed' && (
                    <span className="text-[10px] text-emerald-400">✓</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
