import { redirect, useLoaderData } from 'react-router';

import { NEXT_PUBLIC_WEBAPP_URL } from '@documenso/lib/constants/app';
import { getDocumentByAccessToken } from '@documenso/lib/server-only/document/get-document-by-access-token';

import { DocumentCertificateQRView } from '~/components/general/document/document-certificate-qr-view';

import type { Route } from './+types/share.$slug';

export function meta({ params: { slug } }: Route.MetaArgs) {
  if (slug.startsWith('qr_')) {
    return undefined;
  }

  return [
    { title: 'MINIMA Sign - Share' },
    { description: 'I just signed a document in style with MINIMA Sign!' },
    {
      property: 'og:title',
      content: 'MINIMA Sign - Join the open source signing revolution',
    },
    {
      property: 'og:description',
      content: 'I just signed with MINIMA Sign!',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/share/${slug}/opengraph`,
    },
    {
      name: 'twitter:site',
      content: '@minimaworksbe',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/share/${slug}/opengraph`,
    },
    {
      name: 'twitter:description',
      content: 'I just signed with MINIMA Sign!',
    },
  ];
}

export const loader = async ({ request, params: { slug } }: Route.LoaderArgs) => {
  if (slug.startsWith('qr_')) {
    const document = await getDocumentByAccessToken({ token: slug });

    if (!document) {
      throw redirect('/');
    }

    return {
      document,
    };
  }

  const userAgent = request.headers.get('User-Agent') ?? '';

  if (/bot|facebookexternalhit|WhatsApp|google|bing|duckduckbot|MetaInspector/i.test(userAgent)) {
    return {};
  }

  // Is hardcoded because this whole meta is hardcoded anyway for MINIMA Sign.
  throw redirect('https://sign.minimaworks.be');
};

export default function SharePage() {
  const { document } = useLoaderData<typeof loader>();

  if (document) {
    return (
      <DocumentCertificateQRView
        documentId={document.id}
        title={document.title}
        documentData={document.documentData}
        password={document.documentMeta?.password}
        recipientCount={document.recipients?.length ?? 0}
        completedDate={document.completedAt ?? undefined}
      />
    );
  }

  return <div></div>;
}
