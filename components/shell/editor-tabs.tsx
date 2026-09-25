"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface EditorTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface EditorTabsProps {
  tabs: EditorTabItem[];
  defaultTab?: string;
  className?: string;
}

export function EditorTabs({ tabs, defaultTab, className }: EditorTabsProps) {
  const initialTab = defaultTab ?? tabs[0]?.id;
  const [activeTab, setActiveTab] = React.useState<string>(initialTab);

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => {
        if (typeof val === "string") {
          setActiveTab(val);
        }
      }}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden font-sans",
        className
      )}
    >
      {/* Tab bar header */}
      <TabsList
        aria-label="Editor Panels"
        className="h-[35px] min-h-[35px] w-full [scrollbar-width:none] justify-start overflow-x-auto border-b border-[var(--border)] bg-[var(--bg-editor)] p-0 font-sans [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex items-center gap-1.5"
          >
            {tab.icon && (
              <span className="shrink-0 text-[var(--fg-muted)]">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Tab content panels - open document look, starts top-left */}
      <div className="relative flex-1 overflow-y-auto bg-[var(--bg-editor)]">
        {tabs.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="h-full w-full p-4 md:p-8"
          >
            <div className="mx-auto w-full max-w-5xl text-left">
              {tab.content}
            </div>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
