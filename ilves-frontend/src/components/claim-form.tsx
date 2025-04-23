import { useState } from "react";
import { claimSchema } from "ilves-schemas";
import { apiService } from "../services/api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { ZodError } from "zod";
import { toast } from "sonner";

type ClaimFormProps = {
  submissionId: number;
  prizeTier: string;
  onClaimed: () => void;
};

export function ClaimForm({
  submissionId,
  prizeTier,
  onClaimed,
}: ClaimFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    try {
      claimSchema.parse({ firstName, lastName });
      setErrors({});
    } catch (err) {
      if (err instanceof ZodError) {
        err.issues.forEach((issue) => {
          if (issue.path.length > 0) {
            newErrors[issue.path[0]] = issue.message;
          }
        });
        isValid = false;
      } else if (err instanceof Error) {
        setSubmitError("An unknown validation error occurred: " + err.message);
        isValid = false;
      } else {
        setSubmitError("An unknown validation error occurred.");
        isValid = false;
      }
      setErrors(newErrors);
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setSubmitError("");

      await apiService.claimPrize(submissionId, firstName, lastName);
      toast.success(
        `Congratulations! Your ${getPrizeTierLabel(
          prizeTier
        )} prize has been claimed.`
      );
      onClaimed();
    } catch (err) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPrizeTierLabel = (tier: string) => {
    switch (tier) {
      case "high":
        return "High Tier";
      case "medium":
        return "Medium Tier";
      case "low":
        return "Low Tier";
      default:
        return tier;
    }
  };

  return (
    <div className="w-full max-w-md">
      <div
        className="bg-primary/20 border-l-4 border-primary text-text p-4 mb-4"
        role="alert"
      >
        <p className="font-bold">Congratulations!</p>
        <p>
          You've won a {getPrizeTierLabel(prizeTier)} prize! Please claim it by
          filling out the form below.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-background shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <div className="mb-4">
          <Label
            className="block text-text text-sm font-bold mb-2"
            htmlFor="firstName"
          >
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Mari"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            aria-invalid={!!errors.firstName}
            aria-describedby="firstName-error"
            required
          />
          {errors.firstName && (
            <p
              className="text-destructive text-xs italic mt-1"
              id="firstName-error"
            >
              {errors.firstName}
            </p>
          )}
        </div>

        <div className="mb-6">
          <Label
            className="block text-text text-sm font-bold mb-2"
            htmlFor="lastName"
          >
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Maasikas"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            aria-invalid={!!errors.lastName}
            aria-describedby="lastName-error"
            required
          />
          {errors.lastName && (
            <p
              className="text-destructive text-xs italic mt-1"
              id="lastName-error"
            >
              {errors.lastName}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center">
          <Button
            className="text-background w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              "Claim Prize"
            )}
          </Button>
        </div>

        {submitError && (
          <p className="text-accent text-sm text-center mt-4">{submitError}</p>
        )}
      </form>
    </div>
  );
}
