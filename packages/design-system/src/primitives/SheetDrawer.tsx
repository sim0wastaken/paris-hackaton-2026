"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  Dialog as RACDialog,
  DialogTrigger as RACDialogTrigger,
  Heading as RACHeading,
  Modal as RACModal,
  ModalOverlay as RACModalOverlay,
  type ModalOverlayProps as RACModalOverlayProps,
} from "react-aria-components";
import { cn } from "../cn";

export const SheetDrawerTrigger = RACDialogTrigger;

export type SheetPlacement = "top" | "bottom" | "left" | "right";

export interface SheetDrawerProps
  extends Omit<RACModalOverlayProps, "className" | "children"> {
  className?: string;
  overlayClassName?: string;
  children?: React.ReactNode | ((args: { close: () => void }) => React.ReactNode);
  placement?: SheetPlacement;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  hideClose?: boolean;
}

/**
 * SheetDrawer — top/bottom/left/right slide-in sheet, built on RAC Modal.
 * Glassmorphic surface, spring entry, swipe-to-close on touch.
 */
export const SheetDrawer = React.forwardRef<HTMLDivElement, SheetDrawerProps>(
  (
    {
      className,
      overlayClassName,
      children,
      placement = "top",
      title,
      description,
      footer,
      hideClose,
      isDismissable = true,
      ...props
    },
    ref,
  ) => {
    const sheetRef = React.useRef<HTMLDivElement | null>(null);
    const dragStartRef = React.useRef<{ y: number; x: number } | null>(null);
    const draggingRef = React.useRef(false);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "touch") return;
      dragStartRef.current = { y: e.clientY, x: e.clientX };
      draggingRef.current = true;
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || !dragStartRef.current || !sheetRef.current) return;
      const dy = e.clientY - dragStartRef.current.y;
      const dx = e.clientX - dragStartRef.current.x;
      const dragVal =
        placement === "top" ? -Math.max(-dy, 0)
        : placement === "bottom" ? Math.max(dy, 0)
        : placement === "left" ? -Math.max(-dx, 0)
        : Math.max(dx, 0);
      sheetRef.current.style.setProperty("--sheet-drag", `${dragVal}px`);
    };

    const handlePointerUp = (
      e: React.PointerEvent<HTMLDivElement>,
      close: () => void,
    ) => {
      if (!draggingRef.current || !dragStartRef.current || !sheetRef.current) return;
      draggingRef.current = false;
      const sheet = sheetRef.current;
      const rect = sheet.getBoundingClientRect();
      const dy = e.clientY - dragStartRef.current.y;
      const dx = e.clientX - dragStartRef.current.x;
      const threshold =
        placement === "top" || placement === "bottom" ? rect.height * 0.4 : rect.width * 0.4;
      const shouldClose =
        (placement === "top" && -dy > threshold) ||
        (placement === "bottom" && dy > threshold) ||
        (placement === "left" && -dx > threshold) ||
        (placement === "right" && dx > threshold);
      sheet.style.setProperty("--sheet-drag", "0px");
      dragStartRef.current = null;
      if (shouldClose) close();
    };

    return (
      <RACModalOverlay
        className={cn("motive-overlay motive-sheet-overlay", overlayClassName)}
        data-placement={placement}
        isDismissable={isDismissable}
        {...props}
      >
        <RACModal
          className={cn("motive-sheet", `motive-sheet-${placement}`, className)}
        >
          <RACDialog ref={ref} className="outline-none h-full">
            {({ close }) => (
              <div
                ref={sheetRef}
                className="motive-sheet-inner"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={(e) => handlePointerUp(e, close)}
                onPointerCancel={() => {
                  draggingRef.current = false;
                  dragStartRef.current = null;
                  if (sheetRef.current) sheetRef.current.style.setProperty("--sheet-drag", "0px");
                }}
              >
                {(placement === "top" || placement === "bottom") && (
                  <div className="motive-sheet-grabber" aria-hidden="true" />
                )}
                {(title || !hideClose) && (
                  <div className="motive-sheet-header">
                    <div className="flex flex-col gap-1 min-w-0">
                      {title ? (
                        <RACHeading slot="title" className="t-h4 truncate">
                          {title}
                        </RACHeading>
                      ) : null}
                      {description ? <p className="t-small">{description}</p> : null}
                    </div>
                    {!hideClose && (
                      <button
                        aria-label="Close"
                        className="motive-modal-close"
                        onClick={close}
                        type="button"
                      >
                        <X aria-hidden="true" size={16} />
                      </button>
                    )}
                  </div>
                )}
                <div className="motive-sheet-body">
                  {typeof children === "function"
                    ? (children as (args: { close: () => void }) => React.ReactNode)({ close })
                    : children}
                </div>
                {footer ? <div className="motive-sheet-footer">{footer}</div> : null}
              </div>
            )}
          </RACDialog>
        </RACModal>
      </RACModalOverlay>
    );
  },
);
SheetDrawer.displayName = "SheetDrawer";
