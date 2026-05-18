"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  Button as RACButton,
  Disclosure as RACDisclosure,
  DisclosureGroup as RACDisclosureGroup,
  DisclosurePanel as RACDisclosurePanel,
  Heading as RACHeading,
  type DisclosureGroupProps as RACDisclosureGroupProps,
  type DisclosureProps as RACDisclosureProps,
} from "react-aria-components";
import { cn } from "../cn";

export interface AccordionProps extends Omit<RACDisclosureGroupProps, "className" | "children"> {
  className?: string;
  children?: React.ReactNode;
}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, children, allowsMultipleExpanded, ...props }, ref) => (
    <RACDisclosureGroup
      ref={ref}
      className={cn("motive-accordion", className)}
      allowsMultipleExpanded={allowsMultipleExpanded}
      {...props}
    >
      {children as React.ReactNode}
    </RACDisclosureGroup>
  ),
);
Accordion.displayName = "Accordion";

export interface AccordionItemProps extends Omit<RACDisclosureProps, "className" | "children"> {
  title: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ title, className, children, ...props }, ref) => (
    <RACDisclosure ref={ref} className={cn("motive-accordion-item", className)} {...props}>
      {({ isExpanded }) => (
        <>
          <RACHeading>
            <RACButton
              slot="trigger"
              className="motive-accordion-trigger"
              data-expanded={isExpanded || undefined}
            >
              <span className="min-w-0 flex-1">{title}</span>
              <ChevronDown
                aria-hidden="true"
                size={18}
                className="motive-accordion-icon"
              />
            </RACButton>
          </RACHeading>
          <AnimatePresence initial={false}>
            {isExpanded ? (
              <motion.div
                key="panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
                style={{ overflow: "hidden" }}
              >
                <RACDisclosurePanel className="motive-accordion-panel">
                  {children as React.ReactNode}
                </RACDisclosurePanel>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      )}
    </RACDisclosure>
  ),
);
AccordionItem.displayName = "AccordionItem";
