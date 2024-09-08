// pages/_app.tsx
import { AppProps } from 'next/app';
import Head from 'next/head';
import { CssBaseline } from '@mui/material';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SSL-Generator</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <CssBaseline />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
