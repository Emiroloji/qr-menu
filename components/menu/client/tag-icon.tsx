import {
  BadgeCheckIcon,
  LeafIcon,
  SproutIcon,
  WheatOffIcon,
} from "lucide-react";

const ICONS: Record<string, typeof LeafIcon> = {
  vegan: LeafIcon,
  vegetarian: SproutIcon,
  gluten_free: WheatOffIcon,
  halal: BadgeCheckIcon,
};

/** Diyet etiketi ikonu; metin her zaman yanında yazılır (KURALLAR 10). */
export function TagIcon({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const Icon = ICONS[code] ?? BadgeCheckIcon;
  return <Icon className={className} aria-hidden />;
}
