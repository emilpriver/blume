import "./index.css";
import { Composition } from "remotion";

import { LaunchVideo } from "./composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="LaunchVideo"
      component={LaunchVideo}
      durationInFrames={1281}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
