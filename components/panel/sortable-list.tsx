"use client";

import { useId, useState, useTransition } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action";
import { cn } from "@/lib/utils";

// Ekran okuyucu duyuruları (klavyeyle sıralama: Boşluk ile tut, oklarla taşı, Boşluk ile bırak).
const ACCESSIBILITY = {
  screenReaderInstructions: {
    draggable:
      "Taşımak için Boşluk tuşuna basın, ok tuşlarıyla yerini değiştirin, bırakmak için tekrar Boşluk'a, vazgeçmek için Escape'e basın.",
  },
  announcements: {
    onDragStart: () => "Öğe tutuldu.",
    onDragOver: () => "Öğe taşındı.",
    onDragEnd: () => "Öğe bırakıldı, yeni sıra kaydediliyor.",
    onDragCancel: () => "Taşıma iptal edildi.",
  },
};

function SortableItem({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled: boolean;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });
  const handle = disabled ? null : (
    <button
      type="button"
      aria-label="Sürükleyerek sırala"
      className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVerticalIcon className="size-4" />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 opacity-80 shadow-lg")}
    >
      {children(handle)}
    </div>
  );
}

/**
 * Sürükle-bırak sıralanabilir liste. Sıra hemen değişir, sunucuya kaydedilir;
 * kayıt başarısız olursa eski sıraya döner. Üst bileşen `key` ile sıfırlamalıdır.
 */
export function SortableList<T extends { id: string }>({
  items: initialItems,
  onReorder,
  disabled = false,
  layout = "list",
  className,
  children,
}: {
  items: T[];
  onReorder: (ids: string[]) => Promise<ActionResult<null>>;
  disabled?: boolean;
  layout?: "list" | "grid";
  className?: string;
  children: (item: T, handle: React.ReactNode) => React.ReactNode;
}) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const previous = items;
    const next = arrayMove(
      items,
      items.findIndex((i) => i.id === active.id),
      items.findIndex((i) => i.id === over.id),
    );
    setItems(next);
    startTransition(async () => {
      const result = await onReorder(next.map((i) => i.id));
      if (!result.ok) {
        setItems(previous);
        toast.error(result.error);
      }
    });
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={ACCESSIBILITY}
    >
      <SortableContext
        items={items}
        strategy={
          layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy
        }
        disabled={disabled}
      >
        <div className={className}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id} disabled={disabled}>
              {(handle) => children(item, handle)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
