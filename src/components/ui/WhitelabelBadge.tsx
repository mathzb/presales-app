import {
  getCustomerReferenceName,
  getWhitelabelColor,
} from "../../utils/referenceMap";

interface Props {
  whitelabelKey: string;
  onClear: () => void;
}

export default function WhitelabelBadge({ whitelabelKey, onClear }: Props) {
  if (whitelabelKey === "all") return null;
  const bgClass = getWhitelabelColor(whitelabelKey);
  const label = getCustomerReferenceName(whitelabelKey);

  return (
    <div
      title={`Filter: ${label}`}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${bgClass} dark:bg-gray-700 text-sm`}
    >
      <span className="font-medium text-slate-800 dark:text-slate-100">
        {label}
      </span>
      <button
        onClick={onClear}
        aria-label="Clear whitelabel filter"
        title="Clear filter"
        className="text-slate-500 hover:text-slate-700 dark:text-slate-300"
      >
        ×
      </button>
    </div>
  );
}
