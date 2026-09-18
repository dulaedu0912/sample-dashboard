import { useState } from "react";

import { useMembers } from "./hooks/useMembers";
import { useAvailabilityCheck } from "./hooks/useAvailabilityCheck";

import { MemberGrid } from "./components/MemberGrid";
import { StatusResult } from "./components/StatusResult";
import { ErrorMessage } from "./components/ErrorMessage";

export default function App() {
  const { members, loading, error, refetch } = useMembers();
  const {
    result,
    loading: checking,
    error: checkError,
    check,
    reset,
  } = useAvailabilityCheck();

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [date, setDate] = useState("");

  const selectedMember = members.find(
    (member) => member.id === selectedMemberId
  );

  const canSubmit = Boolean(selectedMemberId && date && !checking);

  function handleMemberSelect(id) {
    setSelectedMemberId(id);
    reset();
  }

  function handleDateChange(event) {
    setDate(event.target.value);
    reset();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    await check(selectedMemberId, date);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <header>
        <h1 className="mb-2 text-3xl font-bold text-slate-900">
          Member Availability Dashboard
        </h1>
        <p className="mt-0 text-slate-600">
          Select a member and date to check availability.
        </p>
      </header>

      <section aria-label="Members">
        <h2 className="mt-8 text-xl font-semibold text-slate-900">Members</h2>

        {loading && <p role="status" className="mt-4">Loading members...</p>}

        {error && (
          <div className="mt-4">
            <ErrorMessage message={error} onRetry={refetch} />
          </div>
        )}

        {!loading && !error && (
          <div className="mt-4">
            <MemberGrid
              members={members}
              selectedMemberId={selectedMemberId}
              onSelect={handleMemberSelect}
            />
          </div>
        )}
      </section>

      <section aria-label="Availability check">
        <h2 className="mt-8 text-xl font-semibold text-slate-900">
          Check Availability
        </h2>

        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-wrap items-end gap-4 rounded-xl border border-slate-300 bg-white p-4"
        >
          <div className="flex min-w-55 flex-col gap-1.5">
            <label
              htmlFor="member-summary"
              className="text-sm font-semibold text-slate-900"
            >
              Selected Member
            </label>
            <input
              id="member-summary"
              type="text"
              disabled
              value={
                selectedMember
                  ? `${selectedMember.name} (${selectedMember.id})`
                  : "No member selected"
              }
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2.5 text-slate-600 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex min-w-55 flex-col gap-1.5">
            <label
              htmlFor="date"
              className="text-sm font-semibold text-slate-900"
            >
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={handleDateChange}
              required
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checking ? "Checking..." : "Check availability"}
          </button>
        </form>

        <div className="mt-4">
          <StatusResult
            result={result}
            loading={checking}
            error={checkError}
            fallbackDate={date}
          />
        </div>
      </section>
    </main>
  );
}
