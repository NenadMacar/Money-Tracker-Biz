import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#1e40af" />
        <meta name="description" content="Business finance tracker — MoFi" />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS home screen */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MoFi" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Android */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="MoFi" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
