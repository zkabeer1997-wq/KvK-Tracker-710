'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export default function GalleryGrid({ images }) {
  const [selected, setSelected] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  return (
    <>
      <div className="gallery-grid">
        {images.map((image, index) => (
          <button key={image.id} type="button" className="gallery-item" onClick={() => setSelected(image)} aria-label={`Open ${image.title || image.alt_text}`}>
            <Image
              src={image.image_url}
              alt={image.alt_text}
              width={800}
              height={600}
              style={{ width: '100%', height: 'auto' }}
              sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw"
              priority={index < 3}
              loading={index < 3 ? undefined : 'lazy'}
            />
            {(image.title || image.caption) && (
              <span><strong>{image.title}</strong>{image.caption && <small>{image.caption}</small>}</span>
            )}
          </button>
        ))}
      </div>
      <dialog ref={dialogRef} className="gallery-lightbox" onClose={() => setSelected(null)} onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        {selected && (
          <div>
            <button type="button" className="gallery-lightbox-close" onClick={() => setSelected(null)} aria-label="Close image">×</button>
            <div style={{ position: 'relative', width: 'min(1200px, 94vw)', height: '78vh' }}>
              <Image
                src={selected.image_url}
                alt={selected.alt_text}
                fill
                sizes="(max-width: 1276px) 94vw, 1200px"
                style={{ objectFit: 'contain' }}
              />
            </div>
            {(selected.title || selected.caption) && <p><strong>{selected.title}</strong>{selected.caption && <span>{selected.caption}</span>}</p>}
          </div>
        )}
      </dialog>
    </>
  );
}

