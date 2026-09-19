import { Card, CardContent } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { cn } from "../lib/utils.js";

export function MemberCard({ member, isSelected, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(member.id)}
      className={cn(
        "rounded-xl text-left transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
        isSelected && "ring-2 ring-slate-900 ring-offset-2"
      )}
    >
      <Card
        className={cn(
          "h-full transition-colors hover:border-slate-400",
          isSelected ? "border-slate-900" : "border-slate-200"
        )}
      >
        <CardContent className="flex flex-col gap-2 p-4">
          <Badge variant="secondary" className="w-fit">
            {member.role}
          </Badge>
          <strong className="text-base text-slate-900">{member.name}</strong>
          <span className="text-xs text-slate-500">{member.id}</span>
        </CardContent>
      </Card>
    </button>
  );
}
