import { INTAKE_YEAR_DEFAULT } from "@school-admissions/db/constants/markingVersions/shared/intake-year";
import { Button } from "@school-admissions/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@school-admissions/ui/components/dropdown-menu";
import { Spinner } from "@school-admissions/ui/components/spinner";
import { IconBook2, IconHome, IconMenu2, IconPlus, IconSchool } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import type { ReactNode } from "react";

import { useStartApplication } from "@/hooks/use-start-application";

const navLinkClass =
  "inline-flex h-7 items-center rounded-md px-2.5 text-xs/relaxed font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function NavLink({ to, children }: { to: "/" | "/docs"; children: ReactNode }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      className={cn(navLinkClass, "text-muted-foreground hover:bg-muted hover:text-foreground")}
      activeProps={{ className: cn(navLinkClass, "bg-muted text-foreground") }}
    >
      {children}
    </Link>
  );
}

export default function Header() {
  const { start, canStart, isPending } = useStartApplication();

  return (
    <header className="sticky inset-x-0 top-0 z-40 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="group inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <IconSchool className="size-4" />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-sm leading-none font-semibold tracking-tight">
              G1 Admissions
            </span>
            <span className="hidden text-[0.6875rem] leading-none text-muted-foreground sm:block">
              Intake {INTAKE_YEAR_DEFAULT}
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="mx-auto hidden items-center gap-1 md:flex">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/docs">Documentation</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="hidden sm:inline-flex"
            disabled={!canStart || isPending}
            onClick={start}
          >
            {isPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <IconPlus data-icon="inline-start" />
            )}
            {isPending ? "Starting..." : "Start application"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <IconMenu2 />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>G1 Admissions</DropdownMenuLabel>
              <DropdownMenuItem render={<Link to="/" />}>
                <IconHome />
                Home
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to="/docs" />}>
                <IconBook2 />
                Documentation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!canStart || isPending} onClick={start}>
                {isPending ? <Spinner /> : <IconPlus />}
                {isPending ? "Starting..." : "Start application"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
