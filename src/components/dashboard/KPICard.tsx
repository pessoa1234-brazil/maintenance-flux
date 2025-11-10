import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: number;
  variant?: "primary" | "success" | "warning" | "destructive";
}

const variantStyles = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export const KPICard = ({ label, value, variant = "primary" }: KPICardProps) => {
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow">
      <h2 className="text-sm font-medium text-muted-foreground mb-2">{label}</h2>
      <p className={cn("text-4xl font-bold", variantStyles[variant])}>{value}</p>
    </div>
  );
};
