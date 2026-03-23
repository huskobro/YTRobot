import React from "react";
import { Composition } from "remotion";
import { YTRobotComposition } from "./Composition";
import { CompositionProps } from "./types";

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

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="YTRobotVideo"
      component={YTRobotComposition}
      durationInFrames={1}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => {
        const total = props.scenes.reduce(
          (sum, s) => sum + s.durationInFrames,
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
  );
};
