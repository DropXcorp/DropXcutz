export default function AppLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-lg font-bold text-white shadow-sm">
        DX
      </div>

      <div>
        <h1 className="text-lg font-bold tracking-tight text-zinc-900">
          DropX Studio
        </h1>

        <p className="text-xs text-zinc-500">
          Manage Your Salon
        </p>
      </div>
    </div>
  );
}