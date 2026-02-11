import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, ChevronDown, Menu, X, Box, Activity, Award, TrendingUp, FileText, Shield, Layers, Cpu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

interface DropdownItem {
  label: string;
  path: string;
  icon: any;
}

interface NavDropdown {
  label: string;
  items: DropdownItem[];
}

const navDropdowns: NavDropdown[] = [
  {
    label: "Blockchain",
    items: [
      { label: "Transactions", path: "/events", icon: Activity },
      { label: "Blocks", path: "/blocks", icon: Layers },
      { label: "Top Agents", path: "/topagents", icon: TrendingUp },
      { label: "Verified Agents", path: "/verified", icon: Award },
    ],
  },
  {
    label: "Agents",
    items: [
      { label: "All Agents", path: "/agents", icon: Box },
      { label: "Verified Agents", path: "/verified", icon: Award },
      { label: "Top Agents", path: "/topagents", icon: TrendingUp },
    ],
  },
  {
    label: "More",
    items: [
      { label: "Receipts", path: "/receipts", icon: FileText },
      { label: "Permissions", path: "/permissions", icon: Shield },
      { label: "BAP-578", path: "/bap578", icon: Cpu },
    ],
  },
];

function DropdownNav({ dropdown, navigate, onClose }: { dropdown: NavDropdown; navigate: (path: string) => void; onClose: () => void }) {
  return (
    <div className="absolute top-full left-0 mt-0.5 bg-card border rounded-md shadow-lg py-1 min-w-[200px] z-50">
      {dropdown.items.map((item) => (
        <button
          key={item.path}
          onClick={() => { navigate(item.path); onClose(); }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover-elevate text-left"
          data-testid={`dropdown-link-${item.label.toLowerCase().replace(/\s/g, "-")}`}
        >
          <item.icon className="w-4 h-4 text-muted-foreground" />
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function ExplorerHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <>
      <div className="border-b bg-card text-xs">
        <div className="max-w-[1400px] mx-auto px-4 py-1.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>NFA Network</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">Non-Fungible Agent Registry</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between gap-4 h-[60px]">
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); navigate("/"); }}
              className="flex items-center gap-2 shrink-0"
              data-testid="link-home"
            >
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="font-bold text-sm text-primary-foreground">N</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold leading-tight">NfaScan</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Powered by NFA Network</span>
              </div>
            </a>

            <nav className="hidden lg:flex items-center gap-0.5" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className={location === "/" ? "text-primary" : ""}
                data-testid="button-nav-home"
              >
                Home
              </Button>
              {navDropdowns.map((dd) => (
                <div key={dd.label} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenDropdown(openDropdown === dd.label ? null : dd.label)}
                    className={openDropdown === dd.label ? "text-primary" : ""}
                    data-testid={`button-nav-${dd.label.toLowerCase()}`}
                  >
                    {dd.label}
                    <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openDropdown === dd.label ? "rotate-180" : ""}`} />
                  </Button>
                  {openDropdown === dd.label && (
                    <DropdownNav dropdown={dd} navigate={navigate} onClose={() => setOpenDropdown(null)} />
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Search by Address / Tx Hash / Agent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[280px] lg:w-[340px] pl-3 pr-9 bg-background text-xs"
                    data-testid="input-search"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 bottom-0 w-9 flex items-center justify-center bg-primary rounded-r-md"
                    data-testid="button-header-search"
                  >
                    <Search className="w-3.5 h-3.5 text-primary-foreground" />
                  </button>
                </div>
              </form>

              <Button
                size="icon"
                variant="ghost"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-card px-4 py-3 space-y-1">
            <form onSubmit={handleSearch} className="md:hidden mb-3">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search by Address / Tx Hash / Agent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-9 bg-background text-xs"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 bottom-0 w-9 flex items-center justify-center bg-primary rounded-r-md"
                >
                  <Search className="w-3.5 h-3.5 text-primary-foreground" />
                </button>
              </div>
            </form>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { navigate("/"); setMobileMenuOpen(false); }} data-testid="button-mobile-home">Home</Button>
            <div className="py-1 text-xs text-muted-foreground font-medium uppercase tracking-wider px-3">Blockchain</div>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { navigate("/events"); setMobileMenuOpen(false); }} data-testid="button-mobile-transactions">Transactions</Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { navigate("/blocks"); setMobileMenuOpen(false); }} data-testid="button-mobile-blocks">Blocks</Button>
            <div className="py-1 text-xs text-muted-foreground font-medium uppercase tracking-wider px-3">Agents</div>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { navigate("/agents"); setMobileMenuOpen(false); }} data-testid="button-mobile-agents">All Agents</Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { navigate("/verified"); setMobileMenuOpen(false); }} data-testid="button-mobile-verified">Verified Agents</Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { navigate("/topagents"); setMobileMenuOpen(false); }} data-testid="button-mobile-top-agents">Top Agents</Button>
            <div className="py-1 text-xs text-muted-foreground font-medium uppercase tracking-wider px-3">More</div>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { navigate("/receipts"); setMobileMenuOpen(false); }} data-testid="button-mobile-receipts">Receipts</Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { navigate("/bap578"); setMobileMenuOpen(false); }} data-testid="button-mobile-bap578">BAP-578</Button>
          </div>
        )}
      </header>
    </>
  );
}
