import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/70 dark:bg-gray-900/60 backdrop-blur rounded-2xl shadow-lg p-8 text-center border border-slate-200/60 dark:border-gray-700/60">
        <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
          <Lock className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
          Adgang nægtet
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Du har ikke de nødvendige rettigheder til at se denne side.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
        >
          Gå til forsiden
        </Link>
      </div>
    </div>
  );
}
