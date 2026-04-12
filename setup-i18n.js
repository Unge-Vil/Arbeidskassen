/**
 * @deprecated This script was used to scaffold i18n boilerplate across 7 separate
 * Next.js apps. After consolidation (Phase 7), there is only one app
 * (apps/arbeidskassen) and this script is no longer needed.
 *
 * Kept for reference only. Safe to delete.
 */
const fs = require('fs');
const path = require('path');

const appsDir = path.join(__dirname, 'apps');
const apps = fs.readdirSync(appsDir).filter(f => fs.statSync(path.join(appsDir, f)).isDirectory());

const requestTs = `import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(\`../messages/\${locale}.json\`)).default
  };
});
`;

const routingTs = `import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['no', 'en'],
  defaultLocale: 'no'
});

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
`;

const noJson = `{
  "common": {
    "loading": "Laster...",
    "save": "Lagre",
    "back": "Tilbake"
  }
}`;

const enJson = `{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "back": "Back"
  }
}`;

const middlewareTs = `import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(no|en)/:path*']
};
`;

apps.forEach(appName => {
  const appPath = path.join(appsDir, appName);
  
  // 1. Create messages
  fs.mkdirSync(path.join(appPath, 'messages'), {recursive: true});
  fs.writeFileSync(path.join(appPath, 'messages', 'no.json'), noJson);
  fs.writeFileSync(path.join(appPath, 'messages', 'en.json'), enJson);

  // 2. Create i18n configure
  fs.mkdirSync(path.join(appPath, 'i18n'), {recursive: true});
  fs.writeFileSync(path.join(appPath, 'i18n', 'request.ts'), requestTs);
  fs.writeFileSync(path.join(appPath, 'i18n', 'routing.ts'), routingTs);

  // 3. Create/update middleware.ts
  fs.writeFileSync(path.join(appPath, 'middleware.ts'), middlewareTs);

  // 4. Update next.config.ts
  const nextConfigPath = path.join(appPath, 'next.config.ts');
  if (fs.existsSync(nextConfigPath)) {
    let content = fs.readFileSync(nextConfigPath, 'utf8');
    if (!content.includes('withNextIntl')) {
        content = content.replace(
        'import type { NextConfig } from "next";',
        'import type { NextConfig } from "next";\\nimport createNextIntlPlugin from "next-intl/plugin";\\n\\nconst withNextIntl = createNextIntlPlugin("./i18n/request.ts");'
        );
        content = content.replace(
        'export default nextConfig;',
        'export default withNextIntl(nextConfig);'
        );
        fs.writeFileSync(nextConfigPath, content);
    }
  }

  // 5. Move app content to app/[locale]
  const appDir = path.join(appPath, 'app');
  const localeDir = path.join(appDir, '[locale]');
  if (fs.existsSync(appDir) && !fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir);
      
      const filesToMove = fs.readdirSync(appDir).filter(f => f !== '[locale]');
      filesToMove.forEach(f => {
          fs.renameSync(path.join(appDir, f), path.join(localeDir, f));
      });
      
      // We must patch the layout to include NextIntlClientProvider and params
      const layoutPath = path.join(localeDir, 'layout.tsx');
      if (fs.existsSync(layoutPath)) {
          let layoutContent = fs.readFileSync(layoutPath, 'utf8');
          // simple inject wrapper
          if(!layoutContent.includes('NextIntlClientProvider')) {
              layoutContent = layoutContent.replace(
                  'export default function RootLayout({',
                  `import {NextIntlClientProvider} from 'next-intl';\\nimport {getMessages} from 'next-intl/server';\\n\\nexport default async function RootLayout({`
              );
              
              // Note the props are async in next 15 for locale
              layoutContent = layoutContent.replace(
                  'children: React.ReactNode;',
                  'children: React.ReactNode; params: Promise<{locale: string}>;'
              );
              
              layoutContent = layoutContent.replace(
                'return (',
                'const {locale} = await params;\\n  const messages = await getMessages();\\n\\n  return ('
              );
              
              layoutContent = layoutContent.replace(
                '<html lang="en"',
                '<html lang={locale}'
              );
              
              layoutContent = layoutContent.replace(
                  '<body',
                  '<body'
              );
              layoutContent = layoutContent.replace(
                  '{children}',
                  '<NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>'
              );
              
              fs.writeFileSync(layoutPath, layoutContent);
          }
      }
  }
});
console.log("Done");