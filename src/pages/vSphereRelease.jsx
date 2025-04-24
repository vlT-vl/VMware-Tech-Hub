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

      if (type === 'vCenter') {
        $('table tbody tr').each((_, el) => {
          const tds = $(el).find('td');
          if (tds.length < 4) return;

          const rawVersion = $(tds[0]).text().trim();
          if (!rawVersion || rawVersion.toLowerCase().includes('release name')) return;

          const releaseDate = $(tds[1]).text().trim();
          const buildNumber = $(tds[2]).text().trim();
          const installerBuild = $(tds[3]).text().trim();

          const majorMatch = rawVersion.match(/\d+\.\d+(?=\.|\s|\))/);
          const majorVersion = majorMatch ? majorMatch[0] : null;

          if (!majorVersion) return;

          versions.push({
            rawVersion,
            releaseName: rawVersion,
            releaseDate,
            buildNumber,
            installerBuild,
            type: 'N/A',
            component: type,
            major: majorVersion,
          });
        });
      } else {
        $('table tbody tr').each((_, el) => {
          const tds = $(el).find('td');
          if (tds.length < 5) return;

          const rawVersion = $(tds[0]).text().trim();
          if (!rawVersion || rawVersion.toLowerCase().includes('release name')) return;

          const releaseName = $(tds[1]).text().trim();
          const releaseDate = $(tds[2]).text().trim();
          const buildNumber = $(tds[3]).text().trim();
          const typeField = $(tds[4]).text().trim();

          const majorMatch = rawVersion.match(/\d+\.\d+(?=\.|\s|$)/);
          const majorVersion = majorMatch ? majorMatch[0] : null;

          if (!majorVersion) return;

          versions.push({
            rawVersion,
            releaseName,
            releaseDate,
            buildNumber,
            type: typeField,
            component: type,
            major: majorVersion,
          });
        });
      }

      return versions;
    } catch (err) {
      console.error(`Errore fetch/parsing ${type}:`, err);
      return [];
    }
  };

  const [esxi, vcenter] = await Promise.all([
    fetchAndParse('2143832', 'ESXi'),
    fetchAndParse('2143838', 'vCenter')
  ]);

  return { esxi, vcenter };
};

const vSphereRelease = () => {
  const [data, setData] = useState({ esxi: [], vcenter: [] });
  const [product, setProduct] = useState('ESXi');
  const [version, setVersion] = useState('All');

  useEffect(() => {
    getReleases().then(setData);
  }, []);

  const currentData = data[product.toLowerCase()];
  const filteredData = currentData.filter(d => version === 'All' || d.major === version);

  const availableVersions = Array.from(
    new Set(currentData.map(d => d.major).filter(Boolean))
  ).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  return (
    <div className="vsphere-release-page">
      <div className="vsphere-release-header">
        <img src={vspherelogo} alt="vSphere Logo" className="vsphere-release-logotitle" />
        <h2 className="vsphere-release-title">Release</h2>
      </div>

      <div className="vsphere-release-selectors">
        <select
          value={product}
          onChange={(e) => {
            const selectedProduct = e.target.value;
            setProduct(selectedProduct);
            setVersion('All');
          }}>
          <option value="ESXi">ESXi</option>
          <option value="vCenter">vCenter</option>
        </select>

        <select value={version} onChange={(e) => setVersion(e.target.value)}>
          <option value="All">Tutte le versioni</option>
          {availableVersions.map(ver => (
            <option key={ver} value={ver}>{ver}</option>
          ))}
        </select>
      </div>

      <table className="vsphere-release-table">
        <thead>
          <tr>
            <th>Versione</th>
            <th>Nome Release</th>
            <th>Data Rilascio</th>
            <th>Build Number</th>
            {product === 'ESXi' && <th>Tipo</th>}
            {product === 'vCenter' && <th>Installer Build</th>}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, idx) => {
            if (item.rawVersion.toLowerCase().includes('release name')) return null;
            return (
              <tr key={`${item.rawVersion}-${idx}`}>
                <td>{item.rawVersion}</td>
                <td>{item.releaseName}</td>
                <td>{item.releaseDate}</td>
                <td>{item.buildNumber}</td>
                {product === 'ESXi' && <td>{item.type}</td>}
                {product === 'vCenter' && <td>{item.installerBuild}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default vSphereRelease;
