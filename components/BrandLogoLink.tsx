"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClickSaldoLogo } from "@/components/brand/ClickSaldoLogo";
import type { ClickSaldoLogoVariant } from "@/components/brand/ClickSaldoMark";
import { useTheme } from "@/components/ThemeProvider";

function variantFromDocument(): ClickSaldoLogoVariant {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

type BrandLogoLinkProps = {
  href: string;
  className?: string;
};

export function BrandLogoLink({ href, className }: BrandLogoLinkProps) {
  const { theme } = useTheme();
  const [variant, setVariant] = useState<ClickSaldoLogoVariant>("dark");

  useEffect(() => {
    setVariant(variantFromDocument());
  }, [theme]);

  return (
    <Link href={href} className={className} aria-label="Click Saldo">
      <ClickSaldoLogo
        variant={variant}
        className="h-16 w-auto max-w-[min(100%,360px)] shrink-0 sm:h-[4.5rem]"
        aria-hidden
        focusable="false"
      />
    </Link>
  );
}
