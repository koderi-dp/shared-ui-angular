import { provideZonelessChangeDetection, type ApplicationConfig } from "@angular/core";
import { provideRouter } from "@angular/router";
import { routes } from "./routes";

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideRouter(routes)],
};
