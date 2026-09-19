import { useState } from "react";
import { Search } from "lucide-react";
import { useMembers } from "./hooks/useMembers";
import { useAvailabilityCheck } from "./hooks/useAvailabilityCheck";
import { MemberGrid } from "./components/MemberGrid";
import { StatusResult } from "./components/StatusResult";
import { ErrorMessage } from "./components/ErrorMessage";
import { Button } from "./components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card.jsx";
import { Input } from "./components/ui/input.jsx";
import { Label } from "./components/ui/label.jsx";
import { Skeleton } from "./components/ui/skeleton.jsx";

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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Member Availability Dashboard
        </h1>
        <p className="mt-1 text-slate-600">
          Select a member and date to check availability.
        </p>
      </header>

      <section aria-label="Members">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Members</h2>

        {loading && (
          <div
            role="status"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        )}

        {error && !loading && (
          <ErrorMessage message={error} onRetry={refetch} />
        )}

        {!loading && !error && (
          <MemberGrid
            members={members}
            selectedMemberId={selectedMemberId}
            onSelect={handleMemberSelect}
          />
        )}
      </section>

      <section aria-label="Availability check" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Check Availability</CardTitle>
            <CardDescription>
              Pick a member from the grid, choose a date, then run the
              real-time check against the backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 md:flex-row md:items-end"
            >
              <div className="grid flex-1 gap-1.5">
                <Label htmlFor="member-summary">Selected Member</Label>
                <Input
                  id="member-summary"
                  type="text"
                  disabled
                  value={
                    selectedMember
                      ? `${selectedMember.name} (${selectedMember.id})`
                      : "No member selected"
                  }
                />
              </div>

              <div className="grid flex-1 gap-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  required
                />
              </div>

              <Button type="submit" disabled={!canSubmit} className="md:w-auto">
                {checking ? (
                  "Checking..."
                ) : (
                  <>
                    <Search aria-hidden="true" />
                    Check availability
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4">
              <StatusResult
                result={result}
                loading={checking}
                error={checkError}
                fallbackDate={date}
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
