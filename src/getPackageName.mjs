export default function(dependency) {
	return dependency
		.split(`@`).join("")
		.split(`/`).join("-") + ".pkg"
}
