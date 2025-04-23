import { useEffect, useState } from "react";
import { LeaderboardEntry } from "ilves-schemas";
import { apiService } from "../services/api";
import { formatDate } from "date-fns";
import { toast } from "sonner";

export function Leaderboard() {
  const [winners, setWinners] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await apiService.getLeaderboard();
        setWinners(data);
        setError("");
      } catch (err) {
        toast.error("Failed to load leaderboard");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Refresh every 60 seconds
    const interval = setInterval(fetchLeaderboard, 60000);

    return () => clearInterval(interval);
  }, []);

  const getPrizeTierClass = (tier: string) => {
    switch (tier) {
      case "high":
        return "bg-primary";
      case "medium":
        return "bg-green-500";
      default:
        return "bg-sky-500";
    }
  };

  if (loading && winners.length === 0) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-background shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-bold mb-4 text-text">Recent Winners</h2>
          <p className="text-text/60 text-center py-4">Loading winners...</p>
        </div>
      </div>
    );
  }

  if (error && winners.length === 0) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-background shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-bold mb-4 text-text">Recent Winners</h2>
          <p className="text-accent text-center py-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto md:h-full md:flex md:flex-col">
      <div className="bg-background shadow-md rounded px-8 pt-6 pb-8 mb-4 md:flex-1 md:flex md:flex-col">
        <h2 className="text-xl font-bold mb-4 text-text">Recent Winners</h2>

        {winners.length === 0 ? (
          <p className="text-text/60 text-center py-4">No winners yet.</p>
        ) : (
          <ul className="divide-y divide-primary/30 max-h-46 md:max-h-none md:flex-1 overflow-y-auto pr-2">
            {winners.map((winner, index) => (
              <li
                key={index}
                className="py-2 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 flex items-center justify-center bg-secondary text-text rounded-full mr-3">
                    {winner.initials.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-text">
                      {winner.initials}
                    </span>
                    <span className="text-sm text-text/60">
                      {formatDate(winner.submittedAt, "dd.MM.yyyy HH:mm")}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getPrizeTierClass(
                    winner.prizeTier || ""
                  )}`}
                >
                  {winner.prizeTier}
                </span>
              </li>
            ))}
          </ul>
        )}

        {loading && winners.length > 0 && (
          <p className="text-text/60 text-center text-sm mt-4">Refreshing...</p>
        )}
      </div>
    </div>
  );
}
