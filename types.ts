import { Range, SemVer } from "./deps.ts";

export interface Dependency {
  name: string;
  range: Range;
}

export interface UnrefinedDependency extends Dependency {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export interface RegistryDependency extends Dependency {
  version: SemVer;
  dependencies: Dependency[];
  peers: PeerDependency[];
}

export interface PeerDependency extends Dependency {
  satisfied: boolean;
  local?: Range;
}
