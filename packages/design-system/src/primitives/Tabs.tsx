"use client";

import * as React from "react";
import { motion, LayoutGroup } from "motion/react";
import {
  Tabs as RACTabs,
  TabList as RACTabList,
  Tab as RACTab,
  TabPanel as RACTabPanel,
  type TabsProps as RACTabsProps,
  type TabListProps as RACTabListProps,
  type TabProps as RACTabProps,
  type TabPanelProps as RACTabPanelProps,
} from "react-aria-components";
import { cn } from "../cn";

const LayoutGroupCtx = React.createContext<string>("motive-tabs");

export interface TabsProps extends Omit<RACTabsProps, "className" | "children"> {
  className?: string;
  children?: React.ReactNode;
  layoutId?: string;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, children, layoutId, ...props }, ref) => {
    const id = React.useId();
    const groupId = layoutId ?? `motive-tabs-${id}`;
    return (
      <LayoutGroup id={groupId}>
        <LayoutGroupCtx.Provider value={groupId}>
          <RACTabs ref={ref} className={cn("motive-tabs", className)} {...props}>
            {children as React.ReactNode}
          </RACTabs>
        </LayoutGroupCtx.Provider>
      </LayoutGroup>
    );
  },
);
Tabs.displayName = "Tabs";

export interface TabListProps<T extends object>
  extends Omit<RACTabListProps<T>, "className" | "children"> {
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
}

export function TabList<T extends object>({
  className,
  children,
  ...props
}: TabListProps<T>) {
  return (
    <RACTabList className={cn("motive-tab-list", className)} {...props}>
      {children as React.ReactNode}
    </RACTabList>
  );
}

export interface TabProps extends Omit<RACTabProps, "className" | "children"> {
  className?: string;
  children?: React.ReactNode;
}

export const Tab = React.forwardRef<HTMLDivElement, TabProps>(
  ({ className, children, ...props }, ref) => {
    const groupId = React.useContext(LayoutGroupCtx);
    return (
      <RACTab ref={ref} className={cn("motive-tab", className)} {...props}>
        {({ isSelected }) => (
          <>
            {isSelected ? (
              <motion.span
                aria-hidden="true"
                className="motive-tab-indicator"
                layoutId={`${groupId}-indicator`}
                transition={{ type: "spring", stiffness: 460, damping: 36, mass: 0.7 }}
              />
            ) : null}
            <span className="relative z-10 flex items-center gap-2">{children as React.ReactNode}</span>
          </>
        )}
      </RACTab>
    );
  },
);
Tab.displayName = "Tab";

export interface TabPanelProps extends Omit<RACTabPanelProps, "className" | "children"> {
  className?: string;
  children?: React.ReactNode;
}

export const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(
  ({ className, children, ...props }, ref) => (
    <RACTabPanel ref={ref} className={cn("motive-tab-panel", className)} {...props}>
      {children as React.ReactNode}
    </RACTabPanel>
  ),
);
TabPanel.displayName = "TabPanel";
