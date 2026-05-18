"use client";

// TKT-0035: render the 8-char pair-code wars emits when the operator
// opted into pair-code mode by submitting a phone to /api/wa/connect.
// The code is one-shot device-linking credential -- only show it to
// the authenticated operator, never log it elsewhere.

export default function PairCodePanel({ code }: { code: string | null }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <h2 className="text-base font-semibold">Type this code on your phone</h2>
      <ol className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 list-decimal pl-5 space-y-1">
        <li>Open WhatsApp on your phone.</li>
        <li>Tap Settings then Linked devices.</li>
        <li>Tap Link a device, then Link with phone number instead.</li>
        <li>Enter the code below.</li>
      </ol>
      <div className="mt-4 flex justify-center">
        {code ? (
          <div
            className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-6 py-5 text-center font-mono text-3xl tracking-widest"
            role="img"
            aria-label="Pair code"
          >
            {formatChunks(code)}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-5 text-sm text-zinc-500">
            Waiting for pair code...
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-zinc-500 text-center">
        Codes expire after a short time. If the code does not work, disconnect and start pair-code
        mode again.
      </p>
    </div>
  );
}

// 8 chars -> "XXXX-XXXX". Anything else is rendered raw; the backend
// callback gives us exactly what wars hands over.
function formatChunks(code: string): string {
  const c = code.trim();
  if (c.length === 8) return `${c.slice(0, 4)}-${c.slice(4)}`;
  if (c.length === 7) return `${c.slice(0, 4)}-${c.slice(4)}`;
  return c;
}
