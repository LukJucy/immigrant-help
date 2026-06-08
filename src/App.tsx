/** App layout shell: focused phone-width column, content outlet, tab bar, footer. */
import { Link, Outlet } from "react-router-dom";
import { TabBar } from "./components/TabBar";

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="mx-auto flex w-full max-w-app flex-1 flex-col">
        <main className="flex-1 px-4 pb-6 pt-4">
          <Outlet />
        </main>
        <Footer />
      </div>
      <TabBar />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-4 py-4 text-center text-sm text-muted">
      <p>
        SettleIn is <strong className="font-semibold">signposting, not legal advice</strong>. Always
        check the official source.{" "}
        <Link to="/about" className="font-medium text-primary underline underline-offset-2">
          About &amp; trust
        </Link>
      </p>
    </footer>
  );
}
