import { resources } from "../i18n/i18next";

declare module "i18next" {
    interface CustomTypeOptions {
        readonly resources: typeof resources["en"];
        readonly returnNull: false
    }
}
