import { routeTo } from "../router";

interface NavItem {
  label: string;
  path: string;
}

export function Navbar() {
  // Evitar duplicados
  const existingNav = document.getElementById("navbar");
  if (existingNav) existingNav.remove(); // removemos para re-render

  const alias = localStorage.getItem("alias");

  // Define nav items based on login state
  const navItems: NavItem[] = alias
    ? [
        { label: "Home", path: "/choose_game" },
        { label: "You vs IA", path: "/pong" },
        { label: "1 vs 1", path: "/1v1" },
        { label: "Tournament", path: "/tournament" },
        { label: "Stats", path: "/stats" },
        { label: "About Us", path: "/about" },
        { label: "Leave", path: "/logout" }, // Special path
      ]
    : [
        { label: "Login", path: "/" },
        { label: "About Us", path: "/about" },
      ];

  // Navbar container
  const nav = document.createElement("nav");
  nav.id = "navbar";
  nav.className =
    "w-full bg-white shadow-md px-6 py-3 flex justify-between items-center fixed top-0 left-0 z-50";

  // Logo / title
  const logo = document.createElement("div");
  logo.className = "text-xl font-bold cursor-pointer";
  logo.addEventListener("click", () => routeTo(alias ? "/choose_game" : "/"));
  nav.appendChild(logo);

  // Nav links container
  const linksContainer = document.createElement("div");
  linksContainer.className = "flex gap-4";

  navItems.forEach((item) => {
    const btn = document.createElement("button");
    btn.textContent = item.label;
    btn.className = "text-gray-700 hover:text-blue-500 font-medium transition";

    btn.addEventListener("click", () => {
      if (item.path === "/logout") {
        localStorage.removeItem("alias");
        Navbar(); // re-render navbar
        routeTo("/"); // redirect to login
      } else {
        routeTo(item.path);
      }
    });

    linksContainer.appendChild(btn);
  });

  nav.appendChild(linksContainer);

  // Append to body
  document.body.appendChild(nav);

  // Add top padding to app so content isn't hidden under navbar
  const app = document.getElementById("app");
  if (app) app.style.paddingTop = `${nav.offsetHeight}px`;
}
