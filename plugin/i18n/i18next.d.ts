import { ressources } from "./i18next";

declare module "i18next" {
    interface CustomTypeOptions {
        readonly resources: typeof ressources["en"];
        readonly returnNull: false
    }
}
