// Shared between server and client. Types only: no secrets, no runtime code.
export type Project = {
  id: string;
  title: string;
  problem: string;
  what_i_built: string;
  stack: string[];
  industry: string | null;
  key_result: string | null;
  demo_url: string | null;
  video_url: string | null;
  position: number;
};
