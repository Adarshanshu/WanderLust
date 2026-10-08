# WanderLust

WanderLust is a server-rendered rental listing website built with Express, EJS,
and MongoDB. Users can browse and search stays, create listings with Cloudinary
images, view a location map, and add reviews.

## Features

- Browse listings and search by title, description, location, or country
- Filter listings by stay type: hotels, homes, villas, beach stays, mountain
  stays, cabins, lake stays, and apartments
- Sign up and log in with Passport Local
- Create listings; edit or delete listings you own
- Upload listing photos directly to Cloudinary or provide an image URL
- Add reviews and delete your own reviews
- Store login sessions in MongoDB Atlas with `connect-mongo`
- View a Google Maps location search on each listing detail page

## Requirements

- Node.js 24 (the version declared by this project in `package.json`)
- npm
- A MongoDB Atlas database
- A Cloudinary account for image uploads

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   NODE_ENV=development
   ATLASDB_URL=mongodb+srv://DB_USER:URL_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/WanderLust?retryWrites=true&w=majority
   SESSION_SECRET=replace-with-a-long-random-secret
   CLOUD_NAME=your-cloudinary-cloud-name
   CLOUD_API_KEY=your-cloudinary-api-key
   CLOUD_API_SECRET=your-cloudinary-api-secret
   ```

   Use your own values. URL-encode special characters in the MongoDB username
   and password. Generate a random session secret locally, for example:

   ```sh
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

3. In MongoDB Atlas, create a database user and allow connections from your
   development IP. For deployment, allow the hosting service's outbound IPs.
4. Start the application:

   ```sh
   npm start
   ```

5. Open <http://localhost:8080/listings>.

The app connects to MongoDB before it starts listening. It reads `.env` in
development. In production, set environment variables in the hosting provider;
the app requires `ATLASDB_URL` and `SESSION_SECRET` there.

## Image uploads

The new listing form accepts JPG, PNG, WEBP, and GIF images up to 5 MB. Multer
streams uploaded files to Cloudinary using the storage adapter in
`cloudConfig.js`. The listing stores the Cloudinary secure URL and public ID.
The Cloudinary API secret must stay on the server and must not be committed.

## Search and maps

The navbar search submits to `/listings` with a keyword and optional stay type.
Keywords are matched case-insensitively against listing titles, descriptions,
locations, and countries. Category buttons on the listings page filter the
current results. Older listings without a category are grouped from keywords
in their title and description.

Each listing detail page displays a map search based on its location and
country. The map points to the matched place or area; an exact property pin
requires storing precise coordinates or an address.

## Authentication and sessions

Passport Local and `passport-local-mongoose` handle accounts. Sessions are
stored in the Atlas database's `sessions` collection. In production, configure
`SESSION_SECRET` as a stable, randomly generated secret. The app uses secure
cookies and trusts one reverse-proxy hop in production, so deploy behind HTTPS.

## Deployment

1. Push the project, including `package-lock.json`, to your deployment host.
2. Use `npm install` as the build/install command and `npm start` as the start
   command.
3. Configure these environment variables in the host dashboard:
   - `NODE_ENV=production`
   - `PORT` (usually provided automatically by the host)
   - `ATLASDB_URL`
   - `SESSION_SECRET`
   - `CLOUD_NAME`
   - `CLOUD_API_KEY`
   - `CLOUD_API_SECRET`
4. Make sure Atlas Network Access permits the host to connect and the database
   user can access the `WanderLust` database.
5. Deploy over HTTPS, then verify signup, login across refreshes, listing
   creation, image upload, search, reviews, and logout.

## Project structure

```text
app.js                    Express setup and active route handlers
cloudConfig.js            Cloudinary config and Multer storage adapter
middleware.js             Login, flash, and ownership middleware
models/                   Mongoose User, Listing, and Review models
views/                    EJS pages, includes, and shared layout
public/CSS/style.css      Application styles
public/js/                Form validation and listing category filters
init/data.js              Sample listing data
init/index.js             Sample data seeding script
routes/                   Older commented route examples; not mounted
```

## Sample data warning

`init/index.js` currently targets a local MongoDB URI and deletes all listings
before seeding. Only run it against a disposable development database. Never
point it at production Atlas data. Update its connection string before using it
with a different database.

## Scripts

- `npm start` - start the web server
- `npm test` - currently a placeholder that exits with an error; no automated
  test suite is configured yet

## Troubleshooting

- **`ATLASDB_URL is required`**: set the connection string locally in `.env` or
  in your deployment environment.
- **Atlas connection timeout/authentication error**: check the connection URI,
  URL-encode special credentials, verify the Atlas database user, and check
  Network Access.
- **`SESSION_SECRET is required in production`**: set a stable secret in the
  deployment environment and restart the app.
- **Sessions disappear after deploy**: use the same `SESSION_SECRET` across
  restarts, confirm the `sessions` collection is accessible, and ensure the
  HTTPS proxy settings are correct.
- **Cloudinary upload fails**: verify all three Cloudinary environment
  variables, allowed file type, and 5 MB size limit.
