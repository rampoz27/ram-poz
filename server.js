import express from 'express';
import cors from 'cors';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/scrape', async (req, res) => {
  try {
    const link = "jpkoloni4d.pagesco.de";

    const startDateParam = req.query.start; 
    const endDateParam = req.query.end;     

    let d1 = startDateParam ? new Date(startDateParam) : new Date();
    let d2 = endDateParam ? new Date(endDateParam) : new Date(new Date().setDate(d1.getDate() + 1));

    const t1 = d1.getDate();
    const t2 = d2.getDate();

    const bulan = d1.toLocaleString('id-ID', { month: 'long' }).toLowerCase();
    const tahun = d1.getFullYear();

    const linkLengkap = `https://${link}/prediksi-bola-${t1}-${t2}-${bulan}-${tahun}`;

    const response = await fetch(linkLengkap, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Halaman tidak ditemukan (Status ${response.status})` });
    }

    const htmlString = await response.text();
    const $ = cheerio.load(htmlString);

    let matches = [];

    // Menggunakan Selector DOM Elemen (Sejalan dengan logika DOMParser)
    $('section.league-block').each((_, block) => {
      const namaLiga = $(block).find('h3').text().trim() || 'LIGA LAIN';

      $(block).find('article.match-row').each((_, row) => {
        const jam = $(row).find('.match-time strong').text().trim();
        const tanggal = $(row).find('.match-time span').text().trim();
        
        const timElements = $(row).find('.match-teams b');
        const tim1 = $(timElements[0]).text().trim();
        const tim2 = $(timElements[1]).text().trim();

        const skor = $(row).find('.match-value').text().trim();

        if (tim1 && tim2) {
          matches.push({
            liga: namaLiga,
            waktu: jam ? `${jam} WIB` : '',
            tanggal: tanggal,
            home: tim1,
            away: tim2,
            skor: skor
          });
        }
      });
    });

    res.json({ url_used: linkLengkap, total: matches.length, data: matches });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});