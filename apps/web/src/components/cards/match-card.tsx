import type { MatchLite } from "@aetherscore/shared";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { SportIcon } from "@/components/ui/sport-icon";

const statusTone: Record<MatchLite["status"], "accent" | "success" | "muted"> = {
  live: "success",
  scheduled: "accent",
  finished: "muted",
  canceled: "muted",
  postponed: "muted"
};

const statusLabel: Record<MatchLite["status"], string> = {
  live: "Live",
  scheduled: "Kutilmoqda",
  finished: "Yakunlangan",
  canceled: "Bekor qilingan",
  postponed: "Kechiktirilgan"
};

export const MatchCard = ({ match }: { match: MatchLite }) => {
  const start = new Date(match.startTime);
  const isLive = match.status === "live";

  return (
    <Card
      tone={isLive ? "accent" : "default"}
      className="group relative overflow-hidden border transition hover:-translate-y-1 hover:border-accent-200 hover:shadow-card"
      elevated
    >
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-accent-100/60 blur-2xl transition group-hover:bg-accent-200/80" />
      <div className="relative space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SportIcon sport={match.sport} size="sm" />
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-surface-500">{match.league}</p>
          </div>
          <Badge tone={statusTone[match.status]}>{statusLabel[match.status]}</Badge>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Logo src={match.home.logoUrl} name={match.home.name} size="sm" />
              <p className="font-heading text-base font-semibold text-surface-900">{match.home.name}</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-surface-400">vs</span>
            <div className="flex items-center gap-2">
              <p className="font-heading text-base font-semibold text-surface-900">{match.away.name}</p>
              <Logo src={match.away.logoUrl} name={match.away.name} size="sm" />
            </div>
          </div>
          <p className="text-sm text-surface-500">{start.toLocaleString()}</p>
        </div>
        {match.score ? (
          <div className="rounded-xl border border-surface-200 bg-white/80 px-3 py-2 text-sm font-semibold text-surface-700">
            Hisob: {match.score.home} - {match.score.away}
          </div>
        ) : null}
        <Link
          to={`/matches/${match.id}?sport=${match.sport}`}
          className="inline-block text-sm font-semibold text-accent-700 hover:text-accent-800"
        >
          Match markazini ochish
        </Link>
      </div>
    </Card>
  );
};
