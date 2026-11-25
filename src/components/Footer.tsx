import { getTranslations } from "next-intl/server";
import { BackupDados } from "./BackupDados";

const ISSUES = "https://github.com/MatheusFinatto/music/issues/new";

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="links">
          {/* O canal de retorno do site são as issues do GitHub: abertas, sem conta no site. */}
          <a href={ISSUES} target="_blank" rel="noreferrer">{t("issue")}</a>
          <BackupDados t={{
            abrir: t("backup"), titulo: t("backup"), texto: t("backupTexto"), baixar: t("backupBaixar"), restaurar: t("backupRestaurar"),
            baixado: t("backupBaixado"), restaurado: t("backupRestaurado"), erro: t("backupErro"), fechar: t("fechar"),
          }} />
        </div>
      </div>
    </footer>
  );
}
