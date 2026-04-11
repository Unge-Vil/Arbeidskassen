import { getTranslations } from "next-intl/server";
import { BookdetSectionPage } from "../bookdet-section-page";

export default async function SokBookPage() {
  const t = await getTranslations("bookdetPages.searchBook");

  return (
    <BookdetSectionPage
      variant="storefront"
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      panelTitle={t("panelTitle")}
      primaryAction={{ label: t("primaryAction"), href: "/mine-bookinger" }}
      secondaryAction={{ label: t("secondaryAction"), href: "/oversikt" }}
      highlights={[
        { label: t("highlights.one.label"), value: t("highlights.one.value"), detail: t("highlights.one.detail") },
        { label: t("highlights.two.label"), value: t("highlights.two.value"), detail: t("highlights.two.detail") },
        { label: t("highlights.three.label"), value: t("highlights.three.value"), detail: t("highlights.three.detail") },
      ]}
      checklist={[t("checklist.one"), t("checklist.two"), t("checklist.three")]}
    />
  );
}
