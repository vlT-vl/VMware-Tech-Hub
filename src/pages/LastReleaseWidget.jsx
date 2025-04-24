import { useEffect, useState } from 'react';
import axios from 'axios';
import * as cheerio from 'cheerio';
import vspherelogo from '../../res/vspherelogo.png';

const getReleases = async () => {
  const proxy = 'https://allorigins.hexlet.app/get?url=';

  const fetchAndParse = async (legacyId, type) => {
    try {
      const url = encodeURIComponent(`https://knowledge.broadcom.com/external/article?legacyId=${legacyId}`);
      const response = await axios.get(`${proxy}${url}`);
      const html = response.data.contents;
      const $ = cheerio.load(html);
      const versions = [];

      $('table tbody tr').each((_, el) => {
        const tds = $(el).find('td');
        if (tds.length < 5) return;

        const rawVersion = $(tds[0]).text().trim();
        const releaseName = $(tds[1]).text().trim();
        const releaseDate = $(tds[2]).text().trim();
        const buildNumber = $(tds[3]).text().trim();
        const typeField = $(tds[4]).text().trim();

        if (rawVersion.includes('7.')) {
          versions.push({ rawVersion, releaseName, releaseDate, buildNumber, type: typeField, major: '7', component: type });
        } else if (rawVersion.includes('8.')) {
          versions.push({ rawVersion, releaseName, releaseDate, buildNumber, type: typeField, major: '8', component: type });
        }
      });

      const latest7 = versions.filter(v => v.major === '7').sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))[0];
      const latest8 = versions.filter(v => v.major === '8').sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))[0];

      return { latest7, latest8 };
    } catch (err) {
      console.error(`Errore fetch/parsing ${type}:`, err);
      return { latest7: null, latest8: null };
    }
  };

  const [esxi, vcenter] = await Promise.all([
    fetchAndParse('2143832', 'ESXi'),
    fetchAndParse('2143838', 'vCenter')
  ]);

  return { esxi, vcenter };
};

const LastReleaseWidget = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getReleases().then(setData);
  }, []);

  return (
    <div className="widget">
      <img src={vspherelogo} alt="vSphere Logo" className="vsphere-logo" />
      {data ? (
        <>
          {['8', '7'].map(version => (
            <div key={version} className="release-group">
              <h4>vSphere {version} latest release</h4>
              <div className="release-group-wrapper">
                {[data.esxi[`latest${version}`], data.vcenter[`latest${version}`]].map((item, i) => (
                  item && (
                    <div className="release-card" key={`${item.component}-${version}-${i}`}>
                      <h5>{item.component} {version}</h5>
                      <p><strong>Versione:</strong> {item.rawVersion}</p>
                      <p><strong>Nome Release:</strong> {item.releaseName}</p>
                      <p><strong>Data Rilascio:</strong> {item.releaseDate}</p>
                      <p><strong>Build Number:</strong> {item.buildNumber}</p>
                      {item.component === 'ESXi' && <p><strong>Tipo:</strong> {item.type}</p>}
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <p>Caricamento dati in corso…</p>
      )}
    </div>
  );
};

export default LastReleaseWidget;
