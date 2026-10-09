import * as React from "react";
import { cn } from "../lib/utils";
import { buttonVariants } from "./Button";
import { motion, AnimatePresence } from "framer-motion";

const AlertDialogContext = React.createContext(undefined);

const AlertDialog = ({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback((value) => {
    if (!isControlled) {
      setUncontrolledOpen(value);
    }
    if (onOpenChange) {
      const newValue = typeof value === "function" ? value(open) : value;
      onOpenChange(newValue);
    }
  }, [isControlled, onOpenChange, open]);

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

const AlertDialogTrigger = React.forwardRef(
  ({ children, asChild = false, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext);
    if (!context) {
      throw new Error("AlertDialogTrigger must be used within an AlertDialog");
    }

    const { setOpen } = context;

    const handleClick = (e) => {
      setOpen(true);

      if (props.onClick) {
        props.onClick(e);
      }
    };

    const { onClick, ...otherProps } = props;

    if (asChild) {
      return (
        <>
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              const element = child;
              return React.cloneElement(element, {
                ...element.props,
                ref,
                onClick: handleClick
              });
            }
            return child;
          })}
        </>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        {...otherProps}
      >
        {children}
      </button>
    );
  }
);
AlertDialogTrigger.displayName = "AlertDialogTrigger";

const AlertDialogPortal = ({ children }) => {
  return <>{children}</>;
};

const AlertDialogOverlay = React.forwardRef(
  ({ className, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext);
    if (!context) {
      throw new Error("AlertDialogOverlay must be used within an AlertDialog");
    }

    const { open } = context;

    return (
      <AnimatePresence>
        {open && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed inset-0 z-[1400] bg-black/60 backdrop-blur-md",
              className
            )}
            {...Object.keys(props).reduce((acc, key) => {
              if (key === 'onDrag' || key === 'onAnimationStart' || key === 'onTransitionEnd') {
                return acc;
              }
              acc[key] = props[key];
              return acc;
            }, {})}
          />
        )}
      </AnimatePresence>
    );
  }
);
AlertDialogOverlay.displayName = "AlertDialogOverlay";

const AlertDialogContent = React.forwardRef(
  ({ className, children, closeOnOutsideClick = true, overlayClassName, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext);
    if (!context) {
      throw new Error("AlertDialogContent must be used within an AlertDialog");
    }

    const { open, setOpen } = context;

    const contentRef = React.useRef(null);
    React.useEffect(() => {
      if (!open || !closeOnOutsideClick) return;

      const handleClickOutside = (event) => {
        if (contentRef.current && !contentRef.current.contains(event.target)) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [closeOnOutsideClick, open, setOpen]);

    return (
      <AnimatePresence>
        {open && (
          <AlertDialogPortal>
            <AlertDialogOverlay className={overlayClassName} />
            <motion.div
              ref={(node) => {
                if (typeof ref === "function") {
                  ref(node);
                } else if (ref) {
                  ref.current = node;
                }
                contentRef.current = node;
              }}
              className={cn(
                "fixed left-[50%] top-[50%] z-[1401] grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg rounded-lg",
                className
              )}
              initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 400,
                opacity: { duration: 0.2 }
              }}
              {...Object.keys(props).reduce((acc, key) => {
                if (key === 'onDrag' || key === 'onAnimationStart' || key === 'onTransitionEnd') {
                  return acc;
                }
                acc[key] = props[key];
                return acc;
              }, {})}
            >
              {children}
            </motion.div>
          </AlertDialogPortal>
        )}
      </AnimatePresence>
    );
  }
);
AlertDialogContent.displayName = "AlertDialogContent";

const AlertDialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold text-gray-900", className)}
      {...props}
    />
  )
);
AlertDialogTitle.displayName = "AlertDialogTitle";

const AlertDialogDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-600", className)}
      {...props}
    />
  )
);
AlertDialogDescription.displayName = "AlertDialogDescription";

const AlertDialogAction = React.forwardRef(
  ({ className, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext);
    if (!context) {
      throw new Error("AlertDialogAction must be used within an AlertDialog");
    }

    const { setOpen } = context;

    const handleClick = (e) => {
      setOpen(false);

      if (props.onClick) {
        props.onClick(e);
      }
    };

    const { onClick, ...otherProps } = props;

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant: "default" }), "px-4 py-2 rounded-md font-medium", className)}
        onClick={handleClick}
        {...otherProps}
      />
    );
  }
);
AlertDialogAction.displayName = "AlertDialogAction";

const AlertDialogCancel = React.forwardRef(
  ({ className, ...props }, ref) => {
    const context = React.useContext(AlertDialogContext);
    if (!context) {
      throw new Error("AlertDialogCancel must be used within an AlertDialog");
    }

    const { setOpen } = context;

    const handleClick = (e) => {
      setOpen(false);

      if (props.onClick) {
        props.onClick(e);
      }
    };

    const { onClick, ...otherProps } = props;

    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "mt-2 sm:mt-0 px-4 py-2 rounded-md font-medium",
          className
        )}
        onClick={handleClick}
        {...otherProps}
      />
    );
  }
);
AlertDialogCancel.displayName = "AlertDialogCancel";

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
