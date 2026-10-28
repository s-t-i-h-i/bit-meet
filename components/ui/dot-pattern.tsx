"use client";

import {
  type ComponentProps,
  type CSSProperties,
  type PointerEvent,
  useRef,
} from "react";
import { cn } from "@/lib/utils";

export interface DotPatternProps extends ComponentProps<"div"> {
  /**
   * The dots' colour, any CSS colour.
   *
   * @default 45% of `--muted-foreground`
   */
  dotColor?: string;
  /** Each dot's diameter, in pixels. @default 2 */
  dotSize?: number;
  /**
   * Where the dots fade out: toward the edges, the top, the bottom, or
   * nowhere.
   *
   * @default "radial"
   */
  fade?: "none" | "radial" | "top" | "bottom";
  /** The space between two dots, in pixels. @default 24 */
  gap?: number;
  /**
   * The colour dots near the pointer turn, any CSS colour.
   *
   * @default `var(--primary)`
   */
  glowColor?: string;
  /** How brightly dots near the pointer light up. @default "medium" */
  intensity?: "subtle" | "medium" | "strong";
  /** Whether dots near the pointer light up. @default true */
  interactive?: boolean;
  /** How far from the pointer dots light up, in pixels. @default 120 */
  proximity?: number;
  /**
   * How fast the wave crosses the dots: 1 is one pass every 12 seconds,
   * 2 twice as fast. 0 turns the wave off.
   *
   * @default 1
   */
  speed?: number;
}

/** A mask on the whole field, so the dots fade into what's behind them. */
const FADE = {
  bottom: "[mask-image:linear-gradient(to_bottom,#000_40%,transparent)]",
  none: "",
  radial:
    "[mask-image:radial-gradient(ellipse_at_center,#000_40%,transparent)]",
  top: "[mask-image:linear-gradient(to_top,#000_40%,transparent)]",
};

/** The light's opacity at the pointer. */
const STRENGTH = { medium: 0.8, strong: 1, subtle: 0.5 };

const px = (value: number | undefined) =>
  value === undefined ? undefined : `${value}px`;

/** One wave pass, 12 s at speed 1; nothing when the prop isn't passed. */
const duration = (speed: number | undefined) =>
  speed === undefined || speed <= 0 ? undefined : `${12 / speed}s`;

/**
 * A grid of small dots behind your content. A slow diagonal wave
 * brightens them in turn, and dots near the pointer light up in the glow
 * colour, grow and get a soft halo. The dots are a CSS mask over a fill;
 * the wave is a striped layer slid under that mask by `translate`
 * keyframes, and the light a soft spot moved under a second mask of
 * larger dots, to where each pointer move writes two registered CSS
 * properties, eased by a transition. When the pointer leaves, the light
 * fades out where it was. Touch doesn't light dots; reduced motion
 * freezes the wave and the light follows without gliding.
 *
 * @cssvar --dot-pattern-color The dots' colour (45% of `--muted-foreground`).
 * @cssvar --dot-pattern-duration One wave pass (`12s`).
 * @cssvar --dot-pattern-gap The space between two dots (`24px`).
 * @cssvar --dot-pattern-glow The colour dots near the pointer turn (`--primary`).
 * @cssvar --dot-pattern-proximity How far from the pointer dots light up (`120px`).
 * @cssvar --dot-pattern-size Each dot's diameter (`2px`).
 * @cssvar --dot-pattern-strength The light's opacity at the pointer (`0.8`).
 */
export const DotPattern = (props: DotPatternProps) => {
  const {
    dotColor,
    dotSize,
    fade = "radial",
    gap,
    glowColor,
    intensity,
    interactive = true,
    proximity,
    speed,
    onPointerLeave,
    onPointerMove,
    className,
    children,
    ...rest
  } = props;
  const glow = useRef<HTMLDivElement>(null);

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    const node = glow.current;
    if (!node || event.pointerType === "touch") {
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    node.style.setProperty("--dot-pattern-x", `${event.clientX - box.left}px`);
    node.style.setProperty("--dot-pattern-y", `${event.clientY - box.top}px`);
    // The light lands where the pointer comes in, and glides from the
    // next move on.
    node.setAttribute(
      "data-pointer",
      node.hasAttribute("data-pointer") ? "move" : "enter"
    );
  };

  // The position stays, so the light fades out where it was.
  const pointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    glow.current?.removeAttribute("data-pointer");
  };

  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      data-slot="dot-pattern"
      onPointerLeave={pointerLeave}
      onPointerMove={pointerMove}
      {...rest}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 [container-type:size] [content-visibility:auto]",
          FADE[fade]
        )}
        data-slot="dot-pattern-field"
        style={
          {
            "--dot-pattern-color": dotColor,
            "--dot-pattern-duration": duration(speed),
            "--dot-pattern-gap": px(gap),
            "--dot-pattern-glow": glowColor,
            "--dot-pattern-proximity": px(proximity),
            "--dot-pattern-size": px(dotSize),
            "--dot-pattern-strength":
              intensity === undefined ? undefined : STRENGTH[intensity],
          } as CSSProperties
        }
      >
        <div
          className="dot-pattern-dots absolute inset-0"
          data-slot="dot-pattern-dots"
        >
          {(speed === undefined || speed > 0) && (
            <div
              className="dot-pattern-wave animate-dot-pattern-wave motion-reduce:[animation-play-state:paused]"
              data-slot="dot-pattern-wave"
            />
          )}
        </div>
        {interactive ? (
          <div
            className="dot-pattern-lit absolute inset-0"
            data-slot="dot-pattern-lit"
          >
            <div
              className="dot-pattern-glow"
              data-slot="dot-pattern-glow"
              ref={glow}
            />
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
};
