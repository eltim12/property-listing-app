import {
  Building2,
  Flame,
  Forklift,
  ParkingCircle,
  Shield,
  Truck,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  ParkingCircle,
  Zap,
  Truck,
  Shield,
  Wifi,
  Forklift,
  Building2,
  Flame,
};

export function AmenityIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = iconMap[name] || Building2;
  return <Icon className={className || "h-6 w-6"} aria-hidden />;
}
