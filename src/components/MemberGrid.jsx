import { MemberCard } from "./MemberCard";

export function MemberGrid({ members, selectedMemberId, onSelect }) {
  if (!members.length) {
    return <p className="text-slate-500">No members found.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          isSelected={member.id === selectedMemberId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
