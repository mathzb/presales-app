import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="backdrop-blur border-slate-200/60 dark:border-gray-700/60">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Search className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Siden blev ikke fundet</CardTitle>
            <CardDescription className="text-base">
              Den side, du leder efter, findes ikke eller er blevet flyttet.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link to="/">Gå til forsiden</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
