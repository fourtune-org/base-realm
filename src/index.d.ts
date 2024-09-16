interface LoadRealmDependenciesResult {
	getDependency(name : string) : any|null
	getDependencyVersion(name : string) : string|null
}

interface Dependency {
	version : string
	import_code : string
}

interface DependencyMap {
	[name: string] : Dependency
}

export function findProjectRootFromDirectory(start_dir : string) : Promise<string|false>
export function installRealmDependencies(project_root : string, dependencies : DependencyMap) : void
export function loadRealmDependencies(project_root : string) : Promise<LoadRealmDependenciesResult>

declare const _default: {
	findProjectRootFromDirectory: typeof findProjectRootFromDirectory,
	installRealmDependencies: typeof installRealmDependencies,
	loadRealmDependencies: typeof loadRealmDependencies
}

export default _default
