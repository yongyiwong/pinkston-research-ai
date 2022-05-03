import '../styles/globals.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    document.getElementById('__next').className = 'h-full';
  }, []);
  return <Component {...pageProps} />;
}

export default MyApp;
