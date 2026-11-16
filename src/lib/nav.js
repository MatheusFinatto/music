// Navegação do topo, igual em todas as páginas.
export function mountNav(current) {
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "Páginas");
  const pages = [["/", "Início", "home"], ["/diario", "Diário do Solo", "diario"], ["/piano", "Piano de Ideias", "piano"]];
  const brand = document.createElement("a"); brand.href = "/"; brand.className = "brand"; brand.textContent = "Música";
  nav.append(brand);
  pages.slice(1).forEach(([href, label, id]) => {
    const a = document.createElement("a"); a.href = href; a.textContent = label;
    if (id === current) a.setAttribute("aria-current", "page");
    nav.append(a);
  });
  return nav;
}
