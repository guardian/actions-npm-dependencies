import { Range, SemVer } from "./deps.ts";

export interface Dependency {
  name: string;
  range: Range;
}

export interface RegistryDependency extends Dependency {
  versions: SemVer[];
  peers: PeerDependency[];
}

export interface PeerDependency extends Dependency {
  satisfied: boolean;
}
