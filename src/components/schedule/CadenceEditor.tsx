import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EventCadence, FrequencyType } from "@/types";
import { Timestamp } from "firebase/firestore";
import { applyCadence } from "@/lib/firestore";
import { format } from "date-fns";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK_ORDINALS = ["1st", "2nd", "3rd", "4th", "5th"];

interface Props {
  groupId: string;
  currentCadence: EventCadence | null;
  open: boolean;
  onClose: () => void;
}

export function CadenceEditor({ groupId, currentCadence, open, onClose }: Props) {
  const [frequency, setFrequency] = useState<FrequencyType>(currentCadence?.frequency ?? "weekly");
  const [every, setEvery] = useState(currentCadence?.every ?? 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(currentCadence?.daysOfWeek ?? [3]); // Wed
  const [dayOfMonth, setDayOfMonth] = useState(currentCadence?.dayOfMonth ?? 1);
  const [weekOfMonth, setWeekOfMonth] = useState(currentCadence?.weekOfMonth ?? 1);
  const [weekdayOfMonth, setWeekdayOfMonth] = useState(currentCadence?.weekdayOfMonth ?? 3);
  const [useWeekdayOfMonth, setUseWeekdayOfMonth] = useState(currentCadence?.useWeekdayOfMonth ?? true);
  const [monthOfYear, setMonthOfYear] = useState(currentCadence?.monthOfYear ?? 0);
  const [time, setTime] = useState(currentCadence?.time ?? "7:00pm");
  const [startDate, setStartDate] = useState(
    currentCadence ? format(currentCadence.startDate.toDate(), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [qtyAhead, setQtyAhead] = useState(currentCadence?.qtyAhead ?? 6);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleDay(d: number) {
    setDaysOfWeek((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  async function handleSubmit() {
    setSaving(true);
    const cadence: EventCadence = {
      frequency,
      every,
      daysOfWeek: frequency === "weekly" ? daysOfWeek : undefined,
      dayOfMonth: (frequency === "monthly" && !useWeekdayOfMonth) || frequency === "yearly" ? dayOfMonth : undefined,
      weekOfMonth: frequency === "monthly" && useWeekdayOfMonth ? weekOfMonth : undefined,
      weekdayOfMonth: frequency === "monthly" && useWeekdayOfMonth ? weekdayOfMonth : undefined,
      useWeekdayOfMonth: frequency === "monthly" ? useWeekdayOfMonth : undefined,
      monthOfYear: frequency === "yearly" ? monthOfYear : undefined,
      time,
      startDate: Timestamp.fromDate(new Date(startDate)),
      qtyAhead,
    };
    await applyCadence(groupId, cadence);
    setSaving(false);
    setConfirmOpen(false);
    onClose();
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Edit Schedule Cadence</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 mt-4">
            {/* Frequency */}
            <div>
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as FrequencyType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Every N */}
            <div>
              <Label>Every</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={every}
                  onChange={(e) => setEvery(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  {frequency === "daily" ? "day(s)" : frequency === "weekly" ? "week(s)" : frequency === "monthly" ? "month(s)" : "year(s)"}
                </span>
              </div>
            </div>

            {/* Weekly: days of week */}
            {frequency === "weekly" && (
              <div>
                <Label>On</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {DAY_NAMES.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${
                        daysOfWeek.includes(i)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly */}
            {frequency === "monthly" && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setUseWeekdayOfMonth(false)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${!useWeekdayOfMonth ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent"}`}
                  >
                    Day of month
                  </button>
                  <button
                    onClick={() => setUseWeekdayOfMonth(true)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${useWeekdayOfMonth ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent"}`}
                  >
                    Day of week
                  </button>
                </div>

                {!useWeekdayOfMonth ? (
                  <div>
                    <Label>Day of month</Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="mt-1 w-24"
                    />
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label>Week</Label>
                      <Select value={String(weekOfMonth)} onValueChange={(v) => setWeekOfMonth(parseInt(v))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {WEEK_ORDINALS.map((o, i) => (
                            <SelectItem key={i} value={String(i + 1)}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label>Weekday</Label>
                      <Select value={String(weekdayOfMonth)} onValueChange={(v) => setWeekdayOfMonth(parseInt(v))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAY_NAMES.map((d, i) => (
                            <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Yearly */}
            {frequency === "yearly" && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Month</Label>
                  <Select value={String(monthOfYear)} onValueChange={(v) => setMonthOfYear(parseInt(v))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTH_NAMES.map((m, i) => (
                        <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label>Day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Time */}
            <div>
              <Label>Time</Label>
              <Input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="7:30pm"
                className="mt-1 w-32"
              />
              <p className="text-xs text-muted-foreground mt-1">Format: 7:30pm or 10:00am</p>
            </div>

            {/* Start date */}
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Unconfirmed events on or after this date will be replaced.</p>
            </div>

            {/* Qty ahead */}
            <div>
              <Label>Events to generate ahead</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={qtyAhead}
                onChange={(e) => setQtyAhead(Math.min(100, Math.max(1, parseInt(e.target.value) || 6)))}
                className="mt-1 w-24"
              />
            </div>

            <Button className="w-full" onClick={() => setConfirmOpen(true)}>
              Apply Cadence
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply New Cadence?</AlertDialogTitle>
            <AlertDialogDescription>
              All <strong>unconfirmed</strong> events on or after the start date will be deleted and replaced with new generated events. Confirmed events will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={saving}>
              {saving ? "Applying…" : "Apply"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
