export function MemberCard({ member, isSelected, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(member.id)}
      className={[
        "flex flex-col gap-1.5 rounded-xl border bg-white p-4 text-left transition",
        "cursor-pointer hover:border-blue-300",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
        isSelected
          ? "border-blue-600 shadow-[0_0_0_2px_rgba(37,99,235,0.2)]"
          : "border-slate-300",
      ].join(" ")}
    >
      <span className="w-fit rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
        {member.role}
      </span>
      <strong className="text-base text-slate-900">{member.name}</strong>
      <span className="text-sm text-slate-500">{member.id}</span>
    </button>
  );
}
