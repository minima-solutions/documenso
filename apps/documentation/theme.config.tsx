import type { DocsThemeConfig } from 'nextra-theme-docs';
import { useConfig } from 'nextra-theme-docs';

const themeConfig: DocsThemeConfig = {
  logo: <span>MINIMA Sign</span>,
  head: function useHead() {
    const config = useConfig<{ title?: string; description?: string }>();

    const title = `${config.frontMatter.title} | MINIMA Sign Docs` || 'MINIMA Sign Docs';
    const description = config.frontMatter.description || 'The official MINIMA Sign documentation';

    return (
      <>
        <meta httpEquiv="Content-Language" content="en" />
        <meta name="title" content={title} />
        <meta name="og:title" content={title} />
        <meta name="description" content={description} />
        <meta name="og:description" content={description} />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        {/* <script
          dangerouslySetInnerHTML={{
            __html: `
            !function(){
             if (location.hostname === 'localhost') return;
              var e="6c236490c9a68c1",
                  t=function(){Reo.init({ clientID: e })},
                  n=document.createElement("script");
              n.src="https://static.reo.dev/"+e+"/reo.js";
              n.defer=true;
              n.onload=t;
              document.head.appendChild(n);
            }();
          `,
          }}
        /> */}
      </>
    );
  },
  project: {
    link: 'https://minimaworks.be/github',
  },
  chat: {
    link: 'https://minimaworks.be/teams',
  },
  docsRepositoryBase: 'https://github.com/minima-works/documenso/tree/main/apps/documentation',
  footer: {
    text: (
      <span>
        {new Date().getFullYear()} ©{' '}
        <a href="https://sign.minimaworks.be" target="_blank">
          MINIMA Sign
        </a>
        .
      </span>
    ),
  },
  primaryHue: 100,
  primarySaturation: 48.47,
  useNextSeoProps() {
    return {
      titleTemplate: '%s | MINIMA Sign Docs',
    };
  },
};

export default themeConfig;
