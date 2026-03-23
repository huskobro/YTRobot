import React from "react";
import { Series } from "remotion";
import { VideoScene } from "./Scene";
import { CompositionProps } from "./types";

export const YTRobotComposition: React.FC<CompositionProps> = ({ scenes, settings }) => {
  return (
    <Series>
      {scenes.map((scene, i) => (
        <Series.Sequence key={i} durationInFrames={scene.durationInFrames}>
          <VideoScene {...scene} sceneIndex={i} settings={settings} />
        </Series.Sequence>
      ))}
    </Series>
  );
};
