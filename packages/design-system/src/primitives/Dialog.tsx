"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  Dialog as RACDialog,
  DialogTrigger as RACDialogTrigger,
  Heading as RACHeading,
  Modal as RACModal,
  ModalOverlay as RACModalOverlay,
  type DialogProps as RACDialogProps,
  type ModalOverlayProps as RACModalOverlayProps,
} from "react-aria-components";
import { cn } from "../cn";

export const DialogTrigger = RACDialogTrigger;

export interface DialogProps
  extends Omit<RACModalOverlayProps, "className" | "children"> {
  className?: string;
  overlayClassName?: string;
  children?: React.ReactNode;
  /** When provided, renders a Heading + close button in a standard header row. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  /** Hide the default close (✕) control. */
  hideClose?: boolean;
  /** Forwarded to <RACDialog role>. */
  role?: RACDialogProps["role"];
}

/**
 * Dialog — React Aria Modal + ModalOverlay with Motive's glassmorphism overlay,
 * spring entry/exit, and an optional standard header. Use as:
 *
 *   <DialogTrigger>
 *     <Button>Open</Button>
 *     <Dialog title="Confirm action">…body…</Dialog>
 *   </DialogTrigger>
 */
export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  (
    {
      className,
      overlayClassName,
      children,
      title,
      description,
      footer,
      hideClose,
      role = "dialog",
      isDismissable = true,
      ...props
    },
    ref,
  ) => (
    <RACModalOverlay
      className={cn("motive-overlay flex items-center justify-center px-6", overlayClassName)}
      isDismissable={isDismissable}
      {...props}
    >
      <RACModal className={cn("motive-modal", className)}>
        <RACDialog ref={ref} role={role} className="outline-none">
          {({ close }) => (
            <>
              {(title || !hideClose) && (
                <div className="motive-modal-header">
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
              <div className="motive-modal-body">
                {typeof children === "function" ? (children as (args: { close: () => void }) => React.ReactNode)({ close }) : children}
              </div>
              {footer ? <div className="motive-modal-footer">{footer}</div> : null}
            </>
          )}
        </RACDialog>
      </RACModal>
    </RACModalOverlay>
  ),
);
Dialog.displayName = "Dialog";
