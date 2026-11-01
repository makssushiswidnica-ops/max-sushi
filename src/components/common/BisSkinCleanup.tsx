'use client';

import { useEffect } from 'react';

/**
 * Запобігає спаму та конфліктам гідрації від розширень браузера (Bitdefender тощо),
 * які додають атрибут bis_skin_checked до HTML-елементів.
 * Виконується виключно на клієнті через useEffect, не створюючи тегів <script> в JSX React 19.
 */
export function BisSkinCleanup() {
  useEffect(() => {
    try {
      const origSetAttr = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function (name, value) {
        if (name === 'bis_skin_checked') return;
        return origSetAttr.apply(this, arguments as any);
      };

      const origSetAttrNS = Element.prototype.setAttributeNS;
      Element.prototype.setAttributeNS = function (ns, name, value) {
        if (name === 'bis_skin_checked') return;
        return origSetAttrNS.apply(this, arguments as any);
      };

      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver((mutations) => {
          for (let i = 0; i < mutations.length; i++) {
            const m = mutations[i];
            if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
              (m.target as Element).removeAttribute('bis_skin_checked');
            }
          }
        });

        observer.observe(document.documentElement, {
          attributes: true,
          subtree: true,
          attributeFilter: ['bis_skin_checked'],
        });

        return () => observer.disconnect();
      }
    } catch {
      // Ігноруємо можливі помилки доступу до прототипів
    }
  }, []);

  return null;
}

