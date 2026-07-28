import { TemplateBuildFn } from "./shared";
import { buildClinicalTemplate } from "./clinical";
import { buildBoldTemplate } from "./bold";
import { buildSoftTemplate } from "./soft";
import { buildDataTemplate } from "./data";
import { buildHoneyTemplate } from "./honey";
import { buildMangoTemplate } from "./mango";
import { buildDeveloperTemplate } from "./developer";
import { buildTerminalTemplate } from "./terminal";

export const TEMPLATES: Record<string, TemplateBuildFn> = {
  clinical: buildClinicalTemplate,
  bold: buildBoldTemplate,
  soft: buildSoftTemplate,
  data: buildDataTemplate,
  honey: buildHoneyTemplate,
  mango: buildMangoTemplate,
  developer: buildDeveloperTemplate,
  terminal: buildTerminalTemplate,
};

export { getBgImageStyles } from "./shared";
export type { TemplateBuildFn } from "./shared";
