const http = require('http');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const xml2js = require('xml2js');
const cron = require('node-cron');
const RSS = require('rss');
const RSSParser = require('rss-parser');
const {Feed} = require('feed');

const host = 'localhost';
const port = 8000;

const RSS_FILE = 'feed.xml';
const file = path.join(__dirname, RSS_FILE);

(async () => createOrSyncRssFile())();

const server = http
  .createServer(serverListener)
  .listen(port, host, () => {
    console.log(`
      Server is running on http://${host}:${port}
    `);
  });

function serverListener(req, response) {
  if (req.url === '/') {}

  if (req.url === '/feed.xml' || req.url === '/rss') {
    const stat = fs.statSync(file);

    response.writeHead(
      200,
      {
        'Content-Type': 'application/xml',
        'Content-Length': stat.size
      },
    );

    const readStream = fs.createReadStream(file);

    readStream.pipe(response);
  }

  if (req.url === '/feed/items') {
    return transformXmlToJson()
      .then((data) => {
        response.writeHead(
          200,
          {
            'Content-Type': 'application/json',
          },
        );

        response.write(JSON.stringify(data));
      });
  }
}

// pega da url d libsyn
async function getRssFromUrl() {
  const data = await fetch('https://feeds.libsyn.com/104268/spotify')
  return await data.text();
}
// cria se nao tiver
async function createRssFile() {
  const data = await getRssFromUrl();

  return await fs.writeFile(
    file,
    data,
    (err) => {
      if (err) {
        throw err;
      }

      console.log(`
        File is created successfully.
      `);
    },
  );
}

async function transformXmlToJson() {
  const rss = new RSSParser();
  const localFile = await fs.readFileSync(
    file,
    'utf-8',
  );
  const {items} = await rss.parseString(localFile);
  return items;
}

// sincroniza os dados
async function syncRssFile() {
  console.log(`
    RSS file is syncing...
  `);

  const rss = new RSSParser();
  const data = await rss.parseURL('https://feeds.libsyn.com/104268/spotify');
  // const localFile = await fs.readFileSync(
  //   file,
  //   'utf-8',
  // );
  // const dataStored = await rss.parseString(localFile);
  // const { items: [{ pubDate: lastPubDateFound }] } = dataStored;

  const {
    title,
    description,
    id,
    link,
    image,
    favicon,
    copyright,
    generator,
  } = data;

  const feed = new Feed({
    title,
    description,
    id,
    link,
    image,
    favicon,
    copyright,
    generator,
    items: data.items
  });

  // checa se há nova atualizacao
  // const lastUpdateDate = lastPubDateFound;
  // const isUpdated = new Date().toDateString() === lastPubDateFound;
  // console.log(`
  //   Last update was ${lastUpdateDate}
  // `);

  // if (!isUpdated) {
    // console.log(`
    //   Atualizando...
    // `)

    // const { items: [item] } = dataStored;

    data.items.forEach((item) => {
      feed.addItem(item);
    });


    fs.writeFileSync(file, feed.rss2());
    console.log(`
      Last item added was ${data.items[0].title} on ${data.items[0].pubDate}
    `);
  // }

}

// cria ou sincroniza, inicia
async function createOrSyncRssFile() {
  if (!fs.existsSync(file)) {
    return await createRssFile();
  }

  return await syncRssFile();
}


cron.schedule('*/1 * * * *', () => {
  syncRssFile();
});
