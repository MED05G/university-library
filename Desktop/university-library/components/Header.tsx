import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { User, Search } from "lucide-react";

const Header = () => {
  return (
    <header className="my-10 flex justify-between gap-5">
      <Link href="/">
        <Image src="/icons/logo.svg" alt="logo" width={40} height={40} />
      </Link>

      <ul className="flex flex-row items-center gap-8">
        <li>
          <Link href="/search">
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search Books
            </Button>
          </Link>
        </li>
        <li>
          <Link href="/my-profile">
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              My Profile
            </Button>
          </Link>
        </li>
        <li>
          <form
            action={async () => {
              "use server";

              await signOut();
            }}
            className="mb-10 text-white bold"
          >
            <Button>Logout</Button>
          </form>
        </li>
      </ul>
    </header>
  );
};

export default Header;
