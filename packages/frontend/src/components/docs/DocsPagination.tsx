'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getPrevNext } from '@/lib/docs/navigation';

export function DocsPagination() {
  const pathname = usePathname();
  const { prev, next } = getPrevNext(pathname);

  if (!prev && !next) return null;

  return (
    <div className="docs-pagination">
      {prev ? (
        <Link href={prev.href}>
          <span className="docs-pagination-label">&larr; Previous</span>
          <span className="docs-pagination-title">{prev.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link href={next.href}>
          <span className="docs-pagination-label">Next &rarr;</span>
          <span className="docs-pagination-title">{next.title}</span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
