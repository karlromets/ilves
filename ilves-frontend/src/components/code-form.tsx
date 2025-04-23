import { useState } from "react";
import { codeSchema } from "ilves-schemas";
import { apiService } from "../services/api";
import { ZodError } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type CodeFormProps = {
  onWin: (submissionId: number, prizeTier: string) => void;
};

export function CodeForm({ onWin }: CodeFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCode(value);

    try {
      codeSchema.parse(value);
      setError("");
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.issues[0]?.message || "Invalid input");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown validation error occurred");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    try {
      codeSchema.parse(code);
      setLoading(true);

      const result = await apiService.submitCode(code);

      if (result.win) {
        onWin(result.submissionId, result.prizeTier || "");
      } else {
        setCode("");
        toast.info("Sorry, code did not have a prize")
      }
    } catch (err) {
      if (err instanceof ZodError) {
        setSubmitError(err.issues[0]?.message || "Invalid code submitted");
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("An unknown error occurred during submission");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="bg-background shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <div className="mb-4">
          <Label
            className="block text-text text-sm font-bold mb-2"
            htmlFor="code"
          >
            Enter your 5-character code:
          </Label>
          <Input
            id="code"
            type="text"
            placeholder="XXXXX"
            value={code}
            onChange={handleChange}
            maxLength={5}
            aria-invalid={!!error}
            aria-describedby="code-error"
          />
          <div className="h-2">
          {error && (
            <p className="text-destructive text-xs italic" id="code-error">
              {error}
            </p>
          )}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Button
            className="text-background w-full"
            type="submit"
            disabled={!!error || code.length !== 5 || loading}
          >
            {loading ? <LoaderCircle className="animate-spin" /> : "Submit Code"}
          </Button>
        </div>

        {submitError && (
          <p className="text-destructive text-sm text-center mt-4">{submitError}</p>
        )}
      </form>
    </div>
  );
}
