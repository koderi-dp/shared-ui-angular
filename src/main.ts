import { bootstrapApplication } from "@angular/platform-browser";
import { KoDemoApp } from "./demo/app.component";
import { appConfig } from "./demo/app.config";

bootstrapApplication(KoDemoApp, appConfig).catch((err: unknown) => console.error(err));
