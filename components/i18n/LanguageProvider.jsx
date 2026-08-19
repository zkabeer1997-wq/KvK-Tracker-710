'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'k710-language-v1';
const CACHE_PREFIX = 'k710-ui-translations-v1:';
const BATCH_SIZE = 48;

const LanguageContext = createContext({
  language: 'English',
  hasChosenLanguage: false,
  openLanguageChooser: () => {},
});

const SUGGESTED_LANGUAGES = [
  ['English', 'English'],
  ['Arabic', 'العربية'],
  ['French', 'Français'],
  ['Turkish', 'Türkçe'],
  ['Korean', '한국어'],
  ['Spanish', 'Español'],
  ['German', 'Deutsch'],
  ['Portuguese', 'Português'],
  ['Italian', 'Italiano'],
  ['Dutch', 'Nederlands'],
  ['Polish', 'Polski'],
  ['Russian', 'Русский'],
  ['Ukrainian', 'Українська'],
  ['Greek', 'Ελληνικά'],
  ['Romanian', 'Română'],
  ['Czech', 'Čeština'],
  ['Hungarian', 'Magyar'],
  ['Swedish', 'Svenska'],
  ['Norwegian', 'Norsk'],
  ['Danish', 'Dansk'],
  ['Finnish', 'Suomi'],
  ['Chinese (Simplified)', '简体中文'],
  ['Chinese (Traditional)', '繁體中文'],
  ['Japanese', '日本語'],
  ['Hindi', 'हिन्दी'],
  ['Urdu', 'اردو'],
  ['Bengali', 'বাংলা'],
  ['Punjabi', 'ਪੰਜਾਬੀ'],
  ['Gujarati', 'ગુજરાતી'],
  ['Marathi', 'मराठी'],
  ['Tamil', 'தமிழ்'],
  ['Telugu', 'తెలుగు'],
  ['Malayalam', 'മലയാളം'],
  ['Thai', 'ไทย'],
  ['Vietnamese', 'Tiếng Việt'],
  ['Indonesian', 'Bahasa Indonesia'],
  ['Malay', 'Bahasa Melayu'],
  ['Filipino', 'Filipino'],
  ['Persian', 'فارسی'],
  ['Hebrew', 'עברית'],
  ['Swahili', 'Kiswahili'],
  ['Afrikaans', 'Afrikaans'],
];

const RTL_LANGUAGE_RE = /\b(arabic|hebrew|persian|farsi|urdu|pashto|sorani|kurdish|yiddish|uyghur)\b/i;
const BLOCKED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE']);

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function preserveWhitespace(raw, translated) {
  const prefix = raw.match(/^\s*/)?.[0] || '';
  const suffix = raw.match(/\s*$/)?.[0] || '';
  return `${prefix}${translated}${suffix}`;
}

function isEnglish(language) {
  return /^english(?:\s*\(.*\))?$/i.test(normalize(language));
}

function shouldSkipElement(element) {
  if (!element) return true;
  if (BLOCKED_TAGS.has(element.tagName)) return true;
  return Boolean(element.closest?.('[data-k710-no-translate], .notranslate, [translate="no"]'));
}

function readCache(language) {
  if (typeof window === 'undefined') return new Map();
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${language}`);
    const parsed = raw ? JSON.parse(raw) : {};
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

function writeCache(language, cache) {
  try {
    const entries = [...cache.entries()].slice(-1800);
    localStorage.setItem(`${CACHE_PREFIX}${language}`, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Storage limits/private browsing are non-fatal.
  }
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export default function LanguageProvider({ children }) {
  const pathname = usePathname();
  const [language, setLanguage] = useState('English');
  const [hasChosenLanguage, setHasChosenLanguage] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [inputLanguage, setInputLanguage] = useState('English');
  const [manifest, setManifest] = useState(null);
  const [translationStatus, setTranslationStatus] = useState('idle');

  const languageRef = useRef('English');
  const cacheRef = useRef(new Map());
  const originalTextRef = useRef(new WeakMap());
  const originalAttrRef = useRef(new WeakMap());
  const trackedTextNodesRef = useRef(new Set());
  const trackedElementsRef = useRef(new Set());
  const observerRef = useRef(null);
  const scheduleRef = useRef(null);
  const processingRef = useRef(false);
  const queuedRef = useRef(false);

  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }

    if (saved) {
      setLanguage(saved);
      setInputLanguage(saved);
      languageRef.current = saved;
      cacheRef.current = readCache(saved);
      setHasChosenLanguage(true);
    } else {
      setChooserOpen(true);
      setHasChosenLanguage(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/ui-strings.json', { cache: 'force-cache' })
      .then((response) => (response.ok ? response.json() : []))
      .then((values) => {
        if (!active) return;
        setManifest(new Set(Array.isArray(values) ? values.map(normalize) : []));
      })
      .catch(() => {
        if (active) setManifest(new Set());
      });
    return () => {
      active = false;
    };
  }, []);

  const restoreTracked = useCallback(() => {
    for (const node of [...trackedTextNodesRef.current]) {
      if (!node.isConnected) {
        trackedTextNodesRef.current.delete(node);
        continue;
      }
      const original = originalTextRef.current.get(node);
      if (original && node.nodeValue !== original.raw) node.nodeValue = original.raw;
    }

    for (const element of [...trackedElementsRef.current]) {
      if (!element.isConnected) {
        trackedElementsRef.current.delete(element);
        continue;
      }
      const attrs = originalAttrRef.current.get(element);
      if (!attrs) continue;
      for (const [name, original] of attrs.entries()) {
        if (element.hasAttribute(name) && element.getAttribute(name) !== original) {
          element.setAttribute(name, original);
        }
      }
    }
  }, []);

  const requestTranslations = useCallback(async (items, targetLanguage) => {
    const results = new Map();
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const response = await fetch('/api/translate-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: targetLanguage, strings: batch }),
      });
      if (!response.ok) throw new Error(`Translation failed (${response.status})`);
      const data = await response.json();
      if (!Array.isArray(data?.translated) || data.translated.length !== batch.length) {
        throw new Error('Translation response shape mismatch');
      }
      batch.forEach((source, index) => results.set(source, data.translated[index]));
    }
    return results;
  }, []);

  const processDocument = useCallback(async () => {
    if (!manifest || processingRef.current || typeof document === 'undefined') {
      queuedRef.current = true;
      return;
    }

    processingRef.current = true;
    queuedRef.current = false;
    const targetLanguage = languageRef.current;

    try {
      if (isEnglish(targetLanguage)) {
        restoreTracked();
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
        setTranslationStatus('idle');
        return;
      }

      document.documentElement.lang = 'und';
      document.documentElement.dir = RTL_LANGUAGE_RE.test(targetLanguage) ? 'rtl' : 'ltr';

      const needed = new Set();
      const textTargets = [];
      const attrTargets = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();

      while (node) {
        const parent = node.parentElement;
        if (!shouldSkipElement(parent)) {
          let original = originalTextRef.current.get(node);
          if (!original) {
            const normalized = normalize(node.nodeValue);
            if (normalized && manifest.has(normalized)) {
              original = { raw: node.nodeValue, normalized };
              originalTextRef.current.set(node, original);
              trackedTextNodesRef.current.add(node);
            }
          }

          if (original) {
            textTargets.push([node, original]);
            if (!cacheRef.current.has(original.normalized)) needed.add(original.normalized);
          }
        }
        node = walker.nextNode();
      }

      const elements = document.body.querySelectorAll('[placeholder], [title], [aria-label]');
      for (const element of elements) {
        if (shouldSkipElement(element)) continue;
        let originals = originalAttrRef.current.get(element);
        if (!originals) {
          originals = new Map();
          originalAttrRef.current.set(element, originals);
        }

        for (const name of ['placeholder', 'title', 'aria-label']) {
          if (!element.hasAttribute(name)) continue;
          if (!originals.has(name)) {
            const raw = element.getAttribute(name);
            const normalized = normalize(raw);
            if (normalized && manifest.has(normalized)) originals.set(name, raw);
          }
          const raw = originals.get(name);
          if (!raw) continue;
          const normalized = normalize(raw);
          attrTargets.push([element, name, raw, normalized]);
          trackedElementsRef.current.add(element);
          if (!cacheRef.current.has(normalized)) needed.add(normalized);
        }
      }

      if (needed.size) {
        setTranslationStatus('translating');
        const translated = await requestTranslations([...needed], targetLanguage);
        if (languageRef.current !== targetLanguage) return;
        for (const [source, value] of translated.entries()) cacheRef.current.set(source, value);
        writeCache(targetLanguage, cacheRef.current);
      }

      if (languageRef.current !== targetLanguage) return;

      for (const [textNode, original] of textTargets) {
        if (!textNode.isConnected) continue;
        const translated = cacheRef.current.get(original.normalized);
        if (!translated) continue;
        const nextValue = preserveWhitespace(original.raw, translated);
        if (textNode.nodeValue !== nextValue) textNode.nodeValue = nextValue;
      }

      for (const [element, name, raw, normalized] of attrTargets) {
        if (!element.isConnected) continue;
        const translated = cacheRef.current.get(normalized);
        if (!translated) continue;
        const nextValue = translated || raw;
        if (element.getAttribute(name) !== nextValue) element.setAttribute(name, nextValue);
      }

      setTranslationStatus('ready');
    } catch (error) {
      console.error('K710 UI translation failed', error);
      setTranslationStatus('error');
    } finally {
      processingRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        window.setTimeout(() => processDocument(), 80);
      }
    }
  }, [manifest, requestTranslations, restoreTracked]);

  const scheduleTranslation = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (scheduleRef.current) window.clearTimeout(scheduleRef.current);
    scheduleRef.current = window.setTimeout(() => processDocument(), 120);
  }, [processDocument]);

  useEffect(() => {
    if (!manifest || !hasChosenLanguage) return undefined;

    scheduleTranslation();
    observerRef.current?.disconnect();
    observerRef.current = new MutationObserver(() => scheduleTranslation());
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });

    return () => {
      observerRef.current?.disconnect();
      if (scheduleRef.current) window.clearTimeout(scheduleRef.current);
    };
  }, [manifest, hasChosenLanguage, pathname, scheduleTranslation]);

  useEffect(() => {
    if (!manifest || !hasChosenLanguage) return;
    window.setTimeout(() => scheduleTranslation(), 60);
  }, [pathname, manifest, hasChosenLanguage, scheduleTranslation]);

  const applyLanguage = useCallback(
    (nextLanguage) => {
      const clean = normalize(nextLanguage) || 'English';
      restoreTracked();
      setLanguage(clean);
      setInputLanguage(clean);
      languageRef.current = clean;
      cacheRef.current = readCache(clean);
      setHasChosenLanguage(true);
      setChooserOpen(false);
      try {
        localStorage.setItem(STORAGE_KEY, clean);
      } catch {
        // Non-fatal.
      }
      window.setTimeout(() => scheduleTranslation(), 0);
    },
    [restoreTracked, scheduleTranslation],
  );

  const openLanguageChooser = useCallback(() => {
    setInputLanguage(languageRef.current || 'English');
    setChooserOpen(true);
  }, []);

  const contextValue = useMemo(
    () => ({ language, hasChosenLanguage, openLanguageChooser }),
    [language, hasChosenLanguage, openLanguageChooser],
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}

      {chooserOpen && (
        <div className="k710-language-overlay" data-k710-no-translate role="dialog" aria-modal="true" aria-labelledby="k710-language-title">
          <div className="k710-language-panel">
            <div className="k710-language-crest" aria-hidden="true">710</div>
            <p className="k710-language-eyebrow">KINGDOM 710</p>
            <h1 id="k710-language-title">Choose your language</h1>
            <p className="k710-language-multilingual">
              اختر لغتك · Choisissez votre langue · Dilinizi seçin · 언어 선택 · Elige tu idioma
            </p>
            <p className="k710-language-copy">
              The hub will translate its interface into your chosen language. You can change this at any time.
            </p>

            <label className="k710-language-label" htmlFor="k710-language-input">Language</label>
            <input
              id="k710-language-input"
              className="k710-language-input"
              list="k710-language-options"
              value={inputLanguage}
              onChange={(event) => setInputLanguage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyLanguage(inputLanguage);
              }}
              placeholder="Search or type any language"
              autoComplete="off"
              autoFocus
            />
            <datalist id="k710-language-options">
              {SUGGESTED_LANGUAGES.map(([name, native]) => (
                <option key={name} value={name}>{native}</option>
              ))}
            </datalist>

            <button type="button" className="k710-language-enter" onClick={() => applyLanguage(inputLanguage)}>
              Enter the Kingdom
            </button>
            <p className="k710-language-footnote">Any language name is accepted — the list above is only a shortcut.</p>
          </div>
        </div>
      )}

      {hasChosenLanguage && !chooserOpen && (
        <button
          type="button"
          className="k710-language-switcher"
          onClick={openLanguageChooser}
          data-k710-no-translate
          aria-label={`Change language. Current language: ${language}`}
          title="Change language"
        >
          <span aria-hidden="true">🌐</span>
          <span>{language}</span>
          {translationStatus === 'translating' && <span className="k710-language-spinner" aria-hidden="true" />}
        </button>
      )}
    </LanguageContext.Provider>
  );
}
