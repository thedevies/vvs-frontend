import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';

interface InAppPdfModalProps {
  visible: boolean;
  pdfUrl: string | null;
  title?: string;
  onClose: () => void;
}

// Refined accent palette — a deep rose/burgundy reads as a certified
// document product rather than a bright, generic app color.
const ACCENT = '#9C2B4E';
const ACCENT_SOFT = 'rgba(156, 43, 78, 0.12)';

// Fixed render scale — pinch-to-zoom is still available natively in the
// WebView (the viewport meta tag below allows it), so no on-screen +/-
// controls are needed.
const RENDER_SCALE = 1.4;

export default function InAppPdfModal({
  visible,
  pdfUrl,
  title = 'Biodata Document',
  onClose,
}: InAppPdfModalProps) {
  const [loading, setLoading] = useState(true);
  const [cachedPath, setCachedPath] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const webViewRef = useRef<WebView>(null);
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible && pdfUrl) {
      setLoading(true);
      setNumPages(1);
      cachePdfInApp(pdfUrl);
    } else {
      setCachedPath(null);
    }
  }, [visible, pdfUrl]);

  const cachePdfInApp = async (url: string) => {
    try {
      const fileName = `biodata_${Date.now()}.pdf`;
      const targetPath = `${FileSystem.cacheDirectory}${fileName}`;
      console.log('[InAppPdfModal] Caching PDF in app sandbox:', targetPath);

      // Download directly to private app cache (not visible in File Manager)
      const downloadResult = await FileSystem.downloadAsync(url, targetPath);
      setCachedPath(downloadResult.uri);
    } catch (err) {
      console.warn('[InAppPdfModal] Cache error, falling back to direct URL:', err);
      setCachedPath(null);
    }
  };

  const pdfHtml = useMemo(() => {
    if (!pdfUrl) return '';
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          background-color: ${isDark ? '#0F0F11' : '#F4F4F6'} !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 12px 56px 12px;
          min-height: 100vh;
        }
        .pdf-page-wrapper {
          margin-bottom: 18px;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(0, 0, 0, ${isDark ? '0.55' : '0.10'});
          background-color: #FFFFFF;
          border: 1px solid ${isDark ? '#26262A' : '#E8E8EC'};
        }
        canvas {
          display: block;
          max-width: 100%;
          height: auto !important;
        }
        #loading-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 70vh;
          color: ${isDark ? '#E9E9EC' : '#1C1C1E'};
        }
        .spinner {
          width: 34px;
          height: 34px;
          border: 3px solid ${ACCENT_SOFT};
          border-top-color: ${ACCENT};
          border-radius: 50%;
          animation: spin 0.85s linear infinite;
          margin-bottom: 14px;
        }
        .loading-label {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.2px;
          color: ${isDark ? '#C9C9CE' : '#6B6B70'};
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div id="loading-box">
        <div class="spinner"></div>
        <div class="loading-label">Preparing document…</div>
      </div>
      <div id="pdf-container"></div>

      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        const url = '${pdfUrl}';
        const container = document.getElementById('pdf-container');
        const loadingBox = document.getElementById('loading-box');

        pdfjsLib.getDocument({ url: url, withCredentials: false }).promise.then(function(pdf) {
          loadingBox.style.display = 'none';

          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NUM_PAGES', numPages: pdf.numPages }));
          }

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            pdf.getPage(pageNum).then(function(page) {
              const viewport = page.getViewport({ scale: ${RENDER_SCALE} });
              const wrapper = document.createElement('div');
              wrapper.className = 'pdf-page-wrapper';

              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              wrapper.appendChild(canvas);
              container.appendChild(wrapper);

              page.render({ canvasContext: context, viewport: viewport });
            });
          }
        }).catch(function(error) {
          console.error('PDF.js Render Error:', error);
          loadingBox.innerHTML = '<div style="color: #D64545; font-weight: 600; padding: 20px; text-align: center; font-size: 13px;">Unable to load the document. Please check your connection and try again.</div>';
        });
      </script>
    </body>
    </html>
  `;
  }, [pdfUrl, isDark]);

  if (!visible || !pdfUrl) return null;

  // Determine fallback view URL if offline
  const fallbackUrl = Platform.OS === 'android'
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`
    : cachedPath || pdfUrl;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'NUM_PAGES' && data.numPages) {
        setNumPages(data.numPages);
      }
    } catch {
      // ignore
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent={true}
        backgroundColor="transparent"
      />
      {/*
        True full screen layout wrapping the main contents, with status bar height filler
        drawn matching colors.card to eliminate any empty/vacant space at the top.
      */}
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ height: insets.top, backgroundColor: colors.card }} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* ── Header ── */}
          <View
            style={[
              styles.header,
              { backgroundColor: colors.card, borderBottomColor: colors.border },
            ]}
          >
            <TouchableOpacity
              onPress={onClose}
              style={[styles.iconBtn, { backgroundColor: colors.background }]}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <ThemedText style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {title}
              </ThemedText>
              <View style={styles.secureTagRow}>
                <Ionicons name="shield-checkmark" size={11} color={ACCENT} />
                <ThemedText style={[styles.secureTagText, { color: ACCENT }]}>
                  Verified Biodata{numPages > 0 ? `  ·  ${numPages} ${numPages === 1 ? 'Page' : 'Pages'}` : ''}
                </ThemedText>
              </View>
            </View>

            {/* Spacer keeps the title visually centered against the close button */}
            <View style={styles.iconBtn} />
          </View>

          {/* ── PDF Viewer ── */}
          <View style={{ flex: 1, position: 'relative' }}>
            <WebView
              ref={webViewRef}
              source={{ html: pdfHtml, baseUrl: 'https://cdnjs.cloudflare.com' }}
              style={{ flex: 1, backgroundColor: isDark ? '#0F0F11' : '#F4F4F6' }}
              onMessage={handleMessage}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                console.warn('[InAppPdfModal] Falling back to direct viewer URL');
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
                  <ActivityIndicator size="large" color={ACCENT} />
                  <ThemedText style={[styles.loaderText, { color: colors.text }]}>
                    Opening document
                  </ThemedText>
                  <ThemedText style={[styles.loaderSub, { color: colors.muted }]}>
                    Rendering high-resolution pages
                  </ThemedText>
                </View>
              )}
            />

            {loading && (
              <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={ACCENT} />
                <ThemedText style={[styles.loaderText, { color: colors.text }]}>
                  Loading document
                </ThemedText>
              </View>
            )}
          </View>

          {/* ── Footer ── */}
          <View
            style={[
              styles.footer,
              { backgroundColor: colors.card, borderTopColor: colors.border },
            ]}
          >
            <Ionicons name="lock-closed" size={12} color={colors.muted} />
            <ThemedText style={[styles.footerText, { color: colors.muted }]}>
              Securely cached on this device · Confidential
            </ThemedText>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeTop: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  secureTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  secureTagText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  loaderText: {
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 8,
  },
  loaderSub: {
    fontSize: 12,
  },
  footer: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
});