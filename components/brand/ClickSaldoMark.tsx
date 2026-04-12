import type { SVGProps } from "react";

export type ClickSaldoLogoVariant = "light" | "dark";

type PathsProps = { variant: ClickSaldoLogoVariant };

/** Símbolo ($ + círculos + cursor) nas coordenadas do logo completo (centro 60,60). */
export function ClickSaldoMarkPaths({ variant }: PathsProps) {
  const isLight = variant === "light";

  return (
    <>
      <circle
        cx="60"
        cy="60"
        r="28"
        fill="none"
        stroke={isLight ? "#185FA5" : "#378ADD"}
        strokeWidth="1.5"
      />
      <circle
        cx="60"
        cy="60"
        r="21"
        fill={isLight ? "#B5D4F4" : "#0C447C"}
        opacity="0.5"
      />
      <text
        x="60"
        y="66"
        textAnchor="middle"
        fontFamily="'Helvetica Neue', Helvetica, sans-serif"
        fontSize="18"
        fontWeight="500"
        fill={isLight ? "#0C447C" : "#85B7EB"}
      >
        $
      </text>
      <polygon
        points="71,69 82,80 75,80 71,89 65,74"
        fill={isLight ? "#185FA5" : "#378ADD"}
      />
      <circle cx="71" cy="69" r="2.5" fill={isLight ? "#378ADD" : "#B5D4F4"} />
    </>
  );
}

type MarkProps = Omit<SVGProps<SVGSVGElement>, "viewBox"> & {
  variant: ClickSaldoLogoVariant;
};

/** Apenas o ícone, viewBox recortado ao símbolo. */
export function ClickSaldoMark({ variant, className, ...rest }: MarkProps) {
  return (
    <svg
      viewBox="28 28 58 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      {...rest}
    >
      <title>Click Saldo</title>
      <ClickSaldoMarkPaths variant={variant} />
    </svg>
  );
}
