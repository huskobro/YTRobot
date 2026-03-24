import React from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { Composition } from "remotion";
import { YTRobotComposition } from "./Composition";
import { CompositionProps } from "./types";
import { NewsBulletin, NewsBulletin9x16, defaultBulletinProps, BulletinProps } from "./templates/news-bulletin";

const defaultProps: CompositionProps = {
  scenes: [],
  fps: 30,
  width: 1920,
  height: 1080,
  settings: {
    kenBurnsZoom: 0.08,
    kenBurnsDirection: "center",
    subtitleFont: "serif",
    subtitleSize: 40,
    subtitleColor: "#ffffff",
    subtitleBg: "none",
    subtitleStroke: 0,
    transitionDuration: 12,
    videoEffect: "none",
  },
};

// Remotion's Composition requires two generics: <Schema, Props>.
// When no Zod schema is used, cast component/calculateMetadata to avoid TS errors.
const AnyComposition = Composition as React.FC<any>;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <AnyComposition
        id="YTRobotVideo"
        component={YTRobotComposition}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
        calculateMetadata={({ props }: { props: CompositionProps }) => {
          const total = props.scenes.reduce(
            (sum: number, s: { durationInFrames: number }) => sum + s.durationInFrames,
            0
          );
          return {
            durationInFrames: Math.max(total, 1),
            fps: props.fps || 30,
            width: props.width || 1920,
            height: props.height || 1080,
          };
        }}
      />
      <AnyComposition
        id="NewsBulletin"
        component={NewsBulletin}
        durationInFrames={630}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={defaultBulletinProps}
        calculateMetadata={({ props }: { props: BulletinProps }) => ({
          durationInFrames: Math.max(
            props.items.reduce((s: number, i: { duration: number }) => s + i.duration, 180),
            120
          ),
          fps: props.fps ?? 60,
          width: 1920,
          height: 1080,
        })}
      />
      <AnyComposition
        id="NewsBulletin9x16"
        component={NewsBulletin9x16}
        durationInFrames={630}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={defaultBulletinProps}
        calculateMetadata={({ props }: { props: BulletinProps }) => ({
          durationInFrames: Math.max(
            props.items.reduce((s: number, i: { duration: number }) => s + i.duration, 180),
            120
          ),
          fps: props.fps ?? 60,
          width: 1080,
          height: 1920,
        })}
      />
    </>
  );
};
