import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { truncateAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AddressDisplayProps {
  address: string;
  truncate?: boolean;
  chars?: number;
  linkTo?: string;
  className?: string;
  mono?: boolean;
}

export function AddressDisplay({ address, truncate = true, chars = 6, linkTo, className = "", mono = true }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const displayText = truncate ? truncateAddress(address, chars) : address;

  const content = (
    <span className={`inline-flex items-center gap-1 ${mono ? "font-mono" : ""} ${className}`}>
      {linkTo ? (
        <a href={linkTo} className="text-primary hover:underline" data-testid={`link-address-${address.slice(0, 8)}`}>
          {displayText}
        </a>
      ) : (
        <span>{displayText}</span>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="w-6 h-6 opacity-50 hover:opacity-100"
            onClick={handleCopy}
            data-testid={`button-copy-${address.slice(0, 8)}`}
          >
            {copied ? <Check className="w-3 h-3 text-chart-2" /> : <Copy className="w-3 h-3" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? "Copied" : "Copy address"}</TooltipContent>
      </Tooltip>
    </span>
  );

  return content;
}
