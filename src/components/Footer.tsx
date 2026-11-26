import { getTranslations } from "next-intl/server";
import { Conta } from "./Conta";
import { textosConta } from "./textosConta";

const ISSUES = "https://github.com/MatheusFinatto/music/issues/new";

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="links">
          {/* O canal de retorno do site são as issues do GitHub: abertas, sem conta no site. */}
          <a href={ISSUES} target="_blank" rel="noreferrer">{t("issue")}</a>
          {/* A conta opcional (só o "G"): leva o progresso entre o site e os apps. */}
          <Conta t={await textosConta()} className="conta-rodape" />
        </div>
      </div>
    </footer>
  );
}
