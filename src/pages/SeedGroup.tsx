import { ArrowLeft, Download, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Static starter pamphlet content rendered as a printable/shareable page
export function SeedGroup() {
  const navigate = useNavigate();

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: "Start a Men's Group",
        text: "Here's a starter guide for creating a men's group.",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-1" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
        </div>
      </div>

      <div className="prose prose-sm max-w-none space-y-6">
        <div className="text-center border-b pb-6">
          <h1 className="text-3xl font-bold">Starting a Men's Group</h1>
          <p className="text-muted-foreground mt-2">A starter guide for building brotherhood</p>
        </div>

        <section>
          <h2 className="text-xl font-semibold">What is a Men's Group?</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A men's group is a small, intentional gathering of men who meet regularly to support each other,
            share experiences, and grow together. Unlike casual hangouts, a men's group has structure,
            agreements, and a commitment to honesty and vulnerability.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Getting Started</h2>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li><strong>Start with 4–8 men</strong> — small enough to go deep, large enough for resilience.</li>
            <li><strong>Set a regular meeting time</strong> — consistency is everything. Monthly or bi-weekly works well.</li>
            <li><strong>Agree on a format</strong> — check-ins, a topic, and a close. Keep it simple at first.</li>
            <li><strong>Create agreements together</strong> — confidentiality, no advice unless asked, full presence.</li>
            <li><strong>Choose a facilitator</strong> — rotate or keep one person. Someone holds the container.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Sample Agreements</h2>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>What is shared in the group stays in the group.</li>
            <li>Speak from personal experience — use "I" statements.</li>
            <li>No unsolicited advice. Ask before offering.</li>
            <li>Phones away during the meeting.</li>
            <li>Arrive on time. Honor the time we have together.</li>
            <li>If you can't make it, let the group know in advance.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Sample Meeting Format (90 minutes)</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="flex gap-3"><span className="font-medium w-20 shrink-0">0:00–0:10</span><span>Opening — silence, breath, or a brief ritual to mark the start</span></div>
            <div className="flex gap-3"><span className="font-medium w-20 shrink-0">0:10–0:45</span><span>Check-ins — each man speaks briefly about where he's at</span></div>
            <div className="flex gap-3"><span className="font-medium w-20 shrink-0">0:45–1:15</span><span>Topic or hot seat — deeper work with one or more men</span></div>
            <div className="flex gap-3"><span className="font-medium w-20 shrink-0">1:15–1:30</span><span>Closing — appreciations, announcements, next meeting</span></div>
          </div>
        </section>

        <section className="border-t pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Use the Men's Groups app to manage your schedule, resources, and members.
          </p>
          <p className="text-xs text-muted-foreground mt-1">{window.location.origin}</p>
        </section>
      </div>
    </div>
  );
}
