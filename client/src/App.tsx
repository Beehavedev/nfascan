import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ExplorerHeader } from "@/components/explorer-header";
import Home from "@/pages/home";
import Agents from "@/pages/agents";
import EventsPage from "@/pages/events-page";
import AgentDetail from "@/pages/agent-detail";
import SearchResults from "@/pages/search-results";
import BlocksPage from "@/pages/blocks";
import BlockDetail from "@/pages/block-detail";
import TxDetail from "@/pages/tx-detail";
import VerifiedAgents from "@/pages/verified-agents";
import TopAgents from "@/pages/top-agents";
import ReceiptsPage from "@/pages/receipts-page";
import PermissionsPage from "@/pages/permissions-page";
import Bap578Page from "@/pages/bap578";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/agents" component={Agents} />
      <Route path="/events" component={EventsPage} />
      <Route path="/blocks" component={BlocksPage} />
      <Route path="/block/:blockNumber" component={BlockDetail} />
      <Route path="/tx/:txHash" component={TxDetail} />
      <Route path="/verified" component={VerifiedAgents} />
      <Route path="/topagents" component={TopAgents} />
      <Route path="/receipts" component={ReceiptsPage} />
      <Route path="/permissions" component={PermissionsPage} />
      <Route path="/bap578" component={Bap578Page} />
      <Route path="/agent/:address" component={AgentDetail} />
      <Route path="/search" component={SearchResults} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-card mt-8">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="font-bold text-xs text-primary-foreground">N</span>
              </div>
              <span className="text-sm font-bold">NfaScan</span>
            </div>
            <p className="text-xs text-muted-foreground">NfaScan is a Block Explorer and Analytics Platform for the NFA Network.</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold mb-2">Blockchain</h4>
            <div className="space-y-1">
              <a href="/events" className="text-xs text-muted-foreground hover:text-primary block" data-testid="link-footer-transactions">Transactions</a>
              <a href="/blocks" className="text-xs text-muted-foreground hover:text-primary block" data-testid="link-footer-blocks">Blocks</a>
              <a href="/topagents" className="text-xs text-muted-foreground hover:text-primary block" data-testid="link-footer-top-agents">Top Agents</a>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold mb-2">Agents</h4>
            <div className="space-y-1">
              <a href="/agents" className="text-xs text-muted-foreground hover:text-primary block" data-testid="link-footer-agents">All Agents</a>
              <a href="/verified" className="text-xs text-muted-foreground hover:text-primary block" data-testid="link-footer-verified">Verified Agents</a>
              <a href="/receipts" className="text-xs text-muted-foreground hover:text-primary block" data-testid="link-footer-receipts">Receipts</a>
              <a href="/bap578" className="text-xs text-muted-foreground hover:text-primary block" data-testid="link-footer-bap578">BAP-578</a>
            </div>
          </div>
        </div>
        <div className="border-t pt-4 flex items-center justify-between gap-4 flex-wrap text-xs text-muted-foreground">
          <span>NfaScan &copy; 2026 | NFA Network Explorer</span>
          <span>Powered by NFA Registry</span>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background flex flex-col">
            <ExplorerHeader />
            <div className="flex-1">
              <Router />
            </div>
            <Footer />
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
