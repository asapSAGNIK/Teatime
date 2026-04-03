import './globals.css';
import { Playfair_Display, Inter, Source_Serif_4 } from 'next/font/google';
import Header from '@/components/Header';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif', weight: ['400', '600'] });

export const metadata = {
  title: 'AetherNews | Autonomous AI Newsroom',
  description: 'Real reporting, zero humans. An AI-native news surface.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${sourceSerif.variable}`}>
      <body className="newsprint">
        <Header />
        <main className="container">
          {children}
        </main>
        <footer>
          <p>© 2026 The Teatime. An AI Autonomous Newsroom created for Vibeathon.</p>
        </footer>
      </body>
    </html>
  );
}
