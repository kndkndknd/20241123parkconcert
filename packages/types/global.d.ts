export type Cmd = "SINEWAVE" | "BASS" | "WHITENOISE" | "FEEDBACK" | "CLICK";

export type Parameter = {
  fadein: { [key: string]: number };
  fadeout: { [key: string]: number };
  gain: { [key: string]: number };
  portament: number;
};
