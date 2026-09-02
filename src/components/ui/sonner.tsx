import { Toaster as Sonner } from "sonner";

import { useTheme } from "@/lib/theme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      dir="rtl"
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-2xl border border-gold/25 bg-card/95 text-card-foreground shadow-gold backdrop-blur font-[inherit]",
          title: "font-bold text-sm",
          description: "text-muted-foreground text-xs leading-6",
          actionButton: "rounded-lg bg-gold-gradient text-navy font-semibold",
          cancelButton: "rounded-lg bg-muted text-muted-foreground",
          icon: "text-gold",
          success: "border-success/40 [&_[data-icon]]:text-success",
          error: "border-destructive/40 [&_[data-icon]]:text-destructive",
          warning: "border-warning/40 [&_[data-icon]]:text-warning",
          info: "border-gold/40 [&_[data-icon]]:text-gold",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
