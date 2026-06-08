/** A checklist of documents whose ticked state persists in localStorage. */
import { useStoredSet } from "../lib/useLocalStorage";
import { IconCheck } from "./icons";

export function DocChecklist({
  storageKey,
  items,
  note,
}: {
  storageKey: string;
  items: string[];
  note?: string;
}) {
  const checked = useStoredSet(storageKey);
  return (
    <div>
      <ul className="space-y-1">
        {items.map((item, i) => {
          const id = `${i}`;
          const on = checked.has(id);
          return (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-3 py-1.5">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                    on ? "border-success bg-success text-white" : "border-border bg-white"
                  }`}
                >
                  {on && <IconCheck className="h-3.5 w-3.5" />}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  onChange={() => checked.toggle(id)}
                />
                <span className={on ? "text-muted line-through" : "text-ink"}>{item}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {note && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-warning">Note: {note}</p>
      )}
    </div>
  );
}
