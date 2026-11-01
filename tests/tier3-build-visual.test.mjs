import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { loadSourceModule } from './helpers/loader.mjs';

const PROJECT_ROOT = process.cwd();

describe('Tier 3: Build & Visual Integrity', async () => {
  const businessModule = await loadSourceModule('./src/utils/businessHours.ts');
  const { RESTAURANT_INFO } = businessModule;

  describe('Logo Asset Integrity', () => {
    const logoPath = path.join(PROJECT_ROOT, 'public', 'logo-sanmartin.jpg');

    it('Official circular logo exists at public/logo-sanmartin.jpg', () => {
      assert.ok(fs.existsSync(logoPath), `Expected ${logoPath} to exist`);
    });

    it('Logo file is non-empty and has substantial size (> 50KB)', () => {
      const stats = fs.statSync(logoPath);
      assert.ok(stats.size > 50 * 1024, `Logo file size should be > 50KB, got ${stats.size} bytes`);
    });

    it('Logo file has valid JPEG magic bytes (FF D8 FF)', () => {
      const buffer = fs.readFileSync(logoPath);
      assert.strictEqual(buffer[0], 0xff, 'Byte 0 must be 0xFF');
      assert.strictEqual(buffer[1], 0xd8, 'Byte 1 must be 0xD8');
      assert.strictEqual(buffer[2], 0xff, 'Byte 2 must be 0xFF');
    });

    it('index.html links to logo asset for favicon and OpenGraph', () => {
      const htmlContent = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf-8');
      assert.ok(htmlContent.includes('href="/logo-sanmartin.jpg"'), 'index.html must reference logo in link rel=icon');
      assert.ok(htmlContent.includes('content="/logo-sanmartin.jpg"'), 'index.html must reference logo in og:image');
    });
  });

  describe('CSS & Viewport Responsive Checks (Mobile 375px+)', () => {
    it('index.html includes viewport meta tag with width=device-width', () => {
      const htmlContent = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf-8');
      assert.match(
        htmlContent,
        /<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width[^"']*["']\s*\/?>/i,
        'index.html must contain proper mobile viewport meta tag'
      );
    });

    it('src/index.css configures overflow-x protection to prevent horizontal scroll', () => {
      const cssContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'index.css'), 'utf-8');
      assert.ok(
        cssContent.includes('overflow-x: hidden') || cssContent.includes('overflow-x: clip'),
        'src/index.css must specify overflow-x: hidden or clip on body/html'
      );
    });

    it('src/index.css defines brand color palette tokens (#0D0D0D, #DC2626, #FACC15)', () => {
      const cssContent = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'index.css'), 'utf-8');
      assert.ok(cssContent.includes('#0d0d0d') || cssContent.includes('#0D0D0D'), 'Missing brand dark #0D0D0D');
      assert.ok(cssContent.includes('#dc2626') || cssContent.includes('#DC2626'), 'Missing crimson red #DC2626');
      assert.ok(cssContent.includes('#facc15') || cssContent.includes('#FACC15'), 'Missing golden yellow #FACC15');
    });
  });

  describe('Navigation & External Destination Links', () => {
    it('Coordinates and address reference Av. Gabriela Oriente #01216, Puente Alto', () => {
      assert.ok(RESTAURANT_INFO.address.includes('Gabriela Oriente #01216'), 'Address must reference Gabriela Oriente #01216');
      assert.ok(RESTAURANT_INFO.address.includes('Puente Alto'), 'Address must reference Puente Alto');
    });

    it('Google Maps navigation link points to verified location', () => {
      assert.ok(RESTAURANT_INFO.googleMapsUrl.startsWith('https://maps.google.com/'), 'Google Maps URL must start with maps.google.com');
      assert.ok(RESTAURANT_INFO.googleMapsUrl.includes('Puente+Alto') || RESTAURANT_INFO.googleMapsUrl.includes('Puente%20Alto'));
    });

    it('Waze navigation link is valid', () => {
      assert.ok(RESTAURANT_INFO.wazeUrl.startsWith('https://waze.com/'), 'Waze URL must start with waze.com');
    });

    it('Delivery shortcuts (PedidosYa and Uber Eats) are defined', () => {
      assert.ok(RESTAURANT_INFO.pedidosYaUrl && RESTAURANT_INFO.pedidosYaUrl.startsWith('https://'));
      assert.ok(RESTAURANT_INFO.uberEatsUrl && RESTAURANT_INFO.uberEatsUrl.startsWith('https://'));
    });
  });

  describe('Production Build Execution', () => {
    it('Vite build executes cleanly with exit code 0', () => {
      // Execute npx vite build synchronously
      let buildOutput;
      try {
        buildOutput = execSync('npx vite build', {
          cwd: PROJECT_ROOT,
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: 45000,
        });
      } catch (err) {
        assert.fail(`Vite build failed with exit code ${err.status}: ${err.stderr || err.message}`);
      }

      assert.ok(buildOutput.includes('built in') || fs.existsSync(path.join(PROJECT_ROOT, 'dist')), 'Build must emit success status');
      assert.ok(fs.existsSync(path.join(PROJECT_ROOT, 'dist', 'index.html')), 'dist/index.html must exist after build');
    });
  });
});
