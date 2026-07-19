import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/** Casca HTML do web: sem elástico do navegador e fundo no tom do app. */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style
           
          dangerouslySetInnerHTML={{
            __html: `
              html, body { overscroll-behavior-y: none; background: #F4F6FB; }
              @media (prefers-color-scheme: dark) { html, body { background: #0B1220; } }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
