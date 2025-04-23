import { useState } from "react";
import { CodeForm } from "./components/code-form";
import { ClaimForm } from "./components/claim-form";
import { Leaderboard } from "./components/leaderboard";
import { Stats } from "./components/stats";
import { Toaster } from "sonner";

export default function App() {
  const [winner, setWinner] = useState<{
    submissionId: number;
    prizeTier: string;
  } | null>(null);

  const handleWin = (submissionId: number, prizeTier: string) => {
    setWinner({ submissionId, prizeTier });
  };

  const handleClaimed = () => {
    setWinner(null);
  };

  return (
    <>
      <div className="min-h-screen bg-background py-8 flex items-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:gap-6 lg:gap-8 justify-center">
            <div className="flex flex-col gap-6 items-center md:max-w-md">
              {winner ? (
                <ClaimForm
                  submissionId={winner.submissionId}
                  prizeTier={winner.prizeTier}
                  onClaimed={handleClaimed}
                />
              ) : (
                <CodeForm onWin={handleWin} />
              )}
              <Stats />
            </div>

            <div className="md:max-w-md md:mt-0 mt-6 md:flex md:flex-col">
              <Leaderboard />
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}
