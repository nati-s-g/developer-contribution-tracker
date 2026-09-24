"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("flex h-full w-full flex-col", className)}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "inline-flex items-center text-muted-foreground select-none",
  {
    variants: {
      variant: {
        default:
          "h-[35px] min-h-[35px] w-full justify-start rounded-none border-b border-[var(--border)] bg-[var(--bg-editor)] p-0 overflow-x-auto",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[35px] shrink-0 cursor-pointer items-center justify-center gap-1.5 border-t border-r border-[var(--border)] border-t-transparent px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors select-none",
        "bg-[var(--bg-tab)] text-[var(--fg-muted)] hover:bg-[#323233] hover:text-[var(--fg)]",
        "data-active:border-t-[var(--accent)] data-active:bg-[var(--bg-editor)] data-active:text-[var(--fg-strong)]",
        "focus-visible:z-10 focus-visible:outline-1 focus-visible:outline-[var(--focus)]",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 overflow-y-auto outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
