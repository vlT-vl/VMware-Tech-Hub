import { useEffect, useState } from 'react';
import axios from 'axios';
import * as cheerio from 'cheerio';

const proxy = 'https://allorigins.hexlet.app/get?url=';

const feedsByLang = {
  it: [
    {
      url: 'https://www.vmug.it/feed/',
      source: 'vmware'
    }
  ],
  en: [
    {
      url: 'https://blogs.vmware.com/feed/',
      source: 'vmware'
    },
    {
      url: 'https://newsroom.broadcom.com/rss/news-releases',
      source: 'broadcom'
    }
  ]
};

export default function RssNewsWidget() {
  const [items, setItems] = useState([]);
  const [lang, setLang] = useState('it');

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const feeds = feedsByLang[lang];

        const allItems = await Promise.all(
          feeds.map(async ({ url, source }) => {
            try {
              const res = await axios.get(`${proxy}${encodeURIComponent(url)}`);
              const xml = res.data.contents;
              const $ = cheerio.load(xml, { xmlMode: true });

              const parsed = [];

              const promises = $('item').map(async (_, el) => {
                const title = $(el).find('title').text().trim();
                const link = $(el).find('link').text().trim();
                const pubDate = $(el).find('pubDate').text().trim();

                // Descrizione: prima da <description>, poi fallback su <content:encoded>
                let description = $(el).find('description').text().trim();
                if (!description) {
                  description = $(el).find('content\\:encoded').text().trim();
                }

                let image = null;

                if (source === 'vmware' && lang === 'it' && link) {
                  try {
                    const pageRes = await axios.get(`${proxy}${encodeURIComponent(link)}`);
                    const $$ = cheerio.load(pageRes.data.contents);

                    const featuredImg = $$('img.wp-post-image').attr('src');
                    if (
                      featuredImg &&
                      /\.(jpg|jpeg|png|webp)$/i.test(featuredImg)
                    ) {
                      image = featuredImg;
                    }

                    if (!image) {
                      const ogImg = $$('meta[property="og:image"]').attr('content');
                      if (
                        ogImg &&
                        /\.(jpg|jpeg|png|webp)$/i.test(ogImg)
                      ) {
                        image = ogImg;
                      }
                    }
                  } catch (err) {
                    console.warn('Errore durante il fetch dell\'articolo:', err.message);
                  }
                }

                if (title && link) {
                  parsed.push({
                    title,
                    link,
                    description,
                    pubDate,
                    source,
                    image
                  });
                }
              }).get();

              await Promise.all(promises);
              return parsed;
            } catch (err) {
              console.error(`Errore parsing XML da ${url}:`, err);
              return [];
            }
          })
        );

        const merged = allItems.flat().sort((a, b) =>
          new Date(b.pubDate) - new Date(a.pubDate)
        );

        setItems(merged.slice(0, 5));
      } catch (err) {
        console.error('Errore fetch RSS:', err);
      }
    };

    fetchFeeds();
  }, [lang]);

  return (
    <div className="widget">
      <div className="rss-header">
        <h3>📰 News dal mondo VMware & Broadcom</h3>
        <select
          className="rss-lang-select"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          <option value="it">🇮🇹 IT</option>
          <option value="en">🇬🇧 EN</option>
        </select>
      </div>

      <div className="rss-container">
        {items.map((item, i) => (
          <div key={i} className="rss-post">
            <div className={`rss-icon rss-icon-${item.source}`} />
            <h4 className="rss-title">{item.title}</h4>
            <p className="rss-date">
              {item.pubDate ? new Date(item.pubDate).toLocaleDateString() : ''}
            </p>
            {item.image && (
              <div className="rss-thumb-wrapper">
                <img src={item.image} alt="anteprima" className="rss-thumb" />
              </div>
            )}
            <div
              className={`rss-description ${
                lang === 'it' && item.source === 'vmware' ? 'rss-vmug-cleanup' : ''
              }`}
              dangerouslySetInnerHTML={{
                __html: item.description || '<em>Contenuto non disponibile</em>'
              }}
            />
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="rss-button"
            >
              Leggi →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
