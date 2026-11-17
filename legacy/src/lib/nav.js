// Navegação do topo, igual em todas as páginas.
export function mountNav(current) {
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "Páginas");
  const pages = [["/laboratorio", "Laboratório", "home"], ["/laboratorio/diario", "Diário do Solo", "diario"], ["/laboratorio/piano", "Piano de Ideias", "piano"]];
  const brand = document.createElement("a"); brand.href = "/"; brand.className = "brand"; brand.textContent = "← Musical Tools";
  nav.append(brand);
  pages.forEach(([href, label, id]) => {
    const a = document.createElement("a"); a.href = href; a.textContent = label;
    if (id === current) a.setAttribute("aria-current", "page");
    nav.append(a);
  });
  return nav;
}
