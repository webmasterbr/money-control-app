import type { SVGProps } from "react";

import {
  ClickSaldoMarkPaths,
  type ClickSaldoLogoVariant
} from "@/components/brand/ClickSaldoMark";

export type { ClickSaldoLogoVariant } from "@/components/brand/ClickSaldoMark";

type Props = Omit<SVGProps<SVGSVGElement>, "viewBox"> & {
  variant: ClickSaldoLogoVariant;
};

export function ClickSaldoLogo({ variant, className, ...rest }: Props) {
  const isLight = variant === "light";

  return (
    <svg
      viewBox="24 24 292 73"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMinYMid meet"
      {...rest}
    >
      <title>Click Saldo</title>
      <ClickSaldoMarkPaths variant={variant} />
      <text
        fontFamily="'Helvetica Neue', Helvetica, sans-serif"
        fontSize="30"
        fontWeight="600"
        letterSpacing="-0.5"
      >
        <tspan x="104" y="68" fill={isLight ? "#042C53" : "#E6F1FB"}>
          Click
        </tspan>
        <tspan fill={isLight ? "#185FA5" : "#378ADD"}> Saldo</tspan>
      </text>
      <text
        x="105"
        y="88"
        fontFamily="'Helvetica Neue', Helvetica, sans-serif"
        fontSize="10"
        fontWeight="400"
        fill={isLight ? "#378ADD" : "#185FA5"}
        letterSpacing="2.5"
      >
        CONTROLE FINANCEIRO
      </text>
    </svg>
  );
}
