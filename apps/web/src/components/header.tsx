import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <Link to="/" className="text-lg font-semibold">
          G1 Admissions
        </Link>
      </div>
      <hr />
    </div>
  );
}
