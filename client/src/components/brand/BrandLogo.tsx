import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  variant?: "light" | "dark" | "auto";
  showWordmark?: boolean;
};

export function BrandLogo({
  className,
  imageClassName,
  variant = "auto",
  showWordmark = true,
}: BrandLogoProps) {
  const lightSrc = "/universo-doce-logo-light.jpeg";
  const darkSrc = "/universo-doce-logo-dark.jpeg";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/85 p-1.5 shadow-lg shadow-black/5 backdrop-blur">
        {variant === "light" ? (
          <img
            src={lightSrc}
            alt="Universo Doce"
            className={cn("h-14 w-14 rounded-[1.2rem] object-cover", imageClassName)}
          />
        ) : variant === "dark" ? (
          <img
            src={darkSrc}
            alt="Universo Doce"
            className={cn("h-14 w-14 rounded-[1.2rem] object-cover", imageClassName)}
          />
        ) : (
          <>
            <img
              src={lightSrc}
              alt="Universo Doce"
              className={cn(
                "h-14 w-14 rounded-[1.2rem] object-cover dark:hidden",
                imageClassName,
              )}
            />
            <img
              src={darkSrc}
              alt="Universo Doce"
              className={cn(
                "hidden h-14 w-14 rounded-[1.2rem] object-cover dark:block",
                imageClassName,
              )}
            />
          </>
        )}
      </div>

      {showWordmark ? (
        <div className="min-w-0">
          <p className="font-display text-xl font-bold leading-none text-foreground">
            Universo Doce
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Confeitaria
          </p>
        </div>
      ) : null}
    </div>
  );
}
