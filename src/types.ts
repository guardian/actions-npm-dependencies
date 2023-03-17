import { Range, SemVer } from  "https://deno.land/std@0.177.0/semver/mod.ts";

export interface Dependency {
  name: string;
  range: Range;
}

export type DependencyIdentifier<T extends Dependency> =
  `${T["name"]}@${T["range"]["raw"]}`;

export interface Unrefined_dependency extends Dependency {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  known_issues: Record<string, Record<string, [from: string, to: string]>>;
}

export interface Registry_dependency extends Dependency {
  version: SemVer;
  dependencies: Dependency[];
  peers: Peer_dependency[];
}

export interface Peer_dependency extends Dependency {
  satisfied: boolean;
  local?: Range;
}
