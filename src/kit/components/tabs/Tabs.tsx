"use client";

import { useState, type KeyboardEvent } from 'react';
import { Markdown } from '../../markdown';
import type { tabsSchema } from './schema';
import type { z } from 'zod';

type TabsProps = z.infer<typeof tabsSchema>;

export function Tabs({ id, tabs }: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (nextIndex === undefined) return;

    event.preventDefault();
    setActiveIndex(nextIndex);
    document.getElementById(`${id}-tab-${nextIndex}`)?.focus();
  }

  return (
    <div className="my-5">
      <div aria-label="Content tabs" className="flex gap-1 border-b border-border" role="tablist">
        {tabs.map((tab, index) => (
          <button
            aria-controls={`${id}-panel`}
            aria-selected={activeIndex === index}
            className={`border-b-2 px-3 py-2 text-sm ${activeIndex === index ? 'border-accent font-semibold text-fg' : 'border-transparent text-muted hover:text-fg'}`}
            id={`${id}-tab-${index}`}
            key={tab.label}
            onClick={() => setActiveIndex(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            role="tab"
            tabIndex={activeIndex === index ? 0 : -1}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <section
        aria-labelledby={`${id}-tab-${activeIndex}`}
        className="bg-surface px-4 py-3 text-sm leading-6"
        id={`${id}-panel`}
        role="tabpanel"
        tabIndex={0}
      >
        <Markdown>{tabs[activeIndex].body}</Markdown>
      </section>
    </div>
  );
}