import { Toaster as Sonner } from "sonner";

/** Sonner, drawn with the `app-toast` classes in styles.css. Mount once at the root. */
export function AppToaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      closeButton
      duration={3500}
      gap={8}
      offset={20}
      visibleToasts={3}
      className="app-toaster"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "app-toast",
          content: "app-toast__content",
          title: "app-toast__title",
          description: "app-toast__description",
          icon: "app-toast__icon",
          closeButton: "app-toast__close",
          success: "app-toast--success",
          error: "app-toast--error",
          warning: "app-toast--warning",
          info: "app-toast--info",
        },
      }}
    />
  );
}
