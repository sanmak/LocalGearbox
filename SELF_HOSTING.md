# Self-Hosting Guide

LocalGearbox is designed to be easily self-hosted on your own infrastructure. This guide covers various deployment options.

## Prerequisites

- **Docker:** (Recommended) Installed and running.
- **Node.js:** version 24 or higher (if not using Docker).
- **npm:** or another package manager like Yarn or pnpm.

## Deployment Options

### Option 1: Docker (Recommended)

The easiest way to get LocalGearbox up and running is using Docker. The image supports **multi-platform builds** for both `linux/amd64` and `linux/arm64` architectures.

#### Using Pre-built Image

The fastest way to run LocalGearbox is using the official pre-built image:

```bash
# Pull and run the latest multi-platform image
docker run -p 3000:3000 ghcr.io/sanmak/localgearbox:latest

# For specific platform (optional - Docker auto-detects)
docker run --platform linux/amd64 -p 3000:3000 ghcr.io/sanmak/localgearbox:latest
docker run --platform linux/arm64 -p 3000:3000 ghcr.io/sanmak/localgearbox:latest
```

Access LocalGearbox at `http://localhost:3000`.

#### Building from Source

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/sanmak/LocalGearbox.git
    cd local-gearbox
    ```

2.  **Build the Docker image:**

    ```bash
    # Standard build (auto-detects your platform)
    docker build -t local-gearbox .

    # Multi-platform build (requires Docker Buildx)
    docker buildx build --platform linux/amd64,linux/arm64 -t local-gearbox .

    # Build for specific platform
    docker buildx build --platform linux/amd64 -t local-gearbox .
    docker buildx build --platform linux/arm64 -t local-gearbox .
    ```

3.  **Run the container:**
    ```bash
    docker run -p 3000:3000 local-gearbox
    ```
    Access LocalGearbox at `http://localhost:3000`.

### Option 2: Docker Compose

If you prefer using Docker Compose, we provide a `docker-compose.yml` file with multi-platform support.

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/sanmak/LocalGearbox.git
    cd local-gearbox
    ```

2.  **Start the services:**

    ```bash
    # Auto-detects and builds for your platform
    docker-compose up -d
    ```

    LocalGearbox will be available at `http://localhost:3000`.

3.  **Platform override (optional):**

    The `docker-compose.yml` is configured for `linux/amd64` by default. For ARM64 systems (Apple Silicon, ARM servers):

    ```bash
    # Edit docker-compose.yml and change:
    # platform: linux/amd64  →  platform: linux/arm64

    docker-compose up -d
    ```

### Option 3: Static Export (Recommended for Production)

LocalGearbox uses Next.js static export, generating a fully static site that can be deployed anywhere without a Node.js server. This option provides maximum flexibility and security.

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/sanmak/LocalGearbox.git
    cd local-gearbox
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Build the static export:**

    ```bash
    npm run build
    ```

    This generates a static site in the `out/` directory.

4.  **Deploy the `out/` directory to any static hosting:**
    - **Vercel:** `vercel --prod` (auto-detects Next.js static export)
    - **Netlify:** Drag & drop `out/` folder to Netlify dashboard
    - **GitHub Pages:** Push `out/` contents to `gh-pages` branch
    - **AWS S3 + CloudFront:** Upload `out/` to S3 bucket, configure CloudFront
    - **Cloudflare Pages:** Connect repository or upload `out/` directory
    - **nginx/Apache:** Serve `out/` directory as document root

5.  **For local testing:**
    ```bash
    npm start
    ```
    This serves the static files locally on port 3000.

#### Static Hosting Examples

**nginx configuration:**

```nginx
server {
    listen 80;
    server_name localgearbox.yourdomain.com;
    root /var/www/localgearbox/out;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    # Security headers (REQUIRED - Next.js config headers don't work with static export on nginx)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Content-Security-Policy (see next.config.js for reference)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: ws: wss:; frame-src 'self' https: http:; media-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests" always;

    # HSTS (only if serving over HTTPS)
    # add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
}
```

**Apache configuration (.htaccess):**

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /$1.html [L]

# Security headers (REQUIRED - Next.js config headers don't work with static export on Apache)
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"

# Content-Security-Policy (see next.config.js for reference)
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: ws: wss:; frame-src 'self' https: http:; media-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"

# HSTS (only if serving over HTTPS)
# Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
```

**GitHub Pages deployment:**

LocalGearbox includes automated GitHub Pages deployment via GitHub Actions.

**Option A: Automated Deployment (Recommended)**

1. **Enable GitHub Pages in repository settings:**
   - Go to Settings → Pages
   - Source: "GitHub Actions"

2. **Configure base path (if needed):**
   - **Custom domain (e.g., localgearbox.com)**: No configuration needed
   - **Root deployment (e.g., username.github.io)**: No configuration needed
   - **Repository deployment (e.g., username.github.io/repo-name)**:
     - Go to Settings → Secrets and variables → Actions
     - Add repository secret: `NEXT_PUBLIC_BASE_PATH` = `/repo-name`

3. **Trigger deployment:**
   - Push to `main` branch, or
   - Go to Actions → Deploy to GitHub Pages → Run workflow

The workflow automatically builds and deploys to GitHub Pages.

**Option B: Manual Deployment**

```bash
# Build with base path (if deploying to username.github.io/repo-name)
NEXT_PUBLIC_BASE_PATH=/repo-name npm run build

# Or for custom domain/root deployment
npm run build

# Deploy using gh-pages branch
cd out
git init
git add -A
git commit -m "Deploy to GitHub Pages"
git branch -M gh-pages
git remote add origin https://github.com/yourusername/localgearbox.git
git push -u origin gh-pages --force
```

**Important GitHub Pages Notes:**

- The `.nojekyll` file is automatically included to prevent Jekyll processing
- Assets will be served from the correct base path automatically
- For custom domains, add a `CNAME` file to the `public/` directory before building

### Option 4: Manual Installation with Node.js Server

If you prefer running with a Node.js server (not recommended for production due to static export being available):

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/sanmak/LocalGearbox.git
    cd local-gearbox
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Build the application:**

    ```bash
    npm run build
    ```

4.  **Start with Node.js server (use `start:next` for traditional Next.js server):**
    ```bash
    npm run start:next
    ```
    The application will start on port 3000 by default.

> [!NOTE]
> Since LocalGearbox is 100% client-side, using static export (Option 3) is recommended for production. It provides better security, performance, and deployment flexibility.

## Static Export Architecture

LocalGearbox is built as a **100% client-side application** using Next.js static export. This means:

- ✅ **No Node.js server required** — Deploy as static files anywhere
- ✅ **No server-side APIs** — All 80+ tools execute in the browser
- ✅ **Maximum deployment flexibility** — Works on any static hosting
- ✅ **Better security** — Reduced attack surface with no server runtime
- ✅ **CDN-ready** — Serve from global CDNs for best performance
- ✅ **Air-gap compatible** — Works in completely offline environments

### Static Export Output

After running `npm run build`, the `out/` directory contains:

```
out/
├── index.html              # Homepage
├── tools/                  # All 84 tool pages (static HTML)
│   ├── json-formatter.html
│   ├── api-client.html
│   └── ...
├── _next/                  # Optimized JS/CSS bundles
│   ├── static/
│   └── ...
├── .nojekyll              # GitHub Pages compatibility
└── manifest.json          # PWA manifest
```

All files are **static HTML/JS/CSS** — no server runtime needed!

### Security Headers

**Platform-Specific Header Behavior:**

| Platform                        | Headers Source                      | Action Required                     |
| :------------------------------ | :---------------------------------- | :---------------------------------- |
| Vercel                          | ✅ Auto-applied from next.config.js | None - works automatically          |
| Netlify                         | ✅ Auto-applied from next.config.js | None - works automatically          |
| Cloudflare Pages (Next.js mode) | ✅ Auto-applied from next.config.js | None - works automatically          |
| nginx                           | ❌ Ignored from next.config.js      | **MUST configure in nginx.conf**    |
| Apache                          | ❌ Ignored from next.config.js      | **MUST configure in .htaccess**     |
| AWS S3 + CloudFront             | ❌ Ignored from next.config.js      | **MUST configure in CloudFront**    |
| GitHub Pages                    | ❌ Ignored from next.config.js      | Limited - consider using Cloudflare |

The headers defined in [next.config.js](../next.config.js) serve dual purposes:

1. **Automatic security** for Vercel/Netlify/Cloudflare deployments
2. **Reference documentation** for what headers to configure on other platforms

**Required Security Headers (configure at infrastructure level):**

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy: [see next.config.js for full policy]`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HTTPS only)

See nginx/Apache configuration examples above for complete header setup.

## Configuration

LocalGearbox requires **no environment variables** for production static export, as it's 100% client-side.

For development or legacy Node.js server mode:

| Variable              | Description                              | Default                 |
| :-------------------- | :--------------------------------------- | :---------------------- |
| `PORT`                | The port the application will listen on. | `3000`                  |
| `NEXT_PUBLIC_APP_URL` | The public URL of your instance.         | `http://localhost:3000` |

> [!NOTE]
> ALL 80+ tools in LocalGearbox run 100% client-side and require no server-side configuration.

## Troubleshooting

### Port Already in Use

If port 3000 is occupied, you can change it by setting the `PORT` environment variable:

```bash
PORT=4000 npm start
```

### Docker Build Failures

Ensure you have sufficient disk space and a stable internet connection for fetching base images and dependencies.

### Performance Issues

For production deployments, always use the production build (`npm run build` followed by `npm start`) rather than development mode (`npm run dev`).

## Support

If you encounter any issues, please check our [GitHub Issues](https://github.com/sanmak/LocalGearbox/issues) or join our [Discussions](https://github.com/sanmak/LocalGearbox/discussions).
