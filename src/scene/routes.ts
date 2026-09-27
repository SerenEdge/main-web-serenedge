// Which background layer a route gets. Home: the full 3D scene. About/Services/Contact: ambient dots only.
const AMBIENT_ROUTES = ["/about", "/services", "/contact"];

export type SceneMode = "home" | "ambient" | "none";

export function sceneFor(pathname: string): SceneMode {
  if (pathname === "/") return "home";
  if (AMBIENT_ROUTES.includes(pathname)) return "ambient";
  return "none";
}
