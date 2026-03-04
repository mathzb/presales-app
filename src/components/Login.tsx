import { useState } from "react";
import { useSupabaseAuth } from "../context/SupabaseAuthContext";
import { LogIn, Lock, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn } = useSupabaseAuth();

  const handleMicrosoftSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const { data, error } = await signIn();
      console.log(data);
      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // Note: OAuth redirect will happen, so loading state persists
    } catch (err) {
      console.log(err);
      setError("En uventet fejl opstod");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mx-auto">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl">Log ind</CardTitle>
            <CardDescription className="text-base">
              Log ind med din Microsoft-konto
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={handleMicrosoftSignIn}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logger ind med Microsoft...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Log ind med Microsoft
                </>
              )}
            </Button>
          </CardContent>

          <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
              Du vil blive omdirigeret til Microsoft for at logge ind
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
