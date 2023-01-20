import { SemVer, Range } from "./deps.ts";

export interface Dependency {
  name: string;
  version: SemVer;
  peers: PeerDependency[];
}

export interface PeerDependency {
  name: string;
  range: Range;
  optional: boolean;
}
