import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface GradientProps extends ComponentProps<"div"> {
  /**
   * Up to five CSS colors for the blobs, repeated when there are fewer.
   * By default teal, purple, blue, pink and violet.
   */
  colors?: string[];
  /**
   * A fine film grain over the surface.
   *
   * @default true
   */
  grain?: boolean;
  /**
   * How strongly the blobs show over the surface.
   *
   * @default "medium"
   */
  intensity?: "subtle" | "medium" | "strong";
  /**
   * How fast the blobs wander: 2 is twice as fast, 0.5 half as fast.
   *
   * @default 1
   */
  speed?: number;
}

/** The blobs' strength, a multiplier of their alpha. */
const STRENGTH = { medium: "1", strong: "1.4", subtle: "0.6" } as const;

/** Each blob: a soft color disc wandering on two axes at two paces. */
const BLOB =
  "gradient-blob animate-gradient-wander motion-reduce:[animation-play-state:paused]";

/**
 * The variables the props set, `colors` repeated to five; a prop left out
 * writes nothing, so the stylesheet's default (or yours) applies.
 */
const layerVars = (
  speed: number | undefined,
  intensity: GradientProps["intensity"],
  colors: string[] = []
) =>
  ({
    "--gradient-speed": speed === undefined ? undefined : String(speed),
    "--gradient-strength":
      intensity === undefined ? undefined : STRENGTH[intensity],
    ...Object.fromEntries(
      colors.length === 0
        ? []
        : [1, 2, 3, 4, 5].map((n) => [
            `--gradient-color-${n}`,
            colors[(n - 1) % colors.length],
          ])
    ),
  }) as CSSProperties;

/**
 * Five color blobs that wander and overlap behind your content, under a
 * fine film grain. Each blob is a radial gradient whose stops ease out to
 * transparent, so it looks blurred without a blur filter. It sways on
 * each axis at its own pace (the `gradient-wander-x` and `-y` keyframes),
 * so its path never quite repeats, with transforms only, so nothing
 * repaints. Blobs are placed and sized from the component's box, not the
 * window, so it works in a card as well as full screen. With reduced
 * motion the blobs stand still.
 *
 * @cssvar --gradient-color-1 The first blob (teal).
 * @cssvar --gradient-color-2 The second blob (purple).
 * @cssvar --gradient-color-3 The third blob (blue).
 * @cssvar --gradient-color-4 The fourth blob (pink).
 * @cssvar --gradient-color-5 The fifth blob (violet).
 * @cssvar --gradient-speed The wander's speed, a multiplier (`1`).
 * @cssvar --gradient-strength The blobs' strength, a multiplier of their alpha (`1`).
 */
export const Gradient = (props: GradientProps) => {
  const {
    colors,
    grain = true,
    intensity,
    speed,
    className,
    children,
    ...rest
  } = props;
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-background",
        className
      )}
      data-slot="gradient"
      {...rest}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-transparent via-foreground/4 to-transparent [container-type:size] [content-visibility:auto]"
        data-slot="gradient-layer"
        style={layerVars(speed, intensity, colors)}
      >
        {grain ? (
          <span
            className="gradient-grain absolute inset-0 opacity-60 dark:opacity-100"
            data-slot="gradient-grain"
          />
        ) : null}
        <span
          className={cn(BLOB, "gradient-blob-1")}
          data-slot="gradient-blob"
        />
        <span
          className={cn(BLOB, "gradient-blob-2")}
          data-slot="gradient-blob"
        />
        <span
          className={cn(BLOB, "gradient-blob-3")}
          data-slot="gradient-blob"
        />
        <span
          className={cn(BLOB, "gradient-blob-4")}
          data-slot="gradient-blob"
        />
        <span
          className={cn(BLOB, "gradient-blob-5")}
          data-slot="gradient-blob"
        />
      </div>
      {children}
    </div>
  );
};
